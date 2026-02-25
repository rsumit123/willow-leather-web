import { motion, AnimatePresence } from 'framer-motion';
import type { PitchInfo } from '../../api/client';
import { Users } from 'lucide-react';
import clsx from 'clsx';

interface PitchRevealProps {
  isOpen: boolean;
  onStartMatch: () => void;
  onEditXI?: () => void;
  isStarting?: boolean;
  pitchInfo?: PitchInfo | null;
}

const pitchColors: Record<string, { gradient: string; accent: string }> = {
  green_seamer: { gradient: 'from-emerald-900/40 to-emerald-800/10', accent: 'text-emerald-400' },
  dust_bowl: { gradient: 'from-amber-900/40 to-amber-800/10', accent: 'text-amber-400' },
  flat_deck: { gradient: 'from-gray-800/40 to-gray-700/10', accent: 'text-gray-400' },
  bouncy_track: { gradient: 'from-orange-900/40 to-orange-800/10', accent: 'text-orange-400' },
  slow_turner: { gradient: 'from-purple-900/40 to-purple-800/10', accent: 'text-purple-400' },
  balanced: { gradient: 'from-blue-900/40 to-blue-800/10', accent: 'text-blue-400' },
};

const pitchFlavor: Record<string, string> = {
  green_seamer: 'Fast bowlers will love this surface.',
  dust_bowl: 'Spinners will dominate as the pitch wears.',
  flat_deck: 'A batting paradise — expect high scores.',
  bouncy_track: 'Expect steep bounce and uneven carry.',
  slow_turner: 'The ball will grip and turn progressively.',
  balanced: 'Even contest between bat and ball.',
};

const statLabels = [
  { key: 'pace_assist' as const, label: 'Pace Assist' },
  { key: 'spin_assist' as const, label: 'Spin Assist' },
  { key: 'bounce' as const, label: 'Bounce' },
  { key: 'deterioration' as const, label: 'Deterioration' },
];

export function PitchReveal({ isOpen, onStartMatch, onEditXI, isStarting, pitchInfo }: PitchRevealProps) {
  if (!pitchInfo) return null;

  const colors = pitchColors[pitchInfo.name] || pitchColors.balanced;
  const flavor = pitchFlavor[pitchInfo.name] || '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-[55] flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={clsx(
              'max-w-sm w-full rounded-2xl border border-dark-700/50 overflow-hidden bg-gradient-to-b',
              colors.gradient,
              'bg-dark-900'
            )}
          >
            <div className="p-6 text-center">
              <p className="text-xs text-dark-400 uppercase tracking-wider mb-1">Pitch Report</p>
              <h2 className={clsx('text-2xl font-display font-bold mb-1', colors.accent)}>
                {pitchInfo.display_name}
              </h2>
              {flavor && (
                <p className="text-sm text-dark-300 italic mb-5">
                  {flavor}
                </p>
              )}

              <div className="space-y-3">
                {statLabels.map(({ key, label }) => {
                  const value = pitchInfo[key];
                  const barColor = value >= 70 ? 'bg-pitch-400' : value >= 40 ? 'bg-amber-400' : 'bg-dark-500';
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-dark-300 w-28 text-right">{label}</span>
                      <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${value}%` }}
                          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                          className={clsx('h-full rounded-full', barColor)}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-dark-200 w-8">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 pb-6 space-y-2">
              <button
                onClick={onStartMatch}
                disabled={isStarting}
                className="btn-primary w-full py-3 rounded-xl text-sm font-semibold"
              >
                {isStarting ? 'Starting...' : 'Start Match'}
              </button>
              {onEditXI && (
                <button
                  onClick={onEditXI}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-dark-300 hover:text-white hover:bg-dark-700/50 transition-colors flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Edit Playing XI
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
