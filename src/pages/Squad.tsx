import { motion } from 'framer-motion';
import { Users, TrendingUp, Globe, Shield, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { careerApi, trainingApi } from '../api/client';
import type { ActiveBoost } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { PlayerCard } from '../components/common/PlayerCard';
import { PageHeader } from '../components/common/PageHeader';
import { useState } from 'react';
import clsx from 'clsx';

export function SquadPage() {
  const { careerId, career } = useGameStore();
  const [filter, setFilter] = useState<'all' | 'bat' | 'bowl' | 'ar' | 'wk'>('all');

  const { data: squad, isLoading } = useQuery({
    queryKey: ['squad', careerId, career?.user_team_id],
    queryFn: () =>
      careerApi.getSquad(careerId!, career!.user_team_id!).then((r) => r.data),
    enabled: !!careerId && !!career?.user_team_id,
  });

  // Active training boosts
  const { data: activeBoosts } = useQuery({
    queryKey: ['active-boosts', careerId],
    queryFn: () => trainingApi.getActiveBoosts(careerId!).then((r) => r.data),
    enabled: !!careerId,
  });

  // Map boosts by player_id for quick lookup
  const boostsByPlayer: Record<number, ActiveBoost[]> = {};
  activeBoosts?.forEach((b) => {
    if (!boostsByPlayer[b.player_id]) boostsByPlayer[b.player_id] = [];
    boostsByPlayer[b.player_id].push(b);
  });

  if (isLoading || !squad) {
    return <Loading fullScreen text="Loading squad..." />;
  }

  const filteredPlayers = squad.players.filter((p) => {
    if (filter === 'all') return true;
    const roleMap: Record<string, string[]> = {
      bat: ['batsman'],
      bowl: ['bowler'],
      ar: ['all_rounder'],
      wk: ['wicket_keeper'],
    };
    return roleMap[filter]?.includes(p.role);
  });

  return (
    <>
      <PageHeader title="Squad" showBack backTo="/dashboard" />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-white"
            style={{ backgroundColor: squad.team.primary_color }}
          >
            {squad.team.short_name}
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white">
              {squad.team.name}
            </h1>
            <p className="text-dark-400 text-sm">{squad.team.city}</p>
          </div>
        </div>

        <div className={clsx('grid gap-2', career?.tier === 'district' ? 'grid-cols-3' : 'grid-cols-4')}>
          <div className="stat-card">
            <Users className="w-5 h-5 text-pitch-500 mb-1" />
            <p className="text-2xl font-bold text-white">{squad.total_players}</p>
            <p className="text-xs text-dark-400">Players</p>
          </div>
          {career?.tier !== 'district' && (
            <div className="stat-card">
              <Globe className="w-5 h-5 text-blue-500 mb-1" />
              <p className="text-2xl font-bold text-white">{squad.overseas_count}</p>
              <p className="text-xs text-dark-400">Overseas</p>
            </div>
          )}
          {career?.tier !== 'district' && (
            <div className="stat-card">
              <TrendingUp className="w-5 h-5 text-amber-500 mb-1" />
              <p className="text-2xl font-bold text-white">
                {((squad.team.remaining_budget || 0) / 10000000).toFixed(0)}Cr
              </p>
              <p className="text-xs text-dark-400">Budget</p>
            </div>
          )}
          <div className="stat-card">
            <Shield className="w-5 h-5 text-emerald-500 mb-1" />
            <p className="text-2xl font-bold text-white">
              {Math.round(
                squad.players.reduce((acc, p) => acc + p.overall_rating, 0) /
                  squad.total_players
              )}
            </p>
            <p className="text-xs text-dark-400">Avg OVR</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'bat', label: 'Batsmen' },
          { key: 'bowl', label: 'Bowlers' },
          { key: 'ar', label: 'All-Rounders' },
          { key: 'wk', label: 'Keepers' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              filter === f.key
                ? 'bg-pitch-500 text-white'
                : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Players list */}
      <div className="space-y-3">
        {filteredPlayers.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <PlayerCard player={player} showPrice />
            {boostsByPlayer[player.id] && (
              <div className="flex flex-wrap gap-1.5 mt-1.5 px-2">
                {boostsByPlayer[player.id].map((boost, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full"
                  >
                    <Zap className="w-2.5 h-2.5" />
                    +{boost.boost_amount} {boost.boost_attribute} ({boost.matches_remaining}m left)
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}

        {filteredPlayers.length === 0 && (
          <div className="glass-card p-8 text-center">
            <p className="text-dark-400">No players in this category</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
