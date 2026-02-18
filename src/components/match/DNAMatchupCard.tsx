import { motion } from 'framer-motion';
import type { MatchMatchupEntry } from '../../api/client';
import clsx from 'clsx';

interface DNAMatchupCardProps {
  matchup: MatchMatchupEntry;
  index: number;
}

function MiniBar({ value, color, reverse }: { value: number; color: string; reverse?: boolean }) {
  return (
    <div className={clsx('flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden', reverse && 'flex justify-end')}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={clsx('h-full rounded-full', color)}
      />
    </div>
  );
}

function DNAComparisonRow({ label, batterValue, bowlerValue }: { label: string; batterValue: number; bowlerValue: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-dark-400 w-7 text-right font-mono">{batterValue}</span>
      <MiniBar value={batterValue} color={batterValue >= 60 ? 'bg-pitch-400' : 'bg-amber-400'} reverse />
      <span className="text-[10px] text-dark-500 w-12 text-center">{label}</span>
      <MiniBar value={bowlerValue} color={bowlerValue >= 60 ? 'bg-purple-400' : 'bg-amber-400'} />
      <span className="text-[10px] text-dark-400 w-7 font-mono">{bowlerValue}</span>
    </div>
  );
}

export function DNAMatchupCard({ matchup, index }: DNAMatchupCardProps) {
  const sr = matchup.strike_rate;
  const batterDominated = sr > 150 && !matchup.was_dismissed;
  const bowlerDominated = matchup.was_dismissed || sr < 80;

  const borderColor = batterDominated
    ? 'border-pitch-500/40'
    : bowlerDominated
    ? 'border-red-500/40'
    : 'border-dark-700';

  // Build DNA comparison rows
  const dnaRows: { label: string; batterValue: number; bowlerValue: number }[] = [];

  if (matchup.batter_dna && matchup.bowler_dna) {
    if (matchup.bowler_dna.type === 'pacer') {
      dnaRows.push({ label: 'vs Pace', batterValue: matchup.batter_dna.vs_pace, bowlerValue: matchup.bowler_dna.speed ? Math.min(100, Math.max(0, ((matchup.bowler_dna.speed - 115) / 40) * 100)) : 50 });
      if (matchup.bowler_dna.swing != null) {
        dnaRows.push({ label: 'Swing', batterValue: matchup.batter_dna.vs_deception, bowlerValue: matchup.bowler_dna.swing });
      }
      if (matchup.bowler_dna.bounce != null) {
        dnaRows.push({ label: 'Bounce', batterValue: matchup.batter_dna.vs_bounce, bowlerValue: matchup.bowler_dna.bounce });
      }
    } else {
      dnaRows.push({ label: 'vs Spin', batterValue: matchup.batter_dna.vs_spin, bowlerValue: matchup.bowler_dna.turn ?? 50 });
      if (matchup.bowler_dna.flight != null) {
        dnaRows.push({ label: 'Flight', batterValue: matchup.batter_dna.vs_deception, bowlerValue: matchup.bowler_dna.flight });
      }
      if (matchup.bowler_dna.variation != null) {
        dnaRows.push({ label: 'Variation', batterValue: matchup.batter_dna.vs_deception, bowlerValue: matchup.bowler_dna.variation });
      }
    }
    if (matchup.bowler_dna.control != null) {
      dnaRows.push({ label: 'Control', batterValue: matchup.batter_dna.power, bowlerValue: matchup.bowler_dna.control });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={clsx(
        'rounded-xl border bg-dark-850 p-3 space-y-2',
        borderColor
      )}
    >
      {/* Header: Batter vs Bowler */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white truncate flex-1">{matchup.batter_name}</span>
        <span className="text-[10px] text-dark-500 px-2">vs</span>
        <span className="text-xs font-semibold text-white truncate flex-1 text-right">{matchup.bowler_name}</span>
      </div>

      {/* Stats line */}
      <div className="flex items-center justify-center gap-3 text-xs">
        <span className="text-white font-semibold">{matchup.runs_scored}<span className="text-dark-500 font-normal">({matchup.balls_faced})</span></span>
        <span className={clsx(
          'font-mono font-semibold',
          sr >= 150 ? 'text-pitch-400' : sr >= 100 ? 'text-white' : 'text-red-400'
        )}>
          SR {sr.toFixed(0)}
        </span>
        {matchup.fours > 0 && <span className="text-blue-400">{matchup.fours}×4</span>}
        {matchup.sixes > 0 && <span className="text-purple-400">{matchup.sixes}×6</span>}
        {matchup.dots > 0 && <span className="text-dark-500">{matchup.dots} dots</span>}
      </div>

      {/* DNA comparison bars */}
      {dnaRows.length > 0 && (
        <div className="space-y-1 pt-1">
          {dnaRows.map((row) => (
            <DNAComparisonRow key={row.label} {...row} />
          ))}
        </div>
      )}

      {/* Dismissal badge */}
      {matchup.was_dismissed && (
        <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
            {matchup.dismissal_type?.replace('_', ' ')}
          </span>
          {matchup.wicket_delivery_type && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
              {matchup.wicket_delivery_type.replace('_', ' ')}
            </span>
          )}
          {matchup.exploited_weakness && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {matchup.exploited_weakness.replace('_', ' ')}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
