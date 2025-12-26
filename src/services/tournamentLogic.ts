import type { Tournament, TournamentConfig, Team, Group, Match, MatchStatus, TeamStats } from '../types';
import { generateId } from '../utils';

// Helper to shuffle array (Fisher-Yates)
function shuffle<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// Generate Round Robin matches for a list of team IDs
// Uses Berger tables algorithm or simple rotation
function generateRoundRobinMatches(teamIds: string[]): Match[] {
  const matches: Match[] = [];
  const teams = [...teamIds];
  
  // If odd number of teams, add a dummy team for "bye"
  if (teams.length % 2 !== 0) {
    teams.push('bye');
  }

  const numRounds = teams.length - 1;
  const halfSize = teams.length / 2;

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < halfSize; i++) {
      const t1 = teams[i];
      const t2 = teams[teams.length - 1 - i];

      if (t1 !== 'bye' && t2 !== 'bye') {
        matches.push({
          id: generateId(),
          teamAId: t1,
          teamBId: t2,
          score: { sets: [] },
          status: 'scheduled' as MatchStatus,
          roundName: `Round ${round + 1}`,
          timestamp: Date.now()
        });
      }
    }

    // Rotate teams for next round (keep first fixed)
    teams.splice(1, 0, teams.pop()!);
  }

  return matches;
}

// ... imports

function getNextRoundName(currentRoundMatchesCount: number): string | null {
  if (currentRoundMatchesCount === 8) return 'Quarter Final'; // Was Round of 16
  if (currentRoundMatchesCount === 4) return 'Semi Final';    // Was Quarter Final
  if (currentRoundMatchesCount === 2) return 'Final';         // Was Semi Final
  if (currentRoundMatchesCount === 1) return null;            // Was Final
  return `Next Round`; // Fallback
}

export function advanceKnockoutWinner(tournament: Tournament, completedMatch: Match): void {
  if (!tournament.knockout || !completedMatch.score.winnerId) return;

  const currentRoundName = completedMatch.roundName;
  // Get all matches of this round to determine index
  // We assume matches are stored in order or can be found sequentially
  const roundMatches = tournament.knockout.matches.filter(m => m.roundName === currentRoundName);
  
  // Find index of completed match in this round (0, 1, 2, 3...)
  const matchIndex = roundMatches.findIndex(m => m.id === completedMatch.id);
  if (matchIndex === -1) return;

  // Calculate next match details
  const nextRoundName = getNextRoundName(roundMatches.length);
  if (!nextRoundName) return; // Tournament finished

  const nextMatchIndex = Math.floor(matchIndex / 2);
  const targetSlot = matchIndex % 2 === 0 ? 'teamAId' : 'teamBId';

  // Find if next match already exists
  let nextMatch = tournament.knockout.matches.find(m => 
    m.roundName === nextRoundName && 
    // We need a way to identify specific matches in next round. 
    // Since we create them dynamically, the N-th match of next round corresponds to N-th index in the filtered list
    tournament.knockout.matches.filter(x => x.roundName === nextRoundName).indexOf(m) === nextMatchIndex
  );

  if (nextMatch) {
    // Update existing match
    nextMatch[targetSlot] = completedMatch.score.winnerId;
  } else {
    // Create new match
    const newMatch: Match = {
      id: generateId(),
      teamAId: targetSlot === 'teamAId' ? completedMatch.score.winnerId : '',
      teamBId: targetSlot === 'teamBId' ? completedMatch.score.winnerId : '',
      score: { sets: [] },
      status: 'scheduled',
      roundName: nextRoundName,
      timestamp: Date.now()
    };
    tournament.knockout.matches.push(newMatch);
  }
}

