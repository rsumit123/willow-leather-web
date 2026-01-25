import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ThisOverProps {
  outcomes: string[];
}

export function ThisOver({ outcomes }: ThisOverProps) {
  const getOutcomeStyles = (outcome: string) => {
    if (outcome === 'W') return 'bg-ball-500 text-white';
    if (outcome === '4' || outcome === '6') return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold';
    if (outcome === '0' || outcome === '.') return 'bg-dark-800 text-dark-500';
    return 'bg-pitch-500/20 text-pitch-400 border border-pitch-500/30 font-medium';
  };

  return (
    <div className="flex flex-col gap-2 p-4 glass-card mx-4 my-2">
      <span className="text-[10px] uppercase font-bold tracking-widest text-dark-500">This Over</span>
      <div className="flex items-center gap-2">
        {Array.from({ length: 6 }).map((_, i) => {
          const outcome = outcomes[i];
          return (
            <motion.div
              key={i}
              initial={outcome ? { scale: 0.8, opacity: 0 } : {}}
              animate={outcome ? { scale: 1, opacity: 1 } : {}}
              className={clsx(
                "w-10 h-10 rounded-xl flex items-center justify-center text-sm transition-all",
                outcome ? getOutcomeStyles(outcome) : "bg-dark-800/30 border border-dark-700/30 text-transparent"
              )}
            >
              {outcome || '•'}
            </motion.div>
          );
        })}
        {outcomes.length > 6 && (
          <div className="text-xs text-dark-400 pl-1">
            +{outcomes.length - 6}
          </div>
        )}
      </div>
    </div>
  );
}
