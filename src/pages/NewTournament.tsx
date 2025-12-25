import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TournamentConfig, Team } from '../types';
import { generateId } from '../utils';
import { createTournament } from '../services/tournamentLogic';
import { storageService } from '../services/storage';

export function NewTournament() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Tournament State
  const [name, setName] = useState('');
  const [type, setType] = useState<TournamentConfig['type']>('mixed');
  const [teams, setTeams] = useState<Team[]>([
    { id: generateId(), name: '', players: ['', ''] },
    { id: generateId(), name: '', players: ['', ''] }
  ]);

  // Scoring Config
  const [config, setConfig] = useState<TournamentConfig['scoring']>({
    gamesPerSet: 6,
    setsToWin: 2,
    tieBreakAt: 6,
    decidingPoint: true,
    superTieBreakInFinalSet: false
  });

  const addTeam = () => {
    setTeams([...teams, { id: generateId(), name: '', players: ['', ''] }]);
  };

  const updateTeam = (id: string, field: 'name' | 'p1' | 'p2', value: string) => {
    setTeams(teams.map(team => {
      if (team.id !== id) return team;
      if (field === 'name') return { ...team, name: value };
      const newPlayers: [string, string] = [...team.players];
      if (field === 'p1') newPlayers[0] = value;
      if (field === 'p2') newPlayers[1] = value;
      return { ...team, players: newPlayers };
    }));
  };

  const removeTeam = (id: string) => {
    if (teams.length > 2) {
      setTeams(teams.filter(t => t.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Validation
    const validTeams = teams.filter(t => t.name.trim() !== '');
    if (validTeams.length < 2) {
      alert(t('setup.validation.minTeams'));
      return;
    }
    if (!name.trim()) {
      alert(t('setup.validation.nameRequired'));
      return;
    }

    const fullConfig: TournamentConfig = {
      name,
      type,
      scoring: config
    };

    const newTournament = createTournament(fullConfig, validTeams);
    storageService.saveTournament(newTournament);
    
    navigate(`/tournament/${newTournament.id}`);
  };

  return (
    <div className="pb-20">
      <div className="flex items-center mb-8">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white mr-4 transition-colors">
          &larr; {t('app.back')}
        </button>
        <h2 className="text-2xl font-bold text-white">{t('app.configure')}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <section className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-inner">
          <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            {t('setup.tournamentName')}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
            placeholder="e.g. Winter Cup 2025"
          />

          <label className="block text-sm font-semibold text-gray-400 mt-6 mb-2 uppercase tracking-wider">
            {t('setup.tournamentType')}
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none transition-all"
          >
            <option value="mixed">{t('setup.mixed')}</option>
            <option value="groups">{t('setup.groups')}</option>
            <option value="knockout">{t('setup.knockout')}</option>
          </select>
        </section>

        {/* Teams Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>👥</span> {t('setup.teams')}
              <span className="text-sm bg-gray-700 px-2 py-0.5 rounded-full text-gray-300">{teams.length}</span>
            </h3>
          </div>
          
          <div className="space-y-4">
            {teams.map((team, index) => (
              <div key={team.id} className="bg-gray-800 p-4 rounded-2xl border border-gray-700 relative group animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 gap-3">
                  <input
                    type="text"
                    placeholder={`${t('setup.teamPlaceholder')} ${index + 1}`}
                    value={team.name}
                    onChange={(e) => updateTeam(team.id, 'name', e.target.value)}
                    className="bg-transparent border-b border-gray-600 py-1 text-lg font-bold text-green-400 focus:border-green-500 outline-none mb-2"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder={t('setup.player1')}
                      value={team.players[0]}
                      onChange={(e) => updateTeam(team.id, 'p1', e.target.value)}
                      className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-gray-500"
                    />
                    <input
                      type="text"
                      placeholder={t('setup.player2')}
                      value={team.players[1]}
                      onChange={(e) => updateTeam(team.id, 'p2', e.target.value)}
                      className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-gray-500"
                    />
                  </div>
                </div>
                {teams.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeTeam(team.id)}
                    className="absolute -top-2 -right-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white w-8 h-8 rounded-full flex items-center justify-center transition-all border border-red-500/50"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addTeam}
            className="w-full mt-4 py-3 px-4 border-2 border-dashed border-gray-700 rounded-2xl text-gray-400 hover:text-white hover:border-gray-500 transition-all font-medium flex items-center justify-center gap-2"
          >
            <span>+</span> {t('setup.addTeam')}
          </button>
        </section>

        {/* Scoring Rules */}
        <section className="bg-gray-800 p-5 rounded-2xl border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <span>⚙️</span> {t('setup.rules')}
          </h3>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">{t('setup.setsToWin')}</span>
              <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-700">
                {[1, 2, 3].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setConfig({...config, setsToWin: val})}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${config.setsToWin === val ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-300">{t('setup.gamesPerSet')}</span>
              <div className="flex items-center gap-3 bg-gray-900 p-2 rounded-xl border border-gray-700">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, gamesPerSet: Math.max(1, config.gamesPerSet - 1) })}
                  className="w-8 h-8 flex items-center justify-center bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={config.gamesPerSet}
                  onChange={(e) => setConfig({ ...config, gamesPerSet: parseInt(e.target.value) || 6 })}
                  className="w-12 text-center bg-transparent text-white font-bold outline-none"
                />
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, gamesPerSet: config.gamesPerSet + 1 })}
                  className="w-8 h-8 flex items-center justify-center bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-gray-300">{t('setup.decidingPoint')}</span>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={config.decidingPoint}
                  onChange={(e) => setConfig({...config, decidingPoint: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </div>
            </label>
          </div>
        </section>

        {/* Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/80 backdrop-blur-md border-t border-gray-800 max-w-md mx-auto">
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-2xl shadow-xl transform transition hover:scale-[1.02] active:scale-95 text-lg"
          >
            {t('app.create')}
          </button>
        </div>
      </form>
    </div>
  );
}
