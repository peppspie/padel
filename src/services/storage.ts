import type { Tournament, Match } from '../types';
import { advanceKnockoutWinner } from './tournamentLogic';

const STORAGE_KEY = 'padel_tournaments';

/**
 * Service for managing tournament data persistence in LocalStorage.
 */
export const storageService = {
  /**
   * Retrieves all tournaments from local storage.
   * @returns {Tournament[]} Array of tournament objects.
   */
  getAllTournaments: (): Tournament[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Finds a specific tournament by its unique ID.
   * @param {string} id - The tournament ID.
   * @returns {Tournament | undefined} The tournament object or undefined if not found.
   */
  getTournament: (id: string): Tournament | undefined => {
    const tournaments = storageService.getAllTournaments();
    return tournaments.find(t => t.id === id);
  },

  /**
   * Saves or updates a tournament in local storage.
   * @param {Tournament} tournament - The tournament object to persist.
   */
  saveTournament: (tournament: Tournament): void => {
    const tournaments = storageService.getAllTournaments();
    const index = tournaments.findIndex(t => t.id === tournament.id);
    if (index >= 0) tournaments[index] = tournament;
    else tournaments.push(tournament);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
  },

  /**
   * Updates a specific match within a tournament and handles knockout progression.
   * @param {string} tournamentId - The ID of the tournament containing the match.
   * @param {Match} match - The updated match object.
   */
  updateMatch: (tournamentId: string, match: Match): void => {
    const tournament = storageService.getTournament(tournamentId);
    if (!tournament) return;

    for (const group of tournament.groups) {
      const matchIndex = group.matches.findIndex((m: Match) => m.id === match.id);
      if (matchIndex !== -1) {
        group.matches[matchIndex] = match;
        storageService.saveTournament(tournament);
        return;
      }
    }

    if (tournament.knockout) {
      const matchIndex = tournament.knockout.matches.findIndex((m: Match) => m.id === match.id);
      if (matchIndex !== -1) {
        tournament.knockout.matches[matchIndex] = match;
        if (match.status === 'completed') advanceKnockoutWinner(tournament, match);
        storageService.saveTournament(tournament);
        return;
      }
    }
  },

  /**
   * Permanently deletes a tournament from local storage.
   * @param {string} id - The ID of the tournament to delete.
   */
  deleteTournament: (id: string): void => {
    const tournaments = storageService.getAllTournaments();
    const newTournaments = tournaments.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTournaments));
  }
};