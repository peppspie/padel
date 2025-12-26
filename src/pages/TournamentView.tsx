import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Tournament, Match, MatchScore } from '../types';
import { storageService } from '../services/storage';
import { calculateStandings } from '../services/tournamentLogic';
import { ScoreModal } from '../components/ScoreModal';

export function TournamentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState<'matches' | 'standings' | 'bracket'>('matches');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    if (id) {
      loadTournament();
    }
  }, [id]);

  const loadTournament = () => {
    if (id) {
      const data = storageService.getTournament(id);
      if (data) {
        setTournament(data);
        // If knockout only, default to bracket tab
        if (data.config.type === 'knockout' && activeTab === 'matches') {
          setActiveTab('bracket');
        }
      }
    }
  };

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
  };

  const handleScoreSave = (score: MatchScore) => {
    if (!tournament || !selectedMatch) return;

    const updatedMatch: Match = {
      ...selectedMatch,
      score,
      status: score.winnerId ? 'completed' : 'in_progress'
    };

    storageService.updateMatch(tournament.id, updatedMatch);
    loadTournament(); // Reload to update UI
    setSelectedMatch(null);
  };

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

  const getTeam = (teamId: string) => {
    return tournament.teams.find(t => t.id === teamId);
  };

  const getTeamName = (teamId: string) => {
    if (!teamId) return t('tournament.waiting');
    return getTeam(teamId)?.name || t('tournament.unknown');
  };

  const hasGroups = tournament.groups.length > 0;
  const hasKnockout = tournament.knockout.matches.length > 0;

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white mb-2 transition-colors">
          &larr; {t('app.back')}
        </button>
        <h2 className="text-2xl font-bold text-white">{tournament.config.name}</h2>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
          <span className="uppercase tracking-widest border-r border-gray-600 pr-4">{t(`setup.${tournament.config.type}`)}</span>
          <span>{t('tournament.configSummary.bestOf', { count: tournament.config.scoring.setsToWin === 1 ? 1 : (tournament.config.scoring.setsToWin * 2 - 1) })}</span>
          <span>•</span>
          <span>{t('tournament.configSummary.gamesPerSet', { count: tournament.config.scoring.gamesPerSet })}</span>
          {tournament.config.scoring.decidingPoint && (
            <>
              <span>•</span>
              <span className="text-yellow-500 font-medium">{t('tournament.configSummary.goldenPoint')}</span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-800 p-1 rounded-2xl mb-8 border border-gray-700">
        {hasGroups && (
          <>
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
          </>
        )}
        {hasKnockout && (
          <button
            onClick={() => setActiveTab('bracket')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'bracket' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400'}`}
          >
            {t('tournament.bracket')}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="space-y-8">
        {activeTab === 'matches' && hasGroups && (
          <div className="space-y-8">
            {tournament.groups.map(group => (
              <div key={group.id} className="space-y-4">
                <h3 className="text-lg font-bold text-green-400 flex items-center gap-2 px-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {t('tournament.group')} {group.name}
                </h3>
                
                <div className="space-y-3">
                  {group.matches.map(match => (
                    <MatchCard key={match.id} match={match} getTeamName={getTeamName} onClick={() => handleMatchClick(match)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'standings' && hasGroups && (
          <div className="space-y-10">
            {tournament.groups.map(group => {
              const standings = calculateStandings(group);
              return (
                <div key={group.id} className="space-y-3">
                  <h3 className="text-lg font-bold text-green-400 flex items-center gap-2 px-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {t('tournament.group')} {group.name} - {t('tournament.standings')}
                  </h3>
                  
                  <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-900/50 text-[10px] uppercase tracking-wider text-gray-500">
                          <th className="py-3 px-4 font-bold">{t('setup.teams')}</th>
                          <th className="py-3 px-2 text-center font-bold w-10">{t('tournament.played')}</th>
                          <th className="py-3 px-2 text-center font-bold w-12">{t('tournament.sets')}</th>
                          <th className="py-3 px-2 text-center font-bold w-10">{t('tournament.points')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {standings.map((stat, idx) => (
                          <tr key={stat.teamId} className={idx === 0 ? 'bg-green-500/5' : ''}>
                            <td className="py-4 px-4 font-bold text-white">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] w-4 h-4 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-400'}`}>
                                  {idx + 1}
                                </span>
                                <span className="truncate max-w-[120px]">{getTeamName(stat.teamId)}</span>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-center text-gray-300 font-mono text-sm">{stat.played}</td>
                            <td className="py-4 px-2 text-center text-gray-300 font-mono text-sm">
                              <span className={stat.setsWon - stat.setsLost > 0 ? 'text-green-400' : ''}>
                                {stat.setsWon - stat.setsLost > 0 ? '+' : ''}{stat.setsWon - stat.setsLost}
                              </span>
                            </td>
                            <td className="py-4 px-2 text-center text-green-400 font-bold font-mono">{stat.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'bracket' && hasKnockout && (
          <div className="space-y-6">
             {/* Group matches by round name just for display */}
             {Object.entries(groupByRound(tournament.knockout.matches)).map(([roundKey, matches]) => (
               <div key={roundKey} className="space-y-3">
                 <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2 px-1 sticky top-0 bg-gray-900/90 py-2 z-10 backdrop-blur-sm">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {t(roundKey)}
                 </h3>
                 <div className="space-y-3">
                    {matches.map(match => (
                      <MatchCard key={match.id} match={match} getTeamName={getTeamName} onClick={() => handleMatchClick(match)} isKnockout />
                    ))}
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* Score Modal */}
      {selectedMatch && tournament && (
        <ScoreModal
          match={selectedMatch}
          teamA={getTeam(selectedMatch.teamAId)!}
          teamB={getTeam(selectedMatch.teamBId)!}
          setsToWin={tournament.config.scoring.setsToWin}
          gamesPerSet={tournament.config.scoring.gamesPerSet}
          onClose={() => setSelectedMatch(null)}
          onSave={handleScoreSave}
        />
      )}
    </div>
  );
}

// Sub-component for Match Card to reuse code
function MatchCard({ match, getTeamName, onClick, isKnockout = false }: { match: Match, getTeamName: (id: string) => string, onClick: () => void, isKnockout?: boolean }) {
  const { t } = useTranslation();
  return (
    <div 
      onClick={onClick}
      className={`bg-gray-800 p-4 rounded-2xl border flex items-center justify-between group active:scale-95 transition-all cursor-pointer ${match.status === 'completed' ? (isKnockout ? 'border-blue-500/30' : 'border-green-500/30') : 'border-gray-700'}`}
    >
      <div className={`flex-1 text-right pr-3 ${match.score.winnerId === match.teamAId ? (isKnockout ? 'text-blue-400 font-extrabold' : 'text-green-400 font-extrabold') : 'text-white font-bold'}`}>
        <p className="truncate">{getTeamName(match.teamAId)}</p>
      </div>
      
      <div className="flex flex-col items-center px-1 min-w-[80px]">
        {!isKnockout && (
          <span className="text-[10px] text-gray-500 font-bold uppercase mb-1">
            {t(match.roundName, { count: match.roundNumber })}
          </span>
        )}
        <div className={`px-3 py-1 rounded-lg border flex gap-2 ${match.status === 'completed' ? (isKnockout ? 'bg-gray-900 border-blue-500/50' : 'bg-gray-900 border-green-500/50') : 'bg-gray-900 border-gray-700'}`}>
          {match.status === 'completed' || match.score.sets.length > 0 ? (
              <div className="flex flex-col items-center text-xs font-mono">
                {match.score.sets.map((s, i) => (
                  <span key={i} className="leading-tight">
                    {s.teamA}-{s.teamB}
                  </span>
                ))}
              </div>
                                    ) : (
                                      <span className="text-gray-500 font-mono font-bold text-sm">{t('tournament.vs')}</span>
                                    )}        </div>
      </div>

      <div className={`flex-1 text-left pl-3 ${match.score.winnerId === match.teamBId ? (isKnockout ? 'text-blue-400 font-extrabold' : 'text-green-400 font-extrabold') : 'text-white font-bold'}`}>
        <p className="truncate">{getTeamName(match.teamBId)}</p>
      </div>
    </div>
  );
}

function groupByRound(matches: Match[]) {
  return matches.reduce((acc, match) => {
    (acc[match.roundName] = acc[match.roundName] || []).push(match);
    return acc;
  }, {} as Record<string, Match[]>);
}
