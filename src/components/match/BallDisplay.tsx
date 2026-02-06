import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface BallDisplayProps {
  outcome?: string;
  commentary?: string;
  deliveryName?: string;
  contactQuality?: string;
}

export function BallDisplay({ outcome, commentary, deliveryName, contactQuality }: BallDisplayProps) {
  if (!outcome && !commentary) return null;

  const getOutcomeColor = (out?: string) => {
    if (out === 'W') return 'bg-ball-500';
    if (out === '4' || out === '6') return 'bg-yellow-500';
    if (out === '0' || out === '.') return 'bg-dark-700';
    return 'bg-pitch-500';
  };

  const getContactColor = (quality?: string) => {
    if (quality === 'middled') return 'text-pitch-400';
    if (quality === 'edged') return 'text-amber-400';
    if (quality === 'beaten') return 'text-ball-400';
    return 'text-dark-500';
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
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center text-lg font-display font-bold text-white shadow-lg",
                  getOutcomeColor(outcome)
                )}
              >
                {outcome}
              </div>
              {deliveryName && (
                <span className="text-[9px] text-dark-400 font-medium truncate max-w-[60px]">
                  {deliveryName}
                </span>
              )}
            </div>
          )}
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            {commentary && (
              <p className="text-sm text-dark-200 leading-snug line-clamp-2">
                {commentary}
              </p>
            )}
            {contactQuality && (
              <span className={clsx('text-[10px] font-medium', getContactColor(contactQuality))}>
                {contactQuality}
              </span>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
