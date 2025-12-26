import type { Tournament, TournamentConfig, Team, Group, Match, MatchStatus, TeamStats } from '../types';
import { generateId } from '../utils';

/**
 * Internal helper to shuffle an array using the Fisher-Yates algorithm.
 */
function shuffle<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

/**
 * Factory function to create a new knockout match object.
 */
function createKnockoutMatch(teamA: Team, teamB: Team, roundName: string): Match {
  return {
    id: generateId(),
    teamAId: teamA.id,
    teamBId: teamB.id,
    score: { sets: [] },
    status: 'scheduled',
    roundName: roundName,
    timestamp: Date.now()
  };
}

/**
 * Generates a Round Robin match schedule for a given set of teams.
 * @param {string[]} teamIds - Array of team IDs participating in the group.
 * @returns {Match[]} Array of scheduled matches.
 */
function generateRoundRobinMatches(teamIds: string[]): Match[] {
  const matches: Match[] = [];
  const teams = [...teamIds];
  if (teams.length % 2 !== 0) teams.push('bye');

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
    teams.splice(1, 0, teams.pop()!);
  }
  return matches;
}

/**
 * Determines the translation key for a round based on the number of participants.
 * @param {number} size - Number of teams or matches in the round.
 */
function getRoundNameKey(size: number): string {
  if (size === 2) return 'tournament.rounds.final';
  if (size === 4) return 'tournament.rounds.semiFinal';
  if (size === 8) return 'tournament.rounds.quarterFinal';
  if (size === 16) return 'tournament.rounds.roundOf16';
  return `tournament.rounds.roundOf${size}`;
}

/**
 * Generates an initial knockout bracket for a list of teams.
 * @param {Team[]} teams - List of participating teams.
 * @returns {Match[]} Array of first-round matches.
 */
export function generateKnockoutBracket(teams: Team[]): Match[] {
  const matches: Match[] = [];
  const n = teams.length;
  let size = 1;
  while (size < n) size *= 2;
  const roundNameKey = getRoundNameKey(size);
  for (let i = 0; i < n; i += 2) {
    if (i + 1 < n) {
      matches.push(createKnockoutMatch(teams[i], teams[i+1], roundNameKey));
    }
  }
  return matches;
}

/**
 * Determines the next round name key based on the match count of the current round.
 */
function getNextRoundNameKey(currentRoundMatchesCount: number): string | null {
  if (currentRoundMatchesCount === 4) return 'tournament.rounds.semiFinal';
  if (currentRoundMatchesCount === 2) return 'tournament.rounds.final';
  if (currentRoundMatchesCount === 8) return 'tournament.rounds.quarterFinal';
  return null;
}

/**
 * Handles the advancement of a winner to the next round in a knockout stage.
 * @param {Tournament} tournament - The tournament object.
 * @param {Match} completedMatch - The match that was just finished.
 */
