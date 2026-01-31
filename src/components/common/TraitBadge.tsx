import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Target, AlertTriangle, Hammer, Hand, X } from 'lucide-react';
import clsx from 'clsx';

interface TraitBadgeProps {
  trait: string;
  compact?: boolean;
  clickable?: boolean;
}

// Export for reuse in other components
export const traitConfig: Record<string, {
  icon: typeof Zap;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  clutch: {
    icon: Zap,
    label: 'Clutch',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20 border-blue-500/30',
    description: '+10 skill in pressure situations',
  },
  finisher: {
    icon: Target,
    label: 'Finisher',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20 border-orange-500/30',
    description: '+15 batting in last 5 overs',
  },
  choker: {
    icon: AlertTriangle,
    label: 'Pressure',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20 border-red-500/30',
    description: '-15 skill in pressure situations',
  },
  partnership_breaker: {
    icon: Hammer,
    label: 'Breaker',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20 border-purple-500/30',
    description: '+10 bowling after 50+ partnership',
  },
  bucket_hands: {
    icon: Hand,
    label: 'Safe Hands',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20 border-green-500/30',
    description: '+20 catching success',
  },
};

export function TraitBadge({ trait, compact = false, clickable = false }: TraitBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = traitConfig[trait];
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
                    <span className={clsx('font-semibold', config.color)}>{config.label}</span>
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

interface TraitBadgesProps {
  traits: string[];
  maxShow?: number;
  compact?: boolean;
  clickable?: boolean;
}

export function TraitBadges({ traits, maxShow = 2, compact = false, clickable = false }: TraitBadgesProps) {
  if (!traits || traits.length === 0) return null;

  const visibleTraits = traits.slice(0, maxShow);
  const remainingCount = traits.length - maxShow;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visibleTraits.map((trait) => (
        <TraitBadge key={trait} trait={trait} compact={compact} clickable={clickable} />
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-dark-400">+{remainingCount}</span>
      )}
    </div>
  );
}
