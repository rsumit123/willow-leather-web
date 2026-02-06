import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import type { BatterDNA } from '../../api/client';
import clsx from 'clsx';

interface ScoutPopupProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  batterDna?: BatterDNA | null;
  isLoading?: boolean;
}

const statLabels: { key: keyof Omit<BatterDNA, 'weaknesses'>; label: string }[] = [
  { key: 'vs_pace', label: 'vs Pace' },
  { key: 'vs_bounce', label: 'vs Bounce' },
  { key: 'vs_spin', label: 'vs Spin' },
  { key: 'vs_deception', label: 'vs Deception' },
  { key: 'off_side', label: 'Off Side' },
  { key: 'leg_side', label: 'Leg Side' },
  { key: 'power', label: 'Power' },
];

function getBarColor(value: number, isWeakness: boolean) {
  if (isWeakness) return 'bg-red-400';
  if (value >= 70) return 'bg-pitch-400';
  if (value >= 40) return 'bg-amber-400';
  return 'bg-red-400';
}

export function ScoutPopup({ isOpen, onClose, playerName, batterDna, isLoading }: ScoutPopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[70]"
          />
          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] max-w-md mx-auto"
          >
            <div className="bg-dark-900 border-t border-dark-700 rounded-t-2xl p-5 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-display font-bold text-white">
                  Scout: {playerName}
                </h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-dark-600 border-t-pitch-400 rounded-full animate-spin" />
                </div>
              ) : batterDna ? (
                <>
                  {/* Stat bars */}
                  <div className="space-y-2.5">
                    {statLabels.map(({ key, label }) => {
                      const value = batterDna[key] as number;
                      const isWeakness = batterDna.weaknesses?.includes(key) ?? false;
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span
                            className={clsx(
                              'text-xs w-24 text-right',
                              isWeakness ? 'text-red-400 font-semibold' : 'text-dark-300'
                            )}
                          >
                            {label}
                          </span>
                          <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${value}%` }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                              className={clsx('h-full rounded-full', getBarColor(value, isWeakness))}
                            />
                          </div>
                          <div className="flex items-center gap-1 w-10">
                            <span
                              className={clsx(
                                'text-xs font-mono font-bold',
                                isWeakness ? 'text-red-400' : 'text-dark-200'
                              )}
                            >
                              {value}
                            </span>
                            {isWeakness && <AlertTriangle className="w-3 h-3 text-red-400" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Weaknesses summary */}
                  {batterDna.weaknesses && batterDna.weaknesses.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-dark-700/50">
                      <span className="text-[10px] uppercase tracking-widest text-dark-500 font-bold">
                        Weaknesses
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {batterDna.weaknesses.map((w) => (
                          <span
                            key={w}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 font-medium"
                          >
                            {w.replace('vs_', '').replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-sm text-dark-400 py-8">
                  No scouting data available
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