export function generateKnockoutBracket(teams: Team[]): Match[] {
  const matches: Match[] = [];
  const n = teams.length;
  
  // Find next power of 2
  let size = 1;
  while (size < n) size *= 2;

  // Create first round matches
  const roundName = size === 4 ? 'Semi Final' : size === 8 ? 'Quarter Final' : size === 2 ? 'Final' : `Round of ${size}`;
  
  for (let i = 0; i < n; i += 2) {
    if (i + 1 < n) {
      matches.push({
        id: generateId(),
        teamAId: teams[i].id,
        teamBId: teams[i+1].id,
        score: { sets: [] },
        status: 'scheduled',
        roundName: roundName,
        timestamp: Date.now()
      });
    }
  }

  return matches;
}

export function calculateStandings(group: Group): TeamStats[] {
  const statsMap: Record<string, TeamStats> = {};

  // Initialize stats for each team in the group
  group.teamIds.forEach(id => {
    statsMap[id] = {
      teamId: id,
      played: 0,
      won: 0,
      lost: 0,
      setsWon: 0,
      setsLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      points: 0
    };
  });

  // Process completed matches
  group.matches.forEach(match => {
    if (match.status !== 'completed' || !match.score.winnerId) return;

    const tA = statsMap[match.teamAId];
    const tB = statsMap[match.teamBId];

    if (!tA || !tB) return;

    tA.played++;
    tB.played++;

    // Winner/Loser and Points
    if (match.score.winnerId === match.teamAId) {
      tA.won++;
      tA.points += 2;
      tB.lost++;
    } else {
      tB.won++;
      tB.points += 2;
      tA.lost++;
    }

    // Sets and Games
    match.score.sets.forEach(set => {
      tA.setsWon += set.teamA > set.teamB ? 1 : 0;
      tA.setsLost += set.teamA < set.teamB ? 1 : 0;
      tB.setsWon += set.teamB > set.teamA ? 1 : 0;
      tB.setsLost += set.teamB < set.teamA ? 1 : 0;

      tA.gamesWon += set.teamA;
      tA.gamesLost += set.teamB;
      tB.gamesWon += set.teamB;
      tB.gamesLost += set.teamA;
    });
  });

  // Convert to array and sort
  return Object.values(statsMap).sort((a, b) => {
    // 1. Points
    if (b.points !== a.points) return b.points - a.points;
    // 2. Set Difference
    const diffSetsA = a.setsWon - a.setsLost;
    const diffSetsB = b.setsWon - b.setsLost;
    if (diffSetsB !== diffSetsA) return diffSetsB - diffSetsA;
    // 3. Game Difference
    const diffGamesA = a.gamesWon - a.gamesLost;
    const diffGamesB = b.gamesWon - b.gamesLost;
    return diffGamesB - diffGamesA;
  });
}

export function createTournament(
  config: TournamentConfig,
  teams: Team[]
): Tournament {
  const tournamentId = generateId();
  const shuffledTeams = shuffle(teams);
  let groups: Group[] = [];
  let knockoutMatches: Match[] = [];
  
  if (config.type === 'groups' || config.type === 'mixed') {
    // For now, let's put everyone in 1 group if teams <= 5, 
    // or split into 2 groups if > 5. 
    const numGroups = teams.length > 5 ? 2 : 1;
    
    // Distribute teams into groups
    const groupBuckets: string[][] = Array.from({ length: numGroups }, () => []);
    shuffledTeams.forEach((team, index) => {
      groupBuckets[index % numGroups].push(team.id);
    });

    groups = groupBuckets.map((bucket, index) => {
      const matches = generateRoundRobinMatches(bucket);
      return {
        id: generateId(),
        name: `Group ${String.fromCharCode(65 + index)}`, // Group A, Group B...
        teamIds: bucket,
        matches: matches
      };
    });
  } else if (config.type === 'knockout') {
    // Generate full bracket directly
    knockoutMatches = generateKnockoutBracket(shuffledTeams);
  }

  return {
    id: tournamentId,
    config,
    teams,
    groups,
    knockout: { matches: knockoutMatches },
    status: 'active',
    createdAt: new Date().toISOString()
  };
}