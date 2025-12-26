import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Match, Team, MatchScore, SetScore } from '../types';

interface ScoreModalProps {
  match: Match;
  teamA: Team;
  teamB: Team;
  setsToWin: number;
  gamesPerSet: number;
  onClose: () => void;
  onSave: (score: MatchScore) => void;
}

export function ScoreModal({ match, teamA, teamB, setsToWin, gamesPerSet, onClose, onSave }: ScoreModalProps) {
  const { t } = useTranslation();
  const maxSets = (setsToWin * 2) - 1;

  const [sets, setSets] = useState<SetScore[]>(() => {
    let currentSets = match.score.sets.length > 0 ? [...match.score.sets] : [];
    if (currentSets.length < maxSets) {
      const needed = maxSets - currentSets.length;
      const emptySets = Array.from({ length: needed }).map(() => ({ teamA: 0, teamB: 0 }));
      currentSets = [...currentSets, ...emptySets];
    } else if (currentSets.length > maxSets) {
      currentSets = currentSets.slice(0, maxSets);
    }
    return currentSets;
  });

  const getLimit = (opponentScore: number) => {
    if (opponentScore >= gamesPerSet - 1) return gamesPerSet + 1;
    return gamesPerSet;
  };

  const updateScore = (setIndex: number, team: 'teamA' | 'teamB', value: number) => {
    const currentSet = sets[setIndex];
    const opponentScore = team === 'teamA' ? currentSet.teamB : currentSet.teamA;
    const limit = getLimit(opponentScore);
    const clampedValue = Math.max(0, Math.min(limit, value));
    const newSets = [...sets];
    if (team === 'teamA') newSets[setIndex].teamA = clampedValue;
    else newSets[setIndex].teamB = clampedValue;
    setSets(newSets);
  };

  const handleIncrement = (setIndex: number, team: 'teamA' | 'teamB', delta: number) => {
    const currentValue = team === 'teamA' ? sets[setIndex].teamA : sets[setIndex].teamB;
    updateScore(setIndex, team, currentValue + delta);
  };

  const handleSave = () => {
    let setsWonA = 0;
    let setsWonB = 0;
    const playedSets = sets.filter(s => s.teamA > 0 || s.teamB > 0);
    playedSets.forEach(s => {
      if (s.teamA > s.teamB) setsWonA++;
      else if (s.teamB > s.teamA) setsWonB++;
    });
    let winnerId: string | undefined = undefined;
    if (setsWonA >= setsToWin) winnerId = teamA.id;
    if (setsWonB >= setsToWin) winnerId = teamB.id;
    onSave({ sets: playedSets, winnerId });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 shrink-0">
          <h3 className="text-lg font-bold text-white">{t('tournament.scoreModal.title')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6 px-2">
            <span className="font-bold text-green-400 w-1/3 truncate text-center text-lg">{teamA.name}</span>
            <span className="text-gray-500 font-bold text-xs uppercase">{t('tournament.vs')}</span>
            <span className="font-bold text-blue-400 w-1/3 truncate text-center text-lg">{teamB.name}</span>
          </div>
          <div className="space-y-4">
            {sets.map((set, index) => (
              <div key={index} className="bg-gray-900/50 p-3 rounded-xl border border-gray-700">
                <div className="text-center mb-2">
                  <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">{t('tournament.scoreModal.set')} {index + 1}</span>
                </div>
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleIncrement(index, 'teamA', -1)} className="w-8 h-8 flex items-center justify-center bg-gray-800 text-red-400 rounded-lg hover:bg-gray-700 font-bold active:bg-gray-600 touch-manipulation">-</button>
                    <input type="number" value={set.teamA} onChange={(e) => updateScore(index, 'teamA', parseInt(e.target.value) || 0)} className="w-12 h-12 text-center bg-gray-800 border border-gray-600 rounded-lg text-white font-bold text-xl focus:border-green-500 outline-none" />
                    <button onClick={() => handleIncrement(index, 'teamA', 1)} className="w-8 h-8 flex items-center justify-center bg-gray-800 text-green-400 rounded-lg hover:bg-gray-700 font-bold active:bg-gray-600 touch-manipulation">+</button>
                  </div>
                  <span className="text-gray-600 font-bold">-</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleIncrement(index, 'teamB', -1)} className="w-8 h-8 flex items-center justify-center bg-gray-800 text-red-400 rounded-lg hover:bg-gray-700 font-bold active:bg-gray-600 touch-manipulation">-</button>
                    <input type="number" value={set.teamB} onChange={(e) => updateScore(index, 'teamB', parseInt(e.target.value) || 0)} className="w-12 h-12 text-center bg-gray-800 border border-gray-600 rounded-lg text-white font-bold text-xl focus:border-blue-500 outline-none" />
                    <button onClick={() => handleIncrement(index, 'teamB', 1)} className="w-8 h-8 flex items-center justify-center bg-gray-800 text-blue-400 rounded-lg hover:bg-gray-700 font-bold active:bg-gray-600 touch-manipulation">+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-gray-900/50 border-t border-gray-700 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-colors">{t('tournament.scoreModal.cancel')}</button>
          <button onClick={handleSave} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors shadow-lg">{t('tournament.scoreModal.save')}</button>
        </div>
      </div>
    </div>
  );
}