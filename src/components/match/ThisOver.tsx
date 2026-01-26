import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ThisOverProps {
  outcomes: string[];
}

export function ThisOver({ outcomes }: ThisOverProps) {
  const getOutcomeStyles = (outcome: string) => {
    if (outcome === 'W') return 'bg-ball-500 text-white border-ball-500';
    if (outcome === '4' || outcome === '6') return 'bg-yellow-500/30 text-yellow-400 border-yellow-500/50 font-bold';
    if (outcome === '0' || outcome === '.') return 'bg-dark-700/50 text-dark-400 border-dark-600';
    return 'bg-pitch-500/30 text-pitch-400 border-pitch-500/50 font-medium';
  };

  // Show last 6 balls
  const displayCount = 6;
  const visibleOutcomes = outcomes.length > displayCount
    ? outcomes.slice(-displayCount)
    : outcomes;

  return (
    <div className="flex flex-col gap-2 px-4 py-2">
      <span className="text-[10px] uppercase font-bold tracking-widest text-dark-500">This Over</span>
      <div className="flex items-center gap-2">
        {Array.from({ length: displayCount }).map((_, i) => {
          const outcome = visibleOutcomes[i];
          return (
            <motion.div
              key={i}
              initial={outcome ? { scale: 0.8, opacity: 0 } : {}}
              animate={outcome ? { scale: 1, opacity: 1 } : {}}
              className={clsx(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all border",
                outcome ? getOutcomeStyles(outcome) : "border-dark-700/50 text-transparent"
              )}
            >
              {outcome || '○'}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
