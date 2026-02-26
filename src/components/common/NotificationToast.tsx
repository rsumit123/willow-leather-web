import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Target,
  Star,
  Dumbbell,
  AlertTriangle,
  Bell,
  X,
} from 'lucide-react';
import type { Notification } from '../../api/client';
import clsx from 'clsx';

const ICON_MAP: Record<string, typeof Trophy> = {
  trophy: Trophy,
  target: Target,
  star: Star,
  dumbbell: Dumbbell,
  'x-circle': AlertTriangle,
  'alert-triangle': AlertTriangle,
};

const TYPE_COLORS: Record<string, string> = {
  promotion: 'border-l-pitch-500',
  match_result: 'border-l-blue-400',
  board_objective: 'border-l-amber-400',
  injury: 'border-l-ball-500',
  sacked: 'border-l-red-500',
  milestone: 'border-l-yellow-400',
  training: 'border-l-blue-400',
};

export function NotificationToast({
  notification,
  onDismiss,
}: {
  notification: Notification | null;
  onDismiss: () => void;
}) {
  const navigate = useNavigate();

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(handleDismiss, 5000);
    return () => clearTimeout(timer);
  }, [notification, handleDismiss]);

  const IconComp = notification ? (ICON_MAP[notification.icon || ''] || Bell) : Bell;
  const borderColor = notification ? (TYPE_COLORS[notification.type] || 'border-l-dark-500') : '';

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto pointer-events-none">
      <AnimatePresence>
        {notification && (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={clsx(
              'pointer-events-auto bg-dark-900/95 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-4 border-l-2 shadow-2xl cursor-pointer',
              borderColor,
            )}
            onClick={() => {
              navigate(notification.action_url || '/inbox');
              handleDismiss();
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-pitch-500/20 flex items-center justify-center flex-shrink-0">
                <IconComp className="w-4 h-4 text-pitch-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{notification.title}</p>
                <p className="text-xs text-dark-400 mt-0.5 line-clamp-2">{notification.body}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="p-1 hover:bg-dark-700 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5 text-dark-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
