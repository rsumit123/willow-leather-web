import { Zap, Target, AlertTriangle, Hammer, Hand } from 'lucide-react';
import clsx from 'clsx';

interface TraitBadgeProps {
  trait: string;
  compact?: boolean;
}

const traitConfig: Record<string, {
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

export function TraitBadge({ trait, compact = false }: TraitBadgeProps) {
  const config = traitConfig[trait];
  if (!config) return null;

  const Icon = config.icon;

  if (compact) {
    return (
      <span
        className={clsx(
          'inline-flex items-center justify-center w-5 h-5 rounded-full border',
          config.bgColor
        )}
        title={`${config.label}: ${config.description}`}
      >
        <Icon className={clsx('w-3 h-3', config.color)} />
      </span>
    );
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-xs font-medium',
        config.bgColor
      )}
      title={config.description}
    >
      <Icon className={clsx('w-3 h-3', config.color)} />
      <span className={config.color}>{config.label}</span>
    </span>
  );
}

interface TraitBadgesProps {
  traits: string[];
  maxShow?: number;
  compact?: boolean;
}

export function TraitBadges({ traits, maxShow = 2, compact = false }: TraitBadgesProps) {
  if (!traits || traits.length === 0) return null;

  const visibleTraits = traits.slice(0, maxShow);
  const remainingCount = traits.length - maxShow;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visibleTraits.map((trait) => (
        <TraitBadge key={trait} trait={trait} compact={compact} />
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-dark-400">+{remainingCount}</span>
      )}
    </div>
  );
}
