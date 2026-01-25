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
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center min-h-[200px]">
      <AnimatePresence mode="wait">
        {outcome && (
          <motion.div
            key={outcome}
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className={clsx(
              "w-20 h-20 rounded-full flex items-center justify-center text-3xl font-display font-black text-white shadow-2xl mb-6",
              getOutcomeColor(outcome)
            )}
          >
            {outcome}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {commentary && (
          <motion.p
            key={commentary}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-lg font-medium text-white max-w-sm leading-relaxed"
          >
            {commentary}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
