import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, Zap, Star } from 'lucide-react';
import clsx from 'clsx';

export type MilestoneType = 'fifty' | 'hundred' | 'wicket' | 'hatrick';

interface MilestoneAlertProps {
  type: MilestoneType;
  playerName: string;
  detail?: string; // e.g., "87(52)" or "caught by X"
  isVisible: boolean;
  onClose: () => void;
}

const milestoneConfig: Record<MilestoneType, {
  icon: typeof Trophy;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  fifty: {
    icon: Star,
    title: 'FIFTY!',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
  },
  hundred: {
    icon: Trophy,
    title: 'CENTURY!',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
  },
  wicket: {
    icon: Target,
    title: 'WICKET!',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
  },
  hatrick: {
    icon: Zap,
    title: 'HAT-TRICK!',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
  },
};

export function MilestoneAlert({ type, playerName, detail, isVisible, onClose }: MilestoneAlertProps) {
  const config = milestoneConfig[type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-20 left-4 right-4 z-40 flex justify-center pointer-events-none"
        >
          <motion.div
            className={clsx(
              'glass-card px-5 py-4 max-w-sm w-full text-center pointer-events-auto',
              config.borderColor
            )}
            onClick={onClose}
          >
            {/* Icon with pulse animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
              className={clsx('w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center', config.bgColor)}
            >
              <Icon className={clsx('w-6 h-6', config.color)} />
            </motion.div>

            {/* Title */}
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={clsx('text-xl font-display font-bold mb-1', config.color)}
            >
              {config.title}
            </motion.h3>

            {/* Player name */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white font-semibold"
            >
              {playerName}
            </motion.p>

            {/* Detail */}
            {detail && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-dark-400 text-sm mt-1"
              >
                {detail}
              </motion.p>
            )}

            {/* Tap to dismiss hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.5 }}
              className="text-dark-500 text-xs mt-3"
            >
              Tap to dismiss
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
