import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Target, TrendingUp, Zap, X } from 'lucide-react';
import clsx from 'clsx';

interface IntentBadgeProps {
  intent: string;
  compact?: boolean;
  clickable?: boolean;
}

export const intentConfig: Record<string, {
  icon: typeof Shield;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  anchor: {
    icon: Shield,
    label: 'Anchor',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20 border-blue-500/30',
    description: 'Low variance - consistent run accumulation, prioritizes staying at the crease',
  },
  accumulator: {
    icon: Target,
    label: 'Steady',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20 border-gray-500/30',
    description: 'Moderate variance - balanced approach between scoring and survival',
  },
  aggressive: {
    icon: TrendingUp,
    label: 'Aggressor',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20 border-orange-500/30',
    description: 'High variance - attacking approach, looks for scoring opportunities',
  },
  power_hitter: {
    icon: Zap,
    label: 'Power',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20 border-red-500/30',
    description: 'Very high variance - boom or bust, goes for big shots',
  },
};

export function IntentBadge({ intent, compact = false, clickable = false }: IntentBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = intentConfig[intent];
  if (!config) return null;

  const Icon = config.icon;

  const handleClick = (e: React.MouseEvent) => {
    if (clickable) {
      e.stopPropagation();
      setShowTooltip(true);
    }
  };

  const badge = compact ? (
    <span
      onClick={handleClick}
      className={clsx(
        'inline-flex items-center justify-center w-5 h-5 rounded-full border',
        config.bgColor,
        clickable && 'cursor-pointer hover:opacity-80'
      )}
      title={!clickable ? `${config.label}: ${config.description}` : undefined}
    >
      <Icon className={clsx('w-3 h-3', config.color)} />
    </span>
  ) : (
    <span
      onClick={handleClick}
      className={clsx(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-xs font-medium',
        config.bgColor,
        clickable && 'cursor-pointer hover:opacity-80'
      )}
      title={!clickable ? config.description : undefined}
    >
      <Icon className={clsx('w-3 h-3', config.color)} />
      <span className={config.color}>{config.label}</span>
    </span>
  );

  if (!clickable) return badge;

  return (
    <>
      {badge}
      <AnimatePresence>
        {showTooltip && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTooltip(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            {/* Tooltip Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-[280px] mx-auto"
            >
              <div className={clsx('rounded-xl border p-4', config.bgColor)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={clsx('w-5 h-5', config.color)} />
                    <span className={clsx('font-semibold', config.color)}>
                      {config.label} Batsman
                    </span>
                  </div>
                  <button
                    onClick={() => setShowTooltip(false)}
                    className="p-1 rounded hover:bg-dark-800/50 text-dark-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-dark-200">{config.description}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
