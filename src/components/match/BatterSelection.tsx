import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AvailableBatter, BatterDNA } from '../../api/client';
import clsx from 'clsx';
import { TraitBadge } from '../common/TraitBadge';

interface BatterSelectionProps {
  batters: AvailableBatter[];
  onSelect: (batterId: number) => void;
  isLoading: boolean;
}

function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    batsman: 'Batsman',
    bowler: 'Bowler',
    all_rounder: 'All-Rounder',
    wicket_keeper: 'WK-Bat',
  };
  return roleMap[role] || role;
}

function DNAMiniBars({ dna }: { dna: BatterDNA }) {
  const stats = [
    { label: 'PAC', value: dna.vs_pace ?? 0 },
    { label: 'BNC', value: dna.vs_bounce ?? 0 },
    { label: 'SPN', value: dna.vs_spin ?? 0 },
    { label: 'PWR', value: dna.power ?? 0 },
  ];

  return (
    <div className="flex gap-2 mt-1.5">
      {stats.map((s) => {
        const color =
          s.value >= 70 ? 'bg-pitch-400' : s.value >= 40 ? 'bg-amber-400' : 'bg-red-400';
        return (
          <div key={s.label} className="flex-1">
            <div className="flex justify-between text-[8px] text-dark-500 mb-0.5">
              <span>{s.label}</span>
              <span>{s.value}</span>
            </div>
            <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
              <div className={clsx('h-full rounded-full', color)} style={{ width: `${s.value}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BatterSelection({ batters, onSelect, isLoading }: BatterSelectionProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = useCallback(
    (batter: AvailableBatter) => {
      if (isLoading) return;
      setSelectedId(batter.id);
    },
    [isLoading]
  );

  const handleConfirm = useCallback(() => {
    if (!selectedId || isLoading) return;
    onSelect(selectedId);
  }, [selectedId, isLoading, onSelect]);

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
            <h2 className="text-xl font-display font-bold text-white">Select Next Batter</h2>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {batters.map((batter) => (
              <button
                key={batter.id}
                onClick={() => handleSelect(batter)}
                disabled={isLoading}
                className={clsx(
                  'w-full p-3 rounded-xl text-left transition-all',
                  selectedId === batter.id
                    ? 'bg-pitch-500/30 border-2 border-pitch-500'
                    : 'bg-dark-800/50 hover:bg-dark-700/50 border border-dark-700'
                )}
              >
                {/* Top row: name + stats */}
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white flex items-center gap-2 flex-wrap">
                      {batter.name}
                      <span
                        className={clsx(
                          'text-xs px-1.5 py-0.5 rounded',
                          batter.batting_skill >= 70
                            ? 'bg-pitch-500/30 text-pitch-400'
                            : batter.batting_skill >= 40
                              ? 'bg-amber-500/30 text-amber-400'
                              : 'bg-red-500/30 text-red-400'
                        )}
                      >
                        {batter.batting_skill}
                      </span>
                      {batter.is_next_in_order && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase font-bold tracking-wide">
                          Next Up
                        </span>
                      )}
                      {batter.traits &&
                        batter.traits.map((trait) => (
                          <TraitBadge key={trait} trait={trait} compact clickable />
                        ))}
                    </div>
                    <div className="text-xs text-dark-400">{formatRole(batter.role)}</div>
                  </div>
                  <div className="text-right">
                    {batter.balls > 0 ? (
                      <>
                        <div className="text-sm text-white">
                          {batter.runs}({batter.balls})
                        </div>
                        <div className="text-xs text-dark-400">
                          {batter.fours}x4 {batter.sixes}x6
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-dark-500">Yet to bat</div>
                    )}
                  </div>
                </div>

                {/* DNA mini-bars */}
                {batter.batting_dna && <DNAMiniBars dna={batter.batting_dna} />}
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
