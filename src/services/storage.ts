import type { Tournament } from '../types';

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

  deleteTournament: (id: string): void => {
    const tournaments = storageService.getAllTournaments();
    const newTournaments = tournaments.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTournaments));
  }
};