export function advanceKnockoutWinner(tournament: Tournament, completedMatch: Match): void {
  if (!tournament.knockout || !completedMatch.score.winnerId) return;
  const currentRoundNameKey = completedMatch.roundName;
  const roundMatches = tournament.knockout.matches.filter((m: Match) => m.roundName === currentRoundNameKey);
  const matchIndex = roundMatches.findIndex((m: Match) => m.id === completedMatch.id);
  if (matchIndex === -1) return;
  const nextRoundNameKey = getNextRoundNameKey(roundMatches.length);
  if (!nextRoundNameKey) return;
  const nextMatchIndex = Math.floor(matchIndex / 2);
  const targetSlot = matchIndex % 2 === 0 ? 'teamAId' : 'teamBId';
  const nextMatch = tournament.knockout.matches.find((m: Match) => 
    m.roundName === nextRoundNameKey && 
    tournament.knockout.matches.filter((x: Match) => x.roundName === nextRoundNameKey).indexOf(m) === nextMatchIndex
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

/**
 * Calculates standings for a specific group based on completed matches.
 * Sorts teams by points, then set difference, then game difference.
 * @param {Group} group - The group stage object.
 * @returns {TeamStats[]} Ranked array of team statistics.
 */
export function calculateStandings(group: Group): TeamStats[] {
  const statsMap: Record<string, TeamStats> = {};
  group.teamIds.forEach((id: string) => {
    statsMap[id] = { teamId: id, played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0, points: 0 };
  });
  group.matches.forEach((match: Match) => {
    if (match.status !== 'completed' || !match.score.winnerId) return;
    const tA = statsMap[match.teamAId];
    const tB = statsMap[match.teamBId];
    if (!tA || !tB) return;
    tA.played++; tB.played++;
    if (match.score.winnerId === match.teamAId) { tA.won++; tA.points += 2; tB.lost++; }
    else { tB.won++; tB.points += 2; tA.lost++; }
    match.score.sets.forEach((set: any) => {
      tA.setsWon += set.teamA > set.teamB ? 1 : 0;
      tA.setsLost += set.teamA < set.teamB ? 1 : 0;
      tB.setsWon += set.teamB > set.teamA ? 1 : 0;
      tB.setsLost += set.teamB < set.teamA ? 1 : 0;
      tA.gamesWon += set.teamA; tA.gamesLost += set.teamB;
      tB.gamesWon += set.teamB; tB.gamesLost += set.teamA;
    });
  });
  return Object.values(statsMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diffSetsA = a.setsWon - a.setsLost;
    const diffSetsB = b.setsWon - b.setsLost;
    if (diffSetsB !== diffSetsA) return diffSetsB - diffSetsA;
    return (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost);
  });
}

/**
 * Promotes top teams from each group to a new knockout bracket using cross-seeding.
 * @param {Tournament} tournament - The tournament object.
 * @returns {Match[]} Array of first-round knockout matches.
 */
export function generateKnockoutFromGroups(tournament: Tournament): Match[] {
  const teamsPerGroup = tournament.config.advancement.teamsPerGroup;
  const sortedGroups = [...tournament.groups].sort((a, b) => a.name.localeCompare(b.name));
  const rankedTeams: Team[][] = sortedGroups.map(group => {
    const standings = calculateStandings(group);
    return standings.slice(0, teamsPerGroup).map(s => {
      return tournament.teams.find(t => t.id === s.teamId)!;
    });
  });

  const numGroups = rankedTeams.length;
  const totalQualifiers = numGroups * teamsPerGroup;
  const roundNameKey = getRoundNameKey(totalQualifiers);
  const matches: Match[] = [];

  // 2 groups cross-seed: 1st Group A vs 2nd Group B, 1st Group B vs 2nd Group A
  if (numGroups === 2 && teamsPerGroup === 2) {
    matches.push(createKnockoutMatch(rankedTeams[0][0], rankedTeams[1][1], roundNameKey));
    matches.push(createKnockoutMatch(rankedTeams[1][0], rankedTeams[0][1], roundNameKey));
    return matches;
  }

  // 1 group seed: 1st vs 4th, 2nd vs 3rd
  if (numGroups === 1) {
    const teams = rankedTeams[0];
    for (let i = 0; i < Math.floor(teams.length / 2); i++) {
      matches.push(createKnockoutMatch(teams[i], teams[teams.length - 1 - i], roundNameKey));
    }
    return matches;
  }

  // 4 groups block cross-seed (A-B, C-D)
  if (numGroups === 4 && teamsPerGroup === 2) {
    matches.push(createKnockoutMatch(rankedTeams[0][0], rankedTeams[1][1], roundNameKey)); 
    matches.push(createKnockoutMatch(rankedTeams[2][0], rankedTeams[3][1], roundNameKey)); 
    matches.push(createKnockoutMatch(rankedTeams[1][0], rankedTeams[0][1], roundNameKey)); 
    matches.push(createKnockoutMatch(rankedTeams[3][0], rankedTeams[2][1], roundNameKey)); 
    return matches;
  }

  const flatQualifiers: Team[] = [];
  rankedTeams.forEach(groupTeams => flatQualifiers.push(...groupTeams));
  return generateKnockoutBracket(flatQualifiers);
}

/**
 * Main factory to initialize a tournament structure based on provided configuration.
 * @param {TournamentConfig} config - Tournament rules and stages.
 * @param {Team[]} teams - Participating teams.
 */
export function createTournament(config: TournamentConfig, teams: Team[]): Tournament {
  const tournamentId = generateId();
  const shuffledTeams = shuffle(teams);
  let groups: Group[] = [];
  let knockoutMatches: Match[] = [];
  if (config.stages.groupStage) {
    const numGroups = config.advancement.numGroups;
    const groupBuckets: string[][] = Array.from({ length: numGroups }, () => []);
    shuffledTeams.forEach((team, index) => { groupBuckets[index % numGroups].push(team.id); });
    groups = groupBuckets.map((bucket, index) => {
      const matches = generateRoundRobinMatches(bucket);
      return { id: generateId(), name: String.fromCharCode(65 + index), teamIds: bucket, matches: matches };
    });
  } else if (config.stages.knockoutStage) {
    knockoutMatches = generateKnockoutBracket(shuffledTeams);
  }
  return { id: tournamentId, config, teams, groups, knockout: { matches: knockoutMatches }, status: 'active', createdAt: new Date().toISOString() };
}
