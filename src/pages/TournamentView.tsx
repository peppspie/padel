import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Tournament, Match, MatchScore, ScoringRules, Group, TeamStats } from '../types';
import { storageService } from '../services/storage';
import { calculateStandings, generateKnockoutFromGroups } from '../services/tournamentLogic';
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
        if (data.config.stages.knockoutStage && !data.config.stages.groupStage && activeTab === 'matches') {
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
    loadTournament();
    setSelectedMatch(null);
  };

  const handleGenerateBracket = () => {
    if (!tournament) return;
    const knockoutMatches = generateKnockoutFromGroups(tournament);
    const updatedTournament: Tournament = {
      ...tournament,
      knockout: { matches: knockoutMatches },
      knockoutGenerated: true
    };
    storageService.saveTournament(updatedTournament);
    loadTournament();
  };

  const handleResetBracket = () => {
    if (!tournament) return;
    if (confirm(t('tournament.confirmResetBracket'))) {
      const updatedTournament: Tournament = {
        ...tournament,
        knockout: { matches: [] },
        knockoutGenerated: false
      };
      storageService.saveTournament(updatedTournament);
      loadTournament();
    }
  };

  const handleExport = () => {
    if (!tournament) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tournament));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `padel-tournament-${tournament.config.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-400 mb-4">{t('app.notFound')}</p>
        <button onClick={() => navigate('/')} className="bg-gray-800 text-white px-6 py-2 rounded-xl">{t('app.back')}</button>
      </div>
    );
  }

  const getTeam = (teamId: string) => tournament.teams.find(t => t.id === teamId);
  const getTeamName = (teamId: string) => {
    if (!teamId) return t('tournament.waiting');
    return getTeam(teamId)?.name || t('tournament.unknown');
  };

  const activeRules: ScoringRules = activeTab === 'bracket' 
    ? tournament.config.scoring.knockout 
    : tournament.config.scoring.group;
  
  const getMatchRules = (match: Match): ScoringRules => {
    const isKnockout = tournament.knockout.matches.some((m: Match) => m.id === match.id);
    return isKnockout ? tournament.config.scoring.knockout : tournament.config.scoring.group;
  };

  const totalGroupMatches = tournament.groups.reduce((acc, g) => acc + g.matches.length, 0);
  const completedGroupMatches = tournament.groups.reduce((acc, g) => acc + g.matches.filter(m => m.status === 'completed').length, 0);
  const isGroupStageCompleted = totalGroupMatches > 0 && totalGroupMatches === completedGroupMatches;
  const remainingGroupMatches = totalGroupMatches - completedGroupMatches;
  const isKnockoutStarted = tournament.knockout.matches.some(m => m.status !== 'scheduled' || m.score.sets.length > 0);

  let typeLabel = '';
  if (tournament.config.stages.groupStage && tournament.config.stages.knockoutStage) typeLabel = t('setup.mixed');
  else if (tournament.config.stages.groupStage) typeLabel = t('setup.groups');
  else typeLabel = t('setup.knockout');

  const hasGroups = tournament.config.stages.groupStage;
  const hasKnockout = tournament.config.stages.knockoutStage;

  return (
    <div className="pb-20">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white mb-2 transition-colors">&larr; {t('app.back')}</button>
          <button onClick={handleExport} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-600 transition-colors flex items-center gap-1"><span>⬇️</span> {t('app.export')}</button>
        </div>
        <h2 className="text-2xl font-bold text-white">{tournament.config.name}</h2>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
          <span className="uppercase tracking-widest border-r border-gray-600 pr-4">{typeLabel}</span>
          <span>{t('tournament.configSummary.bestOf', { count: activeRules.setsToWin === 1 ? 1 : (activeRules.setsToWin * 2 - 1) })}</span>
          <span>•</span>
          <span>{t('tournament.configSummary.gamesPerSet', { count: activeRules.gamesPerSet })}</span>
        </div>
      </div>

      <div className="flex bg-gray-800 p-1 rounded-2xl mb-8 border border-gray-700">
        {hasGroups && (
          <>
            <button onClick={() => setActiveTab('matches')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'matches' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400'}`}>{t('tournament.matches')}</button>
            <button onClick={() => setActiveTab('standings')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'standings' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400'}`}>{t('tournament.standings')}</button>
          </>
        )}
        {hasKnockout && (
          <button onClick={() => setActiveTab('bracket')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'bracket' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400'}`}>{t('tournament.bracket')}</button>
        )}
      </div>

      <div className="space-y-8">
        {activeTab === 'matches' && hasGroups && (
          <div className="space-y-8">
            {tournament.groups.map((group: Group) => (
              <div key={group.id} className="space-y-4">
                <h3 className="text-lg font-bold text-green-400 flex items-center gap-2 px-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span>{t('tournament.group')} {group.name}</h3>
                <div className="space-y-3">
                  {group.matches.map((match: Match) => (
                    <MatchCard key={match.id} match={match} getTeamName={getTeamName} onClick={() => handleMatchClick(match)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'standings' && hasGroups && (
          <div className="space-y-10">
            {tournament.groups.map((group: Group) => {
              const standings = calculateStandings(group);
              return (
                <div key={group.id} className="space-y-3">
                  <h3 className="text-lg font-bold text-green-400 flex items-center gap-2 px-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span>{t('tournament.group')} {group.name} - {t('tournament.standings')}</h3>
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
                        {standings.map((stat: TeamStats, idx: number) => (
                          <tr key={stat.teamId} className={idx === 0 ? 'bg-green-500/5' : ''}>
                            <td className="py-4 px-4 font-bold text-white">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] w-4 h-4 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-400'}`}>{idx + 1}</span>
                                <span className="truncate max-w-[120px]">{getTeamName(stat.teamId)}</span>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-center text-gray-300 font-mono text-sm">{stat.played}</td>
                            <td className="py-4 px-2 text-center text-gray-300 font-mono text-sm">
                              <span className={stat.setsWon - stat.setsLost > 0 ? 'text-green-400' : ''}>{stat.setsWon - stat.setsLost > 0 ? '+' : ''}{stat.setsWon - stat.setsLost}</span>
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
             {tournament.knockout.matches.length === 0 ? (
               <div className="text-center py-12 bg-gray-800 rounded-2xl border border-gray-700 border-dashed">
                 <p className="text-gray-400 mb-6 px-4">{t('tournament.bracketNotGenerated')}</p>
                 {!isGroupStageCompleted && hasGroups && (
                   <p className="text-xs text-red-400/80 mb-4 bg-red-500/10 py-2 rounded-lg mx-6">
                     ⚠️ {t('tournament.completeGroupStageFirst', { remaining: remainingGroupMatches })}
                   </p>
                 )}
                 <button 
                   onClick={handleGenerateBracket}
                   disabled={!isGroupStageCompleted && hasGroups}
                   className={`font-bold py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95 ${(!isGroupStageCompleted && hasGroups) ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                 >
                   {t('tournament.generateBracket')}
                 </button>
               </div>
             ) : (
               <div className="space-y-6">
                 {!isKnockoutStarted && hasGroups && (
                   <div className="flex justify-end px-1">
                     <button onClick={handleResetBracket} className="text-[10px] font-bold text-red-400/60 hover:text-red-400 border border-red-400/20 hover:border-red-400/50 px-2 py-1 rounded-md transition-all">{t('tournament.resetBracket')}</button>
                   </div>
                 )}
                 {Object.entries(groupByRound(tournament.knockout.matches)).map(([roundKey, matches]) => (
                   <div key={roundKey} className="space-y-3">
                     <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2 px-1 sticky top-0 bg-gray-900/90 py-2 z-10 backdrop-blur-sm"><span className="w-2 h-2 bg-blue-500 rounded-full"></span>{t(roundKey)}</h3>
                     <div className="space-y-3">
                        {matches.map((match: Match) => (
                          <MatchCard key={match.id} match={match} getTeamName={getTeamName} onClick={() => handleMatchClick(match)} isKnockout />
                        ))}
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}
      </div>

      {selectedMatch && tournament && (
        <ScoreModal
          match={selectedMatch}
          teamA={getTeam(selectedMatch.teamAId)!}
          teamB={getTeam(selectedMatch.teamBId)!}
          setsToWin={getMatchRules(selectedMatch).setsToWin}
          gamesPerSet={getMatchRules(selectedMatch).gamesPerSet}
          onClose={() => setSelectedMatch(null)}
          onSave={handleScoreSave}
        />
      )}
    </div>
  );
}

function MatchCard({ match, getTeamName, onClick, isKnockout = false }: { match: Match, getTeamName: (id: string) => string, onClick: () => void, isKnockout?: boolean }) {
  const { t } = useTranslation();
  return (
    <div onClick={onClick} className={`bg-gray-800 p-4 rounded-2xl border flex items-center justify-between group active:scale-95 transition-all cursor-pointer ${match.status === 'completed' ? (isKnockout ? 'border-blue-500/30' : 'border-green-500/30') : 'border-gray-700'}`}>
      <div className={`flex-1 text-right pr-3 ${match.score.winnerId === match.teamAId ? (isKnockout ? 'text-blue-400 font-extrabold' : 'text-green-400 font-extrabold') : 'text-white font-bold'}`}><p className="truncate">{getTeamName(match.teamAId)}</p></div>
      <div className="flex flex-col items-center px-1 min-w-[80px]">
        {!isKnockout && <span className="text-[10px] text-gray-500 font-bold uppercase mb-1">{t(match.roundName, { count: match.roundNumber })}</span>}
        <div className={`px-3 py-1 rounded-lg border flex gap-2 ${match.status === 'completed' ? (isKnockout ? 'bg-gray-900 border-blue-500/50' : 'bg-gray-900 border-green-500/50') : 'bg-gray-900 border-gray-700'}`}>
          {match.status === 'completed' || match.score.sets.length > 0 ? (
              <div className="flex flex-col items-center text-xs font-mono">{match.score.sets.map((s, i) => (<span key={i} className="leading-tight">{s.teamA}-{s.teamB}</span>))}</div>
          ) : (<span className="text-gray-500 font-mono font-bold text-sm">{t('tournament.vs')}</span>)}
        </div>
      </div>
      <div className={`flex-1 text-left pl-3 ${match.score.winnerId === match.teamBId ? (isKnockout ? 'text-blue-400 font-extrabold' : 'text-green-400 font-extrabold') : 'text-white font-bold'}`}><p className="truncate">{getTeamName(match.teamBId)}</p></div>
    </div>
  );
}

function groupByRound(matches: Match[]) {
  return matches.reduce((acc, match) => {
    (acc[match.roundName] = acc[match.roundName] || []).push(match);
    return acc;
  }, {} as Record<string, Match[]>);
}