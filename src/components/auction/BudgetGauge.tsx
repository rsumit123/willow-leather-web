import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import clsx from 'clsx';

const SALARY_CAP = 900_000_000; // 90 Cr
const MIN_SQUAD = 18;

interface BudgetGaugeProps {
  remainingBudget: number;
  totalPlayers: number;
  overseasPlayers: number;
}

function getBudgetColor(pct: number): { bar: string; text: string } {
  if (pct > 50) return { bar: 'bg-pitch-400', text: 'text-pitch-400' };
  if (pct > 30) return { bar: 'bg-amber-400', text: 'text-amber-400' };
  return { bar: 'bg-ball-400', text: 'text-ball-400' };
}

export function BudgetGauge({ remainingBudget, totalPlayers, overseasPlayers }: BudgetGaugeProps) {
  const budgetPct = Math.max(0, Math.min(100, (remainingBudget / SALARY_CAP) * 100));
  const colors = getBudgetColor(budgetPct);

  const slotsRemaining = Math.max(0, MIN_SQUAD - totalPlayers);
  const avgPerSlot = slotsRemaining > 0 ? remainingBudget / slotsRemaining : 0;

  // Warning levels
  const showWarning = slotsRemaining > 0 && avgPerSlot < 30_000_000; // < 3 Cr avg
  const isCritical = slotsRemaining > 0 && avgPerSlot < 20_000_000;  // < 2 Cr avg

  return (
    <div className="w-36 space-y-1">
      {/* Budget amount + percentage */}
      <div className="flex items-baseline justify-between">
        <span className={clsx('text-sm font-bold', colors.text)}>
          {formatPrice(remainingBudget)}
        </span>
        <span className="text-[10px] text-dark-500">{Math.round(budgetPct)}%</span>
      </div>

      {/* Budget bar */}
      <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${budgetPct}%` }}
          transition={{ duration: 0.4 }}
          className={clsx('h-full rounded-full', colors.bar)}
        />
      </div>

      {/* Squad + Overseas counts */}
      <div className="flex justify-between text-[10px] text-dark-500">
        <span>{totalPlayers}/25 squad</span>
        <span>{overseasPlayers}/8 ovs</span>
      </div>

      {/* Warning when budget is tight relative to slots needed */}
      {showWarning && (
        <div className={clsx(
          'flex items-center gap-1 text-[10px]',
          isCritical ? 'text-ball-400' : 'text-amber-400'
        )}>
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span>{slotsRemaining} slots, ~{formatPrice(avgPerSlot)} each</span>
        </div>
      )}
    </div>
  );
}
