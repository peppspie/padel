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
          roundName: 'tournament.rounds.groupRound',
          roundNumber: round + 1,
          timestamp: Date.now()
        });
      }
    }

    // Rotate teams for next round (keep first fixed)
    teams.splice(1, 0, teams.pop()!);
  }

  return matches;
}

function getRoundNameKey(size: number): string {
  if (size === 2) return 'tournament.rounds.final';
  if (size === 4) return 'tournament.rounds.semiFinal';
  if (size === 8) return 'tournament.rounds.quarterFinal';
  if (size === 16) return 'tournament.rounds.roundOf16';
  return `tournament.rounds.roundOf${size}`;
}

export function generateKnockoutBracket(teams: Team[]): Match[] {
  const matches: Match[] = [];
  const n = teams.length;
  
  // Find next power of 2
  let size = 1;
  while (size < n) size *= 2;

  const roundNameKey = getRoundNameKey(size);
  
  for (let i = 0; i < n; i += 2) {
    if (i + 1 < n) {
      matches.push({
        id: generateId(),
        teamAId: teams[i].id,
        teamBId: teams[i+1].id,
        score: { sets: [] },
        status: 'scheduled',
        roundName: roundNameKey,
        timestamp: Date.now()
      });
    }
  }

  return matches;
}

function getNextRoundNameKey(currentRoundMatchesCount: number): string | null {
  // If current round had 4 matches (Quarter), next has 2 (Semi)
  // If current had 2 (Semi), next has 1 (Final)
  if (currentRoundMatchesCount === 4) return 'tournament.rounds.semiFinal';
  if (currentRoundMatchesCount === 2) return 'tournament.rounds.final';
  if (currentRoundMatchesCount === 8) return 'tournament.rounds.quarterFinal';
  return null;
}

export function advanceKnockoutWinner(tournament: Tournament, completedMatch: Match): void {
  if (!tournament.knockout || !completedMatch.score.winnerId) return;

  const currentRoundNameKey = completedMatch.roundName;
  const roundMatches = tournament.knockout.matches.filter(m => m.roundName === currentRoundNameKey);
  const matchIndex = roundMatches.findIndex(m => m.id === completedMatch.id);
  if (matchIndex === -1) return;

  const nextRoundNameKey = getNextRoundNameKey(roundMatches.length);
  if (!nextRoundNameKey) return;

  const nextMatchIndex = Math.floor(matchIndex / 2);
  const targetSlot = matchIndex % 2 === 0 ? 'teamAId' : 'teamBId';

  let nextMatch = tournament.knockout.matches.find(m => 
    m.roundName === nextRoundNameKey && 
    tournament.knockout.matches.filter(x => x.roundName === nextRoundNameKey).indexOf(m) === nextMatchIndex
  );

  if (nextMatch) {
    nextMatch[targetSlot] = completedMatch.score.winnerId;
  } else {
    const newMatch: Match = {
      id: generateId(),
      teamAId: targetSlot === 'teamAId' ? completedMatch.score.winnerId : '',
      teamBId: targetSlot === 'teamBId' ? completedMatch.score.winnerId : '',
      score: { sets: [] },
      status: 'scheduled',
      roundName: nextRoundNameKey,
      timestamp: Date.now()
    };
    tournament.knockout.matches.push(newMatch);
  }
}

export function calculateStandings(group: Group): TeamStats[] {
  const statsMap: Record<string, TeamStats> = {};

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

  group.matches.forEach(match => {
    if (match.status !== 'completed' || !match.score.winnerId) return;
    const tA = statsMap[match.teamAId];
    const tB = statsMap[match.teamBId];
    if (!tA || !tB) return;
    tA.played++;
    tB.played++;
    if (match.score.winnerId === match.teamAId) {
      tA.won++;
      tA.points += 2;
      tB.lost++;
    } else {
      tB.won++;
      tB.points += 2;
      tA.lost++;
    }
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

  return Object.values(statsMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diffSetsA = a.setsWon - a.setsLost;
    const diffSetsB = b.setsWon - b.setsLost;
    if (diffSetsB !== diffSetsA) return diffSetsB - diffSetsA;
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
  
  // Logic based on stages
  if (config.stages.groupStage) {
    // Generate Groups
    const numGroups = teams.length > 5 ? 2 : 1;
    const groupBuckets: string[][] = Array.from({ length: numGroups }, () => []);
    shuffledTeams.forEach((team, index) => {
      groupBuckets[index % numGroups].push(team.id);
    });

    groups = groupBuckets.map((bucket, index) => {
      const matches = generateRoundRobinMatches(bucket);
      return {
        id: generateId(),
        name: String.fromCharCode(65 + index), 
        teamIds: bucket,
        matches: matches
      };
    });
  } else if (config.stages.knockoutStage) {
    // Generate Bracket directly (Knockout Only)
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
