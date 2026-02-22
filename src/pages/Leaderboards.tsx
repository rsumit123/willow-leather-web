import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Zap, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { seasonApi } from '../api/client';
import type { Player, BatterLeaderboardEntry, BowlerLeaderboardEntry, SixesLeaderboardEntry, CatchesLeaderboardEntry } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { SubPageHeader } from '../components/common/SubPageHeader';
import { PlayerDetailModal } from '../components/common/PlayerDetailModal';
import clsx from 'clsx';

type LeaderboardTab = 'orange' | 'purple' | 'sixes' | 'catches';

// Union type for all leaderboard entries
type LeaderboardEntry = BatterLeaderboardEntry | BowlerLeaderboardEntry | SixesLeaderboardEntry | CatchesLeaderboardEntry;

// Convert leaderboard entry to Player type for modal
function toPlayer(entry: LeaderboardEntry): Player {
  return {
    id: entry.player_id,
    name: entry.player_name,
    age: entry.age,
    nationality: '', // Not available in leaderboard
    is_overseas: entry.is_overseas,
    role: entry.role,
    batting: entry.batting,
    bowling: entry.bowling,
    overall_rating: entry.overall_rating,
    team_id: entry.team_id,
    base_price: 0,
    form: 1.0,
    batting_style: entry.batting_style,
    bowling_type: entry.bowling_type,
    power: entry.power,
    traits: entry.traits,
    batting_intent: entry.batting_intent,
  };
}

