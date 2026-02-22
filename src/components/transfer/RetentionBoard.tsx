import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Globe, Star } from 'lucide-react';
import type { RetentionCandidate } from '../../api/client';
import { FormBadge } from '../common/FormBadge';
import { formatPrice } from '../../utils/format';
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

export function RetentionBoard({ candidates, onConfirm, isSubmitting }: RetentionBoardProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

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

      {/* All squad players — select up to 4 to retain */}
      <div className="space-y-2">
        {candidates.map((candidate) => {
          const isSelected = selected.has(candidate.player_id);
          const selectionIndex = Array.from(selected).indexOf(candidate.player_id);
          const slotPrice = isSelected ? PRICES[selectionIndex] : 0;

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

              {/* Price — only show when selected */}
              <div className="text-right flex-shrink-0 w-14">
                {isSelected ? (
                  <span className="text-xs font-semibold text-pitch-400">
                    {formatPrice(slotPrice)}
                  </span>
                ) : (
                  <span className="text-[10px] text-dark-500">—</span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

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
