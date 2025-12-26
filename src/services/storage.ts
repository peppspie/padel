import type { Tournament, Match } from '../types';
import { advanceKnockoutWinner } from './tournamentLogic';

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
    
    // Find and update match in knockout
    if (tournament.knockout) {
      const matchIndex = tournament.knockout.matches.findIndex(m => m.id === match.id);
      if (matchIndex !== -1) {
        tournament.knockout.matches[matchIndex] = match;
        
        // Handle advancement if match is completed
        if (match.status === 'completed') {
          advanceKnockoutWinner(tournament, match);
        }
        
        storageService.saveTournament(tournament);
        return;
      }
    }
  },

  deleteTournament: (id: string): void => {
    const tournaments = storageService.getAllTournaments();
    const newTournaments = tournaments.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTournaments));
  }
};