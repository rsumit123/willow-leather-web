import { Shield, Target, TrendingUp, Zap } from 'lucide-react';
import clsx from 'clsx';

interface IntentBadgeProps {
  intent: string;
  compact?: boolean;
}

const intentConfig: Record<string, {
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
    description: 'Low variance - consistent run accumulation',
  },
  accumulator: {
    icon: Target,
    label: 'Steady',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20 border-gray-500/30',
    description: 'Moderate variance - balanced approach',
  },
  aggressive: {
    icon: TrendingUp,
    label: 'Aggressor',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20 border-orange-500/30',
    description: 'High variance - attacking approach',
  },
  power_hitter: {
    icon: Zap,
    label: 'Power',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20 border-red-500/30',
    description: 'Very high variance - boom or bust',
  },
};

export function IntentBadge({ intent, compact = false }: IntentBadgeProps) {
  const config = intentConfig[intent];
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
