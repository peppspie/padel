import type { Tournament, Match } from '../types';

const STORAGE_KEY = 'padel_tournaments';

export const storageService = {
  getAllTournaments: (): Tournament[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading tournaments:', error);
      return [];
    }
  },

  getTournament: (id: string): Tournament | undefined => {
    const tournaments = storageService.getAllTournaments();
    return tournaments.find(t => t.id === id);
  },

  saveTournament: (tournament: Tournament): void => {
    const tournaments = storageService.getAllTournaments();
    const index = tournaments.findIndex(t => t.id === tournament.id);
    
    if (index >= 0) {
      tournaments[index] = tournament;
    } else {
      tournaments.push(tournament);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
  },

  updateMatch: (tournamentId: string, match: Match): void => {
    const tournament = storageService.getTournament(tournamentId);
    if (!tournament) return;

    // Find and update match in groups
    for (const group of tournament.groups) {
      const matchIndex = group.matches.findIndex(m => m.id === match.id);
      if (matchIndex !== -1) {
        group.matches[matchIndex] = match;
        storageService.saveTournament(tournament);
        return;
      }
    }
    
    // TODO: Add logic for knockout matches when implemented
  },

  deleteTournament: (id: string): void => {
    const tournaments = storageService.getAllTournaments();
    const newTournaments = tournaments.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTournaments));
  }
};
