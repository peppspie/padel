import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Tournament } from '../types';
import { storageService } from '../services/storage';

export function TournamentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState<'matches' | 'standings'>('matches');

  useEffect(() => {
    if (id) {
      const data = storageService.getTournament(id);
      if (data) {
        setTournament(data);
      }
    }
  }, [id]);

  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-400 mb-4">{t('app.notFound')}</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-gray-800 text-white px-6 py-2 rounded-xl"
        >
          {t('app.back')}
        </button>
      </div>
    );
  }

  const getTeamName = (teamId: string) => {
    return tournament.teams.find(t => t.id === teamId)?.name || 'Unknown';
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white mb-2 transition-colors">
          &larr; {t('app.back')}
        </button>
        <h2 className="text-2xl font-bold text-white">{tournament.config.name}</h2>
        <p className="text-sm text-gray-500 uppercase tracking-widest">{t(`setup.${tournament.config.type}`)}</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-800 p-1 rounded-2xl mb-8 border border-gray-700">
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'matches' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400'}`}
        >
          {t('tournament.matches')}
        </button>
        <button
          onClick={() => setActiveTab('standings')}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'standings' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400'}`}
        >
          {t('tournament.standings')}
        </button>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {activeTab === 'matches' && (
          <>
            {tournament.groups.map(group => (
              <div key={group.id} className="space-y-4">
                <h3 className="text-lg font-bold text-green-400 flex items-center gap-2 px-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {group.name}
                </h3>
                
                <div className="space-y-3">
                  {group.matches.map(match => (
                    <div 
                      key={match.id}
                      className="bg-gray-800 p-4 rounded-2xl border border-gray-700 flex items-center justify-between group active:scale-95 transition-transform"
                    >
                      <div className="flex-1 text-right pr-4">
                        <p className="font-bold text-white truncate">{getTeamName(match.teamAId)}</p>
                      </div>
                      
                      <div className="flex flex-col items-center px-2 min-w-[60px]">
                        <span className="text-[10px] text-gray-500 font-bold uppercase mb-1">{match.roundName}</span>
                        <div className="bg-gray-900 px-3 py-1 rounded-lg border border-gray-700">
                          <span className="text-green-500 font-mono font-bold">VS</span>
                        </div>
                      </div>

                      <div className="flex-1 text-left pl-4">
                        <p className="font-bold text-white truncate">{getTeamName(match.teamBId)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'standings' && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <p className="p-8 text-center text-gray-500 italic">
              Work in Progress: Standings logic coming soon...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
