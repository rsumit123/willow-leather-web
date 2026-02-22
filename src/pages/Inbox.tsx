import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  Target,
  AlertTriangle,
  Star,
  Dumbbell,
  Bell,
  CheckCheck,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../api/client';
import type { Notification } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { PageHeader } from '../components/common/PageHeader';
import clsx from 'clsx';

const ICON_MAP: Record<string, typeof Trophy> = {
  trophy: Trophy,
  target: Target,
  star: Star,
  dumbbell: Dumbbell,
  'x-circle': AlertTriangle,
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

function groupByDate(notifications: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const n of notifications) {
    const d = new Date(n.created_at).toDateString();
    let label: string;
    if (d === today) label = 'Today';
    else if (d === yesterday) label = 'Yesterday';
    else label = new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }
  return groups;
}

export function InboxPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { careerId } = useGameStore();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', careerId],
    queryFn: () => notificationApi.list(careerId!, 50).then((r) => r.data),
    enabled: !!careerId,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(careerId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markRead(careerId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  if (!careerId) return null;
  if (isLoading) return <Loading fullScreen text="Loading inbox..." />;

  const grouped = groupByDate(notifications || []);
  const hasUnread = notifications?.some((n) => !n.read);

  return (
    <>
      <PageHeader
        title="Inbox"
        action={
          hasUnread ? (
            <button
              onClick={() => markAllReadMutation.mutate()}
              className="text-sm text-pitch-400 hover:text-pitch-300 transition-colors flex items-center gap-1"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All
            </button>
          ) : undefined
        }
      />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {(!notifications || notifications.length === 0) && (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">No Notifications</h2>
            <p className="text-dark-400 text-sm">
              Board messages, match results, and events will appear here.
            </p>
          </div>
        )}

        {Object.entries(grouped).map(([label, items]) => (
          <div key={label}>
            <h3 className="text-xs font-medium text-dark-500 uppercase tracking-wider mb-2">
              {label}
            </h3>
            <div className="space-y-2">
              {items.map((n, i) => {
                const IconComp = ICON_MAP[n.icon || ''] || Bell;
                const borderColor = TYPE_COLORS[n.type] || 'border-l-dark-500';

                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => {
                      if (!n.read) markReadMutation.mutate(n.id);
                      if (n.action_url) navigate(n.action_url);
                    }}
                    className={clsx(
                      'glass-card p-4 border-l-2 cursor-pointer hover:bg-dark-800/50 transition-colors',
                      borderColor,
                      !n.read && 'bg-dark-850',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={clsx(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        !n.read ? 'bg-pitch-500/20' : 'bg-dark-700/50',
                      )}>
                        <IconComp className={clsx('w-4 h-4', !n.read ? 'text-pitch-400' : 'text-dark-400')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={clsx(
                          'text-sm font-medium',
                          !n.read ? 'text-white' : 'text-dark-300',
                        )}>
                          {n.title}
                        </p>
                        <p className="text-xs text-dark-400 mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-pitch-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
