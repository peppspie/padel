export interface Team {
  id: string;
  name: string; 
  players: [string, string]; // Names of the two players
}

export type MatchStatus = 'scheduled' | 'in_progress' | 'completed';

export interface SetScore {
  teamA: number;
  teamB: number;
  tieBreak?: {
    teamA: number;
    teamB: number;
  };
}

export interface MatchScore {
  sets: SetScore[];
  winnerId?: string;
}

export interface Match {
  id: string;
  teamAId: string;
  teamBId: string;
  score: MatchScore;
  status: MatchStatus;
  roundName: string; // e.g., "Group A", "Quarter Final"
  timestamp: number;
}

export interface TournamentConfig {
  name: string;
  type: 'groups' | 'knockout' | 'mixed'; // mixed = groups -> knockout
  scoring: {
    gamesPerSet: number; // usually 6
    setsToWin: number; // usually 2 (best of 3)
    tieBreakAt: number; // usually 6 (6-6)
    decidingPoint: boolean; // "Killer point" on 40-40 (optional feature)
    superTieBreakInFinalSet: boolean; // if true, last set is a tie-break to 10
  };
  groupStage?: {
    passingTeamsPerGroup: number;
  };
}

export interface Group {
  id: string;
  name: string;
  teamIds: string[];
  matches: Match[]; // Matches within this group
}

export interface KnockoutStage {
  matches: Match[]; // Can be organized by round (e.g., via roundName or a round index)
}

export interface Tournament {
  id: string;
  config: TournamentConfig;
  teams: Team[];
  groups: Group[];
  knockout: KnockoutStage;
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
}
