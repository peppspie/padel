import type { Tournament, TournamentConfig, Team, Group, Match, MatchStatus } from '../types';
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

export function createTournament(
  config: TournamentConfig,
  teams: Team[]
): Tournament {
  const tournamentId = generateId();
  const shuffledTeams = shuffle(teams);
  let groups: Group[] = [];
  
  // LOGIC FOR GROUPS
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
  }

  return {
    id: tournamentId,
    config,
    teams,
    groups,
    knockout: { matches: [] },
    status: 'active',
    createdAt: new Date().toISOString()
  };
}