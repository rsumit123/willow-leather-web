import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Globe, Star, AlertCircle } from 'lucide-react';
import type { RetentionCandidate } from '../../api/client';
import { FormBadge } from '../common/FormBadge';
import clsx from 'clsx';

interface RetentionBoardProps {
  candidates: RetentionCandidate[];
  onConfirm: (playerIds: number[]) => void;
  isSubmitting: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  batsman: 'text-blue-400',
  bowler: 'text-purple-400',
  all_rounder: 'text-emerald-400',
  wicket_keeper: 'text-amber-400',
};

const ROLE_SHORT: Record<string, string> = {
  batsman: 'BAT',
  bowler: 'BOWL',
  all_rounder: 'AR',
  wicket_keeper: 'WK',
};

function formatPrice(price: number): string {
  if (price >= 10_000_000) return `${(price / 10_000_000).toFixed(1)}Cr`;
  return `${(price / 100_000).toFixed(0)}L`;
}

export function RetentionBoard({ candidates, onConfirm, isSubmitting }: RetentionBoardProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const retainable = candidates.filter((c) => c.retention_slot <= 4);
  const nonRetainable = candidates.filter((c) => c.retention_slot > 4);

  const togglePlayer = (playerId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else if (next.size < 4) {
        next.add(playerId);
      }
      return next;
    });
  };

  // Calculate total retention cost based on actual slot assignment (1-based by selection order)
  const PRICES = [180_000_000, 140_000_000, 110_000_000, 80_000_000];
  const totalCost = Array.from(selected).reduce((sum, _, i) => sum + (PRICES[i] || 0), 0);
  const remainingBudget = 900_000_000 - totalCost;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">Retain Players</h2>
        <span className="text-sm text-dark-400">
          {selected.size}/4 selected
        </span>
      </div>

      {/* Budget bar */}
      <div className="glass-card p-3 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-dark-400">Retention Cost</span>
          <span className="text-pitch-400 font-semibold">{formatPrice(totalCost)}</span>
        </div>
        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-pitch-500 rounded-full"
            animate={{ width: `${(totalCost / 900_000_000) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-dark-500">Remaining for auction</span>
          <span className="text-white font-semibold">{formatPrice(remainingBudget)}</span>
        </div>
      </div>

      {/* Retainable players */}
      <div className="space-y-2">
        {retainable.map((candidate, index) => {
          const isSelected = selected.has(candidate.player_id);
          const selectionIndex = Array.from(selected).indexOf(candidate.player_id);
          const slotPrice = isSelected ? PRICES[selectionIndex] : PRICES[index];

          return (
            <motion.button
              key={candidate.player_id}
              onClick={() => togglePlayer(candidate.player_id)}
              className={clsx(
                'w-full p-3 rounded-xl border transition-colors text-left flex items-center gap-3',
                isSelected
                  ? 'border-pitch-500/50 bg-pitch-500/10'
                  : 'border-dark-700 bg-dark-850 hover:border-dark-600'
              )}
              whileTap={{ scale: 0.98 }}
            >
              {/* Checkbox */}
              <div className={clsx(
                'w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                isSelected
                  ? 'border-pitch-500 bg-pitch-500'
                  : 'border-dark-600'
              )}>
                {isSelected && <Check className="w-4 h-4 text-white" />}
              </div>

              {/* Player info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white truncate">{candidate.player_name}</span>
                  {candidate.is_overseas && (
                    <Globe className="w-3 h-3 text-blue-400 flex-shrink-0" />
                  )}
                  <span className={clsx('text-[10px]', ROLE_COLORS[candidate.role])}>
                    {ROLE_SHORT[candidate.role] || candidate.role}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-dark-400">
                  <span>{candidate.age}y</span>
                  {candidate.season_runs > 0 && <span>{candidate.season_runs} runs</span>}
                  {candidate.season_wickets > 0 && <span>{candidate.season_wickets} wkts</span>}
                </div>
              </div>

              {/* Rating + Form */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <FormBadge form={candidate.form} />
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-bold text-white">{candidate.overall_rating}</span>
                </div>
              </div>

              {/* Price */}
              <div className="text-right flex-shrink-0 w-14">
                <span className={clsx(
                  'text-xs font-semibold',
                  isSelected ? 'text-pitch-400' : 'text-dark-400'
                )}>
                  {formatPrice(slotPrice)}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Non-retainable players (will be released) */}
      {nonRetainable.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-dark-500">
            <AlertCircle className="w-3 h-3" />
            <span>These players will be released to the auction pool</span>
          </div>
          {nonRetainable.map((player) => (
            <div
              key={player.player_id}
              className="w-full p-2 rounded-lg border border-dark-800 bg-dark-900/50 flex items-center gap-3 opacity-50"
            >
              <div className="w-6" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-dark-300 truncate">{player.player_name}</span>
                <span className={clsx('text-[10px] ml-2', ROLE_COLORS[player.role])}>
                  {ROLE_SHORT[player.role] || player.role}
                </span>
              </div>
              <span className="text-xs text-dark-500">{player.overall_rating}</span>
            </div>
          ))}
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={() => onConfirm(Array.from(selected))}
        disabled={isSubmitting || selected.size === 0}
        className="btn-primary w-full mt-4"
      >
        {isSubmitting
          ? 'Submitting...'
          : `Confirm ${selected.size} Retention${selected.size !== 1 ? 's' : ''} (${formatPrice(totalCost)})`
        }
      </button>
    </div>
  );
}
