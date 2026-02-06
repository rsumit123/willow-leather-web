import { motion } from 'framer-motion';
import { User, Star, Globe } from 'lucide-react';
import type { Player, PlayerBrief, BatterDNA, BowlerDNA } from '../../api/client';
import { TraitBadges } from './TraitBadge';
import { IntentBadge } from './IntentBadge';
import clsx from 'clsx';

interface PlayerCardProps {
  player: Player | PlayerBrief;
  onClick?: () => void;
  selected?: boolean;
  showPrice?: boolean;
  compact?: boolean;
}

const roleColors: Record<string, string> = {
  batsman: 'from-blue-500 to-blue-600',
  bowler: 'from-purple-500 to-purple-600',
  all_rounder: 'from-amber-500 to-amber-600',
  wicket_keeper: 'from-emerald-500 to-emerald-600',
};

const roleLabels: Record<string, string> = {
  batsman: 'BAT',
  bowler: 'BOWL',
  all_rounder: 'AR',
  wicket_keeper: 'WK',
};

function getDotColor(value: number) {
  if (value >= 70) return 'bg-pitch-400';
  if (value >= 40) return 'bg-amber-400';
  return 'bg-red-400';
}

function DNAMicroDots({ batterDna, bowlerDna }: { batterDna: BatterDNA; bowlerDna?: BowlerDNA }) {
  const dots: { label: string; value: number }[] = [
    { label: 'Pace', value: batterDna.vs_pace },
    { label: 'Spin', value: batterDna.vs_spin },
    { label: 'Pwr', value: batterDna.power },
  ];

  if (bowlerDna) {
    const primaryStat = bowlerDna.type === 'pacer'
      ? { label: 'Ctrl', value: bowlerDna.control ?? 50 }
      : { label: 'Ctrl', value: bowlerDna.control ?? 50 };
    dots.push(primaryStat);
  }

  return (
    <div className="flex items-center justify-center gap-3 mt-2">
      {dots.map((d) => (
        <div key={d.label} className="flex items-center gap-1">
          <div className={clsx('w-1.5 h-1.5 rounded-full', getDotColor(d.value))} />
          <span className="text-[9px] text-dark-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function PlayerCard({
  player,
  onClick,
  selected = false,
  showPrice = false,
  compact = false,
}: PlayerCardProps) {
  const isFullPlayer = 'batting_style' in player;

  return (
    <motion.div
      className={clsx(
        'player-card',
        selected && 'ring-2 ring-pitch-500 border-pitch-500/50',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <div className={clsx('flex items-start gap-3', compact && 'gap-2')}>
        {/* Avatar */}
        <div
          className={clsx(
            'rounded-xl bg-gradient-to-br flex items-center justify-center text-white',
            roleColors[player.role] || 'from-gray-500 to-gray-600',
            compact ? 'w-10 h-10' : 'w-12 h-12'
          )}
        >
          <User className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={clsx(
                'font-semibold text-white truncate',
                compact ? 'text-sm' : 'text-base'
              )}
            >
              {player.name}
            </h3>
            {player.is_overseas && (
              <Globe className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span
              className={clsx(
                'badge',
                player.role === 'batsman' && 'badge-blue',
                player.role === 'bowler' && 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
                player.role === 'all_rounder' && 'badge-yellow',
                player.role === 'wicket_keeper' && 'badge-green'
              )}
            >
              {roleLabels[player.role] || player.role}
            </span>

            {/* Intent badge for batters */}
            {player.role !== 'bowler' && 'batting_intent' in player && player.batting_intent && (
              <IntentBadge intent={player.batting_intent} compact />
            )}

            {/* Trait badges */}
            {'traits' in player && player.traits && player.traits.length > 0 && (
              <TraitBadges traits={player.traits} maxShow={2} compact />
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-white">{player.overall_rating}</span>
          </div>

          {showPrice && (
            <span className="text-xs text-pitch-400 mt-1">
              ₹{((player.base_price || 0) / 10000000).toFixed(1)}Cr
            </span>
          )}
        </div>
      </div>

      {/* Extended stats for full player */}
      {isFullPlayer && !compact && 'batting' in player && (
        <div className="mt-3 pt-3 border-t border-dark-700/50">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-xs text-dark-400">BAT</p>
              <p className={clsx(
                "font-semibold text-sm",
                player.batting >= 70 ? "text-pitch-400" : "text-white"
              )}>{player.batting}</p>
            </div>
            <div>
              <p className="text-xs text-dark-400">BOWL</p>
              <p className={clsx(
                "font-semibold text-sm",
                player.bowling >= 70 ? "text-purple-400" : "text-white"
              )}>{player.bowling}</p>
            </div>
            <div>
              <p className="text-xs text-dark-400">PWR</p>
              <p className={clsx(
                "font-semibold text-sm",
                'power' in player && player.power >= 70 ? "text-orange-400" : "text-white"
              )}>{'power' in player ? player.power : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-dark-400">AGE</p>
              <p className="font-semibold text-sm">{'age' in player && player.age}</p>
            </div>
          </div>
          {/* DNA micro-dots */}
          {'batting_dna' in player && player.batting_dna && (
            <DNAMicroDots batterDna={player.batting_dna as BatterDNA} bowlerDna={'bowling_dna' in player ? player.bowling_dna as BowlerDNA | undefined : undefined} />
          )}
        </div>
      )}
    </motion.div>
  );
}
