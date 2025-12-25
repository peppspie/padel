import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storageService } from '../services/storage';
import type { Tournament } from '../types';

export function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    setTournaments(storageService.getAllTournaments());
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this tournament?')) {
      storageService.deleteTournament(id);
      setTournaments(storageService.getAllTournaments());
    }
  };

  return (
    <div className="flex flex-col py-8 pb-24">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2">
          {t('app.title')}
        </h1>
        <p className="text-gray-400 text-lg">
          {t('app.subtitle')}
        </p>
      </div>
      
      {/* Action Button */}
      <button 
        onClick={() => navigate('/new')}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transform transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 mb-10"
      >
        <span className="text-2xl">+</span>
        <span className="text-lg">{t('app.newTournament')}</span>
      </button>

      {/* Tournament List */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4 px-1 border-l-4 border-green-500 pl-3">
          {t('home.activeTournaments')}
        </h3>

        {tournaments.length === 0 ? (
          <div className="text-center py-10 bg-gray-800/50 rounded-2xl border border-gray-700 border-dashed">
            <p className="text-gray-500">{t('home.noTournaments')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tournaments.map(tournament => (
              <div 
                key={tournament.id}
                onClick={() => navigate(`/tournament/${tournament.id}`)}
                className="bg-gray-800 hover:bg-gray-750 p-5 rounded-2xl border border-gray-700 shadow-md transition-all active:scale-[0.98] cursor-pointer relative group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-bold text-white truncate pr-8">{tournament.config.name}</h4>
                  <span className="text-xs font-bold bg-gray-900 text-gray-400 px-2 py-1 rounded-md uppercase tracking-wider">
                    {tournament.config.type}
                  </span>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="text-sm text-gray-400">
                    <p>{new Date(tournament.createdAt).toLocaleDateString()}</p>
                    <p>{tournament.teams.length} Teams</p>
                  </div>
                  
                  <button
                    onClick={(e) => handleDelete(e, tournament.id)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors z-10"
                  >
                    <span className="sr-only">{t('home.delete')}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