export function LeaderboardsPage() {
  const { careerId, career } = useGameStore();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('orange');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: leaderboards, isLoading } = useQuery({
    queryKey: ['leaderboards', careerId],
    queryFn: () => seasonApi.getLeaderboards(careerId!).then((r) => r.data),
    enabled: !!careerId,
  });

  const handlePlayerClick = (entry: LeaderboardEntry) => {
    setSelectedPlayer(toPlayer(entry));
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlayer(null);
  };

  if (isLoading || !leaderboards) {
    return <Loading fullScreen text="Loading leaderboards..." />;
  }

  const tabs = [
    { id: 'orange' as const, label: 'Orange Cap', icon: Trophy, color: 'orange' },
    { id: 'purple' as const, label: 'Purple Cap', icon: Target, color: 'purple' },
    { id: 'sixes' as const, label: 'Most Sixes', icon: Zap, color: 'yellow' },
    { id: 'catches' as const, label: 'Most Catches', icon: Shield, color: 'blue' },
  ];

  const getPositionBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500/50';
    if (rank === 2) return 'bg-gray-400/20 text-gray-300 ring-2 ring-gray-400/50';
    if (rank === 3) return 'bg-amber-600/20 text-amber-500 ring-2 ring-amber-600/50';
    return 'bg-dark-700 text-dark-400';
  };

  return (
    <>
      <SubPageHeader title="Leaderboards" showBack backTo="/dashboard" />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            activeTab === 'orange' && 'bg-orange-500/20',
            activeTab === 'purple' && 'bg-purple-500/20',
            activeTab === 'sixes' && 'bg-yellow-500/20',
            activeTab === 'catches' && 'bg-blue-500/20'
          )}>
            {activeTab === 'orange' && <Trophy className="w-5 h-5 text-orange-500" />}
            {activeTab === 'purple' && <Target className="w-5 h-5 text-purple-500" />}
            {activeTab === 'sixes' && <Zap className="w-5 h-5 text-yellow-500" />}
            {activeTab === 'catches' && <Shield className="w-5 h-5 text-blue-500" />}
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white">Leaderboards</h1>
            <p className="text-dark-400 text-sm">Season {career?.current_season_number}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="glass-card p-1 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5',
                activeTab === tab.id
                  ? tab.color === 'orange'
                    ? 'bg-orange-500/20 text-orange-400'
                    : tab.color === 'purple'
                    ? 'bg-purple-500/20 text-purple-400'
                    : tab.color === 'yellow'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-blue-500/20 text-blue-400'
                  : 'text-dark-400 hover:text-white'
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Orange Cap - Top Run Scorers */}
        {activeTab === 'orange' && (
          <div className="space-y-2">
            {leaderboards.orange_cap.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Trophy className="w-12 h-12 mx-auto text-dark-500 mb-3" />
                <p className="text-dark-400">No batting stats yet</p>
                <p className="text-dark-500 text-sm">Play matches to see the leaderboard</p>
              </div>
            ) : (
              leaderboards.orange_cap.map((player, index) => (
                <motion.div
                  key={player.player_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handlePlayerClick(player)}
                  className={clsx(
                    'glass-card p-4 relative overflow-hidden cursor-pointer hover:bg-dark-800/50 transition-colors',
                    player.rank === 1 && 'ring-2 ring-orange-500/50 border-orange-500/30'
                  )}
                >
                  {player.rank <= 3 && (
                    <div className={clsx(
                      'absolute left-0 top-0 bottom-0 w-1',
                      player.rank === 1 && 'bg-orange-500',
                      player.rank === 2 && 'bg-gray-400',
                      player.rank === 3 && 'bg-amber-600'
                    )} />
                  )}
                  <div className="flex items-center gap-3">
                    <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', getPositionBadge(player.rank))}>
                      {player.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={clsx('font-semibold truncate', player.rank === 1 ? 'text-orange-400' : 'text-white')}>
                          {player.player_name}
                        </p>
                        {player.traits && player.traits.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-pitch-500/20 text-pitch-400">
                            {player.traits.length} trait{player.traits.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-dark-400 text-xs">{player.team_short_name}</p>
                    </div>
                    <div className="text-right">
                      <p className={clsx('text-xl font-bold', player.rank === 1 ? 'text-orange-400' : 'text-white')}>
                        {player.runs}
                      </p>
                      <p className="text-dark-400 text-xs">runs</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-dark-700/50 grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <p className="text-dark-400">Mat</p>
                      <p className="font-semibold">{player.matches}</p>
                    </div>
                    <div>
                      <p className="text-dark-400">Avg</p>
                      <p className="font-semibold">{player.average.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-dark-400">SR</p>
                      <p className="font-semibold">{player.strike_rate.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-dark-400">HS</p>
                      <p className="font-semibold">{player.highest_score}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Purple Cap - Top Wicket Takers */}
        {activeTab === 'purple' && (
          <div className="space-y-2">
            {leaderboards.purple_cap.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Target className="w-12 h-12 mx-auto text-dark-500 mb-3" />
                <p className="text-dark-400">No bowling stats yet</p>
                <p className="text-dark-500 text-sm">Play matches to see the leaderboard</p>
              </div>
            ) : (
              leaderboards.purple_cap.map((player, index) => (
                <motion.div
                  key={player.player_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handlePlayerClick(player)}
                  className={clsx(
                    'glass-card p-4 relative overflow-hidden cursor-pointer hover:bg-dark-800/50 transition-colors',
                    player.rank === 1 && 'ring-2 ring-purple-500/50 border-purple-500/30'
                  )}
                >
                  {player.rank <= 3 && (
                    <div className={clsx(
                      'absolute left-0 top-0 bottom-0 w-1',
                      player.rank === 1 && 'bg-purple-500',
                      player.rank === 2 && 'bg-gray-400',
                      player.rank === 3 && 'bg-amber-600'
                    )} />
                  )}
                  <div className="flex items-center gap-3">
                    <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', getPositionBadge(player.rank))}>
                      {player.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={clsx('font-semibold truncate', player.rank === 1 ? 'text-purple-400' : 'text-white')}>
                          {player.player_name}
                        </p>
                        {player.traits && player.traits.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-pitch-500/20 text-pitch-400">
                            {player.traits.length} trait{player.traits.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-dark-400 text-xs">{player.team_short_name}</p>
                    </div>
                    <div className="text-right">
                      <p className={clsx('text-xl font-bold', player.rank === 1 ? 'text-purple-400' : 'text-white')}>
                        {player.wickets}
                      </p>
                      <p className="text-dark-400 text-xs">wickets</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-dark-700/50 grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <p className="text-dark-400">Mat</p>
                      <p className="font-semibold">{player.matches}</p>
                    </div>
                    <div>
                      <p className="text-dark-400">Econ</p>
                      <p className="font-semibold">{player.economy.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-dark-400">Avg</p>
                      <p className="font-semibold">{player.average.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-dark-400">Best</p>
                      <p className="font-semibold">{player.best_bowling}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Most Sixes */}
        {activeTab === 'sixes' && (
          <div className="space-y-2">
            {leaderboards.most_sixes.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Zap className="w-12 h-12 mx-auto text-dark-500 mb-3" />
                <p className="text-dark-400">No sixes hit yet</p>
                <p className="text-dark-500 text-sm">Play matches to see the leaderboard</p>
              </div>
            ) : (
              leaderboards.most_sixes.map((player, index) => (
                <motion.div
                  key={player.player_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handlePlayerClick(player)}
                  className={clsx(
                    'glass-card p-4 relative overflow-hidden cursor-pointer hover:bg-dark-800/50 transition-colors',
                    player.rank === 1 && 'ring-2 ring-yellow-500/50 border-yellow-500/30'
                  )}
                >
                  {player.rank <= 3 && (
                    <div className={clsx(
                      'absolute left-0 top-0 bottom-0 w-1',
                      player.rank === 1 && 'bg-yellow-500',
                      player.rank === 2 && 'bg-gray-400',
                      player.rank === 3 && 'bg-amber-600'
                    )} />
                  )}
                  <div className="flex items-center gap-3">
                    <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', getPositionBadge(player.rank))}>
                      {player.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={clsx('font-semibold truncate', player.rank === 1 ? 'text-yellow-400' : 'text-white')}>
                          {player.player_name}
                        </p>
                        {player.traits && player.traits.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-pitch-500/20 text-pitch-400">
                            {player.traits.length} trait{player.traits.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-dark-400 text-xs">{player.team_short_name}</p>
                    </div>
                    <div className="text-right">
                      <p className={clsx('text-xl font-bold', player.rank === 1 ? 'text-yellow-400' : 'text-white')}>
                        {player.sixes}
                      </p>
                      <p className="text-dark-400 text-xs">sixes</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-dark-700/50 grid grid-cols-2 gap-2 text-center text-xs">
                    <div>
                      <p className="text-dark-400">Matches</p>
                      <p className="font-semibold">{player.matches}</p>
                    </div>
                    <div>
                      <p className="text-dark-400">Total Runs</p>
                      <p className="font-semibold">{player.runs}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Most Catches */}
        {activeTab === 'catches' && (
          <div className="space-y-2">
            {leaderboards.most_catches.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Shield className="w-12 h-12 mx-auto text-dark-500 mb-3" />
                <p className="text-dark-400">No catches taken yet</p>
                <p className="text-dark-500 text-sm">Play matches to see the leaderboard</p>
              </div>
            ) : (
              leaderboards.most_catches.map((player, index) => (
                <motion.div
                  key={player.player_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handlePlayerClick(player)}
                  className={clsx(
                    'glass-card p-4 relative overflow-hidden cursor-pointer hover:bg-dark-800/50 transition-colors',
                    player.rank === 1 && 'ring-2 ring-blue-500/50 border-blue-500/30'
                  )}
                >
                  {player.rank <= 3 && (
                    <div className={clsx(
                      'absolute left-0 top-0 bottom-0 w-1',
                      player.rank === 1 && 'bg-blue-500',
                      player.rank === 2 && 'bg-gray-400',
                      player.rank === 3 && 'bg-amber-600'
                    )} />
                  )}
                  <div className="flex items-center gap-3">
                    <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', getPositionBadge(player.rank))}>
                      {player.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={clsx('font-semibold truncate', player.rank === 1 ? 'text-blue-400' : 'text-white')}>
                          {player.player_name}
                        </p>
                        {player.traits && player.traits.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-pitch-500/20 text-pitch-400">
                            {player.traits.length} trait{player.traits.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-dark-400 text-xs">{player.team_short_name}</p>
                    </div>
                    <div className="text-right">
                      <p className={clsx('text-xl font-bold', player.rank === 1 ? 'text-blue-400' : 'text-white')}>
                        {player.total_dismissals}
                      </p>
                      <p className="text-dark-400 text-xs">dismissals</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-dark-700/50 grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <p className="text-dark-400">Mat</p>
                      <p className="font-semibold">{player.matches}</p>
                    </div>
                    <div>
                      <p className="text-dark-400">Ct</p>
                      <p className="font-semibold">{player.catches}</p>
                    </div>
                    <div>
                      <p className="text-dark-400">St</p>
                      <p className="font-semibold">{player.stumpings}</p>
                    </div>
                    <div>
                      <p className="text-dark-400">RO</p>
                      <p className="font-semibold">{player.run_outs}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Legend */}
        <div className="glass-card p-4 text-xs text-dark-400">
          <p className="mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-2" />
            Orange Cap: Top run scorer of the tournament
          </p>
          <p className="mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-2" />
            Purple Cap: Top wicket taker of the tournament
          </p>
          <p className="text-dark-500 mt-2">Tap on a player to view their full profile and traits</p>
        </div>
      </div>

      {/* Player Detail Modal */}
      <PlayerDetailModal
        player={selectedPlayer}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
