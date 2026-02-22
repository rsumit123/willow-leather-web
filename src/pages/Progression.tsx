import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star,
  Trophy,
  Crown,
  Lock,
  Check,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { progressionApi } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { PageHeader } from '../components/common/PageHeader';
import clsx from 'clsx';

const TIER_INFO = [
  {
    tier: 'district',
    name: 'District Cricket',
    icon: Star,
    color: 'amber',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500/20',
    borderClass: 'border-amber-500/40',
  },
  {
    tier: 'state',
    name: 'State / Ranji',
    icon: Trophy,
    color: 'blue',
    textClass: 'text-blue-400',
    bgClass: 'bg-blue-500/20',
    borderClass: 'border-blue-500/40',
  },
  {
    tier: 'ipl',
    name: 'IPL',
    icon: Crown,
    color: 'pitch',
    textClass: 'text-pitch-400',
    bgClass: 'bg-pitch-500/20',
    borderClass: 'border-pitch-500/40',
  },
];

export function ProgressionPage() {
  const navigate = useNavigate();
  const { careerId } = useGameStore();

  const { data: status, isLoading } = useQuery({
    queryKey: ['progression-status', careerId],
    queryFn: () => progressionApi.getStatus(careerId!).then((r) => r.data),
    enabled: !!careerId,
  });

  if (!careerId) return null;
  if (isLoading) return <Loading fullScreen text="Loading progression..." />;
  if (!status) return null;

  const currentTierIdx = TIER_INFO.findIndex((t) => t.tier === status.tier);

  return (
    <>
      <PageHeader title="Career Progression" />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Tier Ladder */}
        <div>
          <h2 className="text-xl font-display font-bold text-white mb-4">Your Journey</h2>
          <div className="space-y-3">
            {[...TIER_INFO].reverse().map((info, i) => {
              const realIdx = TIER_INFO.length - 1 - i;
              const isActive = info.tier === status.tier;
              const isCompleted = realIdx < currentTierIdx;
              const isLocked = realIdx > currentTierIdx;
              const TierIcon = info.icon;

              return (
                <motion.div
                  key={info.tier}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className={clsx(
                    'glass-card p-4 border transition-all',
                    isActive && info.borderClass,
                    isLocked && 'opacity-50',
                    isCompleted && 'border-pitch-500/30',
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={clsx(
                        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                        isActive ? info.bgClass : isCompleted ? 'bg-pitch-500/20' : 'bg-dark-700/50',
                      )}>
                        {isCompleted ? (
                          <Check className="w-5 h-5 text-pitch-400" />
                        ) : isLocked ? (
                          <Lock className="w-5 h-5 text-dark-500" />
                        ) : (
                          <TierIcon className={clsx('w-5 h-5', info.textClass)} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            'font-display font-bold',
                            isActive ? info.textClass : isCompleted ? 'text-pitch-400' : 'text-dark-400',
                          )}>
                            {info.name}
                          </span>
                          {isActive && (
                            <span className="text-xs bg-pitch-500/20 text-pitch-400 px-2 py-0.5 rounded-full">
                              ACTIVE
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                              COMPLETED
                            </span>
                          )}
                          {isLocked && (
                            <span className="text-xs bg-dark-700/60 text-dark-400 px-2 py-0.5 rounded-full">
                              LOCKED
                            </span>
                          )}
                        </div>
                        {isActive && status.promotion_condition && (
                          <p className="text-xs text-dark-400 mt-0.5">
                            Promotion: {status.promotion_condition.replace('_', ' ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Connector */}
                  {i < TIER_INFO.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="w-px h-4 bg-dark-700" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Reputation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-white">Reputation</h3>
          </div>
          <div className="h-3 bg-dark-700 rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${status.reputation}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-400 font-medium">
              "{status.reputation_title}"
            </span>
            <span className="text-sm text-dark-400">
              {status.reputation}/100
            </span>
          </div>
        </motion.div>

        {/* Season Objectives */}
        {status.objectives.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-4"
          >
            <h3 className="font-semibold text-white mb-3">Season Objectives</h3>
            <div className="space-y-3">
              {status.objectives.map((obj) => (
                <div
                  key={obj.id}
                  className={clsx(
                    'p-3 rounded-lg border',
                    obj.achieved ? 'border-pitch-500/30 bg-pitch-500/5' : 'border-dark-700/50 bg-dark-800/30',
                  )}
                >
                  <div className="flex items-center gap-2">
                    {obj.achieved ? (
                      <Check className="w-4 h-4 text-pitch-400 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-dark-500 flex-shrink-0" />
                    )}
                    <span className={clsx(
                      'text-sm font-medium',
                      obj.achieved ? 'text-pitch-400' : 'text-white',
                    )}>
                      {obj.description}
                    </span>
                  </div>
                  <p className="text-xs text-dark-400 mt-1 ml-6">
                    Reward: {obj.consequence}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Manager Stats Link */}
        <button
          onClick={() => navigate('/manager-stats')}
          className="glass-card p-4 w-full flex items-center gap-3 hover:border-dark-500 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-white">Manager Stats</p>
            <p className="text-xs text-dark-400">View your career history</p>
          </div>
          <ArrowRight className="w-4 h-4 text-dark-500" />
        </button>
      </div>
    </>
  );
}
