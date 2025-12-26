export interface Team {
  id: string;
  name: string; 
  players: [string, string];
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
  roundName: string; // Key for translation
  roundNumber?: number;
  timestamp: number;
}

export interface ScoringRules {
  gamesPerSet: number;
  setsToWin: number;
  tieBreakAt: number;
  decidingPoint: boolean;
  superTieBreakInFinalSet: boolean;
}

export interface TournamentConfig {
  name: string;
  // Replaces the old 'type' string
  stages: {
    groupStage: boolean;
    knockoutStage: boolean;
  };
  scoring: {
    group: ScoringRules;
    knockout: ScoringRules;
  };
  advancement: {
    teamsPerGroup: number; // How many teams pass to knockout
  };
}

export interface TeamStats {
  teamId: string;
  played: number;
  won: number;
  lost: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  points: number;
}

export interface Group {
  id: string;
  name: string;
  teamIds: string[];
  matches: Match[]; 
}

export interface KnockoutStage {
  matches: Match[]; 
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