import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X } from 'lucide-react';

interface CoachMarkProps {
  id: string;
  title: string;
  message: string;
  isVisible: boolean;
  onDismiss: (id: string) => void;
}

export function CoachMark({ id, title, message, isVisible, onDismiss }: CoachMarkProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-300">{title}</p>
            <p className="text-xs text-dark-300 mt-0.5">{message}</p>
          </div>
          <button
            onClick={() => onDismiss(id)}
            className="text-dark-500 hover:text-dark-300 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
