import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AvailableBowler, BowlerDNA } from '../../api/client';
import clsx from 'clsx';
import { TraitBadge } from '../common/TraitBadge';

interface BowlerSelectionProps {
  bowlers: AvailableBowler[];
  onSelect: (bowlerId: number) => void;
  isLoading: boolean;
}

function formatBowlingType(type: string): string {
  const typeMap: Record<string, string> = {
    pace: 'Fast',
    medium: 'Medium',
    off_spin: 'Off Spin',
    leg_spin: 'Leg Spin',
    left_arm_spin: 'Left Arm Spin',
    none: '',
  };
  return typeMap[type] || type;
}

const deliveryDisplayNames: Record<string, string> = {
  good_length: 'Good Length',
  outswinger: 'Outswinger',
  inswinger: 'Inswinger',
  bouncer: 'Bouncer',
  yorker: 'Yorker',
  slower_ball: 'Slower Ball',
  wide_yorker: 'Wide Yorker',
  stock_ball: 'Stock Ball',
  flighted: 'Flighted',
  arm_ball: 'Arm Ball',
  flat_quick: 'Flat Quick',
  wide_of_off: 'Wide of Off',
};

function DNAMiniBars({ dna }: { dna: BowlerDNA }) {
  const stats =
    dna.type === 'pacer'
      ? [
          { label: 'SPD', value: dna.speed ?? 0, max: 155, isSpeed: true },
          { label: 'SWG', value: dna.swing ?? 0 },
          { label: 'BNC', value: dna.bounce ?? 0 },
          { label: 'CTL', value: dna.control ?? 0 },
        ]
      : [
          { label: 'TRN', value: dna.turn ?? 0 },
          { label: 'FLT', value: dna.flight ?? 0 },
          { label: 'VAR', value: dna.variation ?? 0 },
          { label: 'CTL', value: dna.control ?? 0 },
        ];

  return (
    <div className="flex gap-2 mt-1.5">
      {stats.map((s) => {
        // Normalize speed (120-155kph) to 0-100 for bar width
        const pct = s.isSpeed ? Math.min(100, Math.max(0, ((s.value - 115) / 40) * 100)) : s.value;
        const color =
          pct >= 70 ? 'bg-pitch-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400';
        return (
          <div key={s.label} className="flex-1">
            <div className="flex justify-between text-[8px] text-dark-500 mb-0.5">
              <span>{s.label}</span>
              <span>{s.value}</span>
            </div>
            <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
              <div className={clsx('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BowlerSelection({ bowlers, onSelect, isLoading }: BowlerSelectionProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = useCallback(
    (bowler: AvailableBowler) => {
      if (!bowler.can_bowl || isLoading) return;
      setSelectedId(bowler.id);
    },
    [isLoading]
  );

  const handleConfirm = useCallback(() => {
    if (!selectedId || isLoading) return;
    const selectedBowler = bowlers.find((b) => b.id === selectedId);
    if (selectedBowler && selectedBowler.can_bowl) {
      onSelect(selectedId);
    }
  }, [selectedId, isLoading, bowlers, onSelect]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card p-6 max-w-md w-full"
        >
          <div className="mb-4">
            <h2 className="text-xl font-display font-bold text-white">Select Bowler</h2>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {bowlers.map((bowler) => (
              <button
                key={bowler.id}
                onClick={() => handleSelect(bowler)}
                disabled={!bowler.can_bowl || isLoading}
                className={clsx(
                  'w-full p-3 rounded-xl text-left transition-all',
                  bowler.can_bowl
                    ? selectedId === bowler.id
                      ? 'bg-pitch-500/30 border-2 border-pitch-500'
                      : 'bg-dark-800/50 hover:bg-dark-700/50 border border-dark-700'
                    : 'bg-dark-900/50 border border-dark-800 opacity-50 cursor-not-allowed'
                )}
              >
                {/* Top row: name + stats */}
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white flex items-center gap-2 flex-wrap">
                      {bowler.name}
                      <span
                        className={clsx(
                          'text-xs px-1.5 py-0.5 rounded',
                          bowler.bowling_skill >= 70
                            ? 'bg-pitch-500/30 text-pitch-400'
                            : bowler.bowling_skill >= 40
                              ? 'bg-amber-500/30 text-amber-400'
                              : 'bg-red-500/30 text-red-400'
                        )}
                      >
                        {bowler.bowling_skill}
                      </span>
                      {bowler.traits &&
                        bowler.traits.map((trait) => (
                          <TraitBadge key={trait} trait={trait} compact clickable />
                        ))}
                    </div>
                    <div className="text-xs text-dark-400">{formatBowlingType(bowler.bowling_type)}</div>
                    {!bowler.can_bowl && bowler.reason && (
                      <div className="text-xs text-red-400 mt-1">{bowler.reason}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white">
                      {bowler.wickets}/{bowler.runs_conceded}
                    </div>
                    <div className="text-xs text-dark-400">
                      {bowler.overs_bowled} ov | {bowler.economy} econ
                    </div>
                  </div>
                </div>

                {/* DNA mini-bars */}
                {bowler.bowling_dna && <DNAMiniBars dna={bowler.bowling_dna} />}

                {/* Repertoire tags */}
                {bowler.repertoire && bowler.repertoire.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {bowler.repertoire.map((d) => (
                      <span
                        key={d}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-dark-700/60 text-dark-300 border border-dark-600/30"
                      >
                        {deliveryDisplayNames[d] || d}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <button
              onClick={handleConfirm}
              disabled={!selectedId || isLoading}
              className={clsx(
                'w-full btn-primary',
                (!selectedId || isLoading) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isLoading ? 'Selecting...' : 'Confirm'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
