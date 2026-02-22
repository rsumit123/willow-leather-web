import { motion } from 'framer-motion';
import {
  Trophy,
  Target,
  Swords,
  BarChart3,
  Star,
  Crown,
  User,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { progressionApi } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { PageHeader } from '../components/common/PageHeader';
import clsx from 'clsx';

const TIER_BADGE: Record<string, { color: string; bgColor: string }> = {
  district: { color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  state: { color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  ipl: { color: 'text-pitch-400', bgColor: 'bg-pitch-500/20' },
};

export function ManagerStatsPage() {
  const { careerId } = useGameStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['manager-stats', careerId],
    queryFn: () => progressionApi.getManagerStats(careerId!).then((r) => r.data),
    enabled: !!careerId,
  });

  if (!careerId) return null;
  if (isLoading) return <Loading fullScreen text="Loading stats..." />;
  if (!stats) return null;

  return (
    <>
      <PageHeader title="Manager Stats" />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 text-center"
        >
          {stats.avatar_url ? (
            <img
              src={stats.avatar_url}
              alt={stats.manager_name}
              className="w-20 h-20 rounded-full border-2 border-dark-600 mx-auto mb-3"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-pitch-500/20 flex items-center justify-center mx-auto mb-3">
              <User className="w-10 h-10 text-pitch-400" />
            </div>
          )}
          <h2 className="text-xl font-display font-bold text-white">
            {stats.manager_name}
          </h2>
          <p className="text-amber-400 text-sm font-medium mt-1">
            "{stats.reputation_title}" ({stats.reputation} rep)
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-2"
        >
          {[
            { value: stats.trophies_won, label: 'Cups', icon: Trophy, color: 'text-yellow-400' },
            { value: `${stats.win_percentage}%`, label: 'Win%', icon: BarChart3, color: 'text-pitch-400' },
            { value: stats.total_matches, label: 'Matches', icon: Swords, color: 'text-blue-400' },
            { value: stats.seasons_played, label: 'Seasons', icon: Target, color: 'text-amber-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="glass-card p-3 text-center"
            >
              <stat.icon className={clsx('w-5 h-5 mx-auto mb-1', stat.color)} />
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-dark-400">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Season History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-semibold text-white mb-3">Season History</h3>
          <div className="space-y-2">
            {stats.season_history.map((season, i) => {
              const badge = TIER_BADGE[season.tier] || TIER_BADGE.district;
              return (
                <motion.div
                  key={season.season_number}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  className={clsx(
                    'glass-card p-4',
                    season.is_current && 'border-pitch-500/30',
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        Season {season.season_number}
                      </span>
                      <span className={clsx(
                        'text-[10px] px-1.5 py-0.5 rounded-full uppercase font-medium',
                        badge.bgColor, badge.color,
                      )}>
                        {season.tier}
                      </span>
                      {season.is_current && (
                        <span className="text-[10px] bg-pitch-500/20 text-pitch-400 px-1.5 py-0.5 rounded-full">
                          CURRENT
                        </span>
                      )}
                    </div>
                    {season.is_champion && <Crown className="w-5 h-5 text-yellow-400" />}
                    {season.is_runner_up && <Star className="w-5 h-5 text-gray-400" />}
                  </div>
                  <p className="text-sm text-dark-300">{season.team_name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-dark-400">
                    <span>{season.wins}W {season.losses}L</span>
                    {season.position && <span>#{season.position}</span>}
                    {season.is_champion && <span className="text-yellow-400 font-medium">CHAMPION</span>}
                    {season.is_runner_up && <span className="text-gray-400 font-medium">RUNNER UP</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </>
  );
}
