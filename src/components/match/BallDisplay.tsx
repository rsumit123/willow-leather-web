import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface BallDisplayProps {
  outcome?: string;
  commentary?: string;
}

export function BallDisplay({ outcome, commentary }: BallDisplayProps) {
  if (!outcome && !commentary) return null;

  const getOutcomeColor = (out?: string) => {
    if (out === 'W') return 'bg-ball-500';
    if (out === '4' || out === '6') return 'bg-yellow-500';
    if (out === '0' || out === '.') return 'bg-dark-700';
    return 'bg-pitch-500';
  };

  return (
    <div className="px-4 py-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${outcome}-${commentary}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-3 bg-dark-800/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-dark-700/50"
        >
          {outcome && (
            <div
              className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center text-lg font-display font-bold text-white flex-shrink-0 shadow-lg",
                getOutcomeColor(outcome)
              )}
            >
              {outcome}
            </div>
          )}
          {commentary && (
            <p className="text-sm text-dark-200 leading-snug line-clamp-2 flex-1">
              {commentary}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
