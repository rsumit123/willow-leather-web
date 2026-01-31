import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Star, Zap, Target, AlertTriangle, Hammer, Hand, Shield } from 'lucide-react';
import type { Player } from '../../api/client';
import { IntentBadge } from './IntentBadge';
import clsx from 'clsx';

const ROLE_LABELS: Record<string, string> = {
  wicket_keeper: 'Wicket Keeper',
  batsman: 'Batsman',
  all_rounder: 'All-Rounder',
  bowler: 'Bowler',
};

const ROLE_COLORS: Record<string, string> = {
  wicket_keeper: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  batsman: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  all_rounder: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  bowler: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const TRAIT_CONFIG: Record<string, { icon: typeof Zap; color: string; label: string; description: string }> = {
  clutch: {
    icon: Zap,
    color: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    label: 'Clutch Player',
    description: 'Performs better under pressure in tight situations',
  },
  finisher: {
    icon: Target,
    color: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
    label: 'Finisher',
    description: 'Excels at closing out innings with big hits',
  },
  choker: {
    icon: AlertTriangle,
    color: 'text-red-400 bg-red-500/20 border-red-500/30',
    label: 'Struggles Under Pressure',
    description: 'May underperform in high-pressure situations',
  },
  partnership_breaker: {
    icon: Hammer,
    color: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
    label: 'Partnership Breaker',
    description: 'Skilled at breaking dangerous batting partnerships',
  },
  bucket_hands: {
    icon: Hand,
    color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    label: 'Safe Hands',
    description: 'Excellent catching ability in the field',
  },
};

const INTENT_DESCRIPTIONS: Record<string, string> = {
  anchor: 'Prioritizes staying at the crease and building innings steadily',
  accumulator: 'Balanced approach between scoring and survival',
  aggressive: 'Looks for scoring opportunities while managing risk',
  power_hitter: 'Goes for big shots, higher risk and higher reward',
};

interface PlayerDetailModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
}

function StatBar({ label, value, maxValue = 100, color }: { label: string; value: number; maxValue?: number; color: string }) {
  const percentage = (value / maxValue) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-dark-400">{label}</span>
        <span className={clsx('font-semibold', color)}>{value}</span>
      </div>
      <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={clsx('h-full rounded-full', color.replace('text-', 'bg-'))}
        />
      </div>
    </div>
  );
}

export function PlayerDetailModal({ player, isOpen, onClose }: PlayerDetailModalProps) {
  if (!player) return null;

  const traits = player.traits || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[10%] bottom-[10%] z-50 max-w-md mx-auto bg-dark-900 rounded-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="relative p-4 pb-3 border-b border-dark-800">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-dark-800 transition-colors"
              >
                <X className="w-5 h-5 text-dark-400" />
              </button>

              <div className="flex items-start gap-3 pr-10">
                {/* Rating circle */}
                <div className={clsx(
                  'w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 border-2',
                  player.overall_rating >= 80
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                    : player.overall_rating >= 70
                    ? 'bg-pitch-500/20 border-pitch-500 text-pitch-400'
                    : 'bg-dark-700 border-dark-600 text-white'
                )}>
                  <div className="text-center">
                    <Star className="w-3 h-3 mx-auto mb-0.5" />
                    <span className="text-lg font-bold">{player.overall_rating}</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-display font-bold text-white truncate">
                    {player.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={clsx(
                      'text-xs px-2 py-0.5 rounded border',
                      ROLE_COLORS[player.role]
                    )}>
                      {ROLE_LABELS[player.role]}
                    </span>
                    {player.is_overseas && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Overseas
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-dark-400 mt-1">
                    {player.age} years • {player.batting_style.replace('_', ' ')}
                    {player.bowling_type !== 'none' && ` • ${player.bowling_type.replace('_', ' ')}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Batting Intent */}
              {player.role !== 'bowler' && player.batting_intent && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    Batting Approach
                  </h3>
                  <div className="flex items-center gap-2">
                    <IntentBadge intent={player.batting_intent} />
                  </div>
                  <p className="text-sm text-dark-300">
                    {INTENT_DESCRIPTIONS[player.batting_intent]}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Attributes
                </h3>
                <div className="grid gap-3">
                  <StatBar
                    label="Batting"
                    value={player.batting}
                    color={player.batting >= 70 ? 'text-pitch-400' : 'text-dark-300'}
                  />
                  <StatBar
                    label="Bowling"
                    value={player.bowling}
                    color={player.bowling >= 70 ? 'text-purple-400' : 'text-dark-300'}
                  />
                  <StatBar
                    label="Power"
                    value={player.power}
                    color={player.power >= 70 ? 'text-orange-400' : 'text-dark-300'}
                  />
                </div>
              </div>

              {/* Traits */}
              {traits.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider">
                    Special Traits
                  </h3>
                  <div className="space-y-2">
                    {traits.map((trait) => {
                      const config = TRAIT_CONFIG[trait];
                      if (!config) return null;
                      const Icon = config.icon;
                      return (
                        <div
                          key={trait}
                          className={clsx(
                            'p-3 rounded-lg border flex items-start gap-3',
                            config.color
                          )}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">{config.label}</p>
                            <p className="text-xs opacity-80 mt-0.5">{config.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No traits message */}
              {traits.length === 0 && (
                <div className="text-center py-4">
                  <Shield className="w-8 h-8 mx-auto text-dark-600 mb-2" />
                  <p className="text-sm text-dark-500">No special traits</p>
                </div>
              )}

              {/* Price info */}
              {player.sold_price && (
                <div className="pt-3 border-t border-dark-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Auction Price</span>
                    <span className="text-pitch-400 font-semibold">
                      ₹{(player.sold_price / 10000000).toFixed(1)}Cr
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Close button */}
            <div className="p-4 border-t border-dark-800">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-medium bg-dark-700 hover:bg-dark-600 text-white transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
