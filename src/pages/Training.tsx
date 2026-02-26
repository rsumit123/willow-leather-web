import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  Users,
  X,
  History,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingApi } from '../api/client';
import type { TrainingPlanPlayer, FocusOption, TrainingImprovement } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { SubPageHeader } from '../components/common/SubPageHeader';
import clsx from 'clsx';

type FilterTab = 'all' | 'batsman' | 'bowler' | 'all_rounder' | 'no_plan';

const ROLE_LABELS: Record<string, string> = {
  batsman: 'BAT',
  bowler: 'BOWL',
  all_rounder: 'AR',
  wicket_keeper: 'WK',
};

const ROLE_COLORS: Record<string, string> = {
  batsman: 'bg-blue-500/20 text-blue-400',
  bowler: 'bg-red-500/20 text-red-400',
  all_rounder: 'bg-purple-500/20 text-purple-400',
  wicket_keeper: 'bg-amber-500/20 text-amber-400',
};

const DNA_BAR_COLORS = [
  'bg-blue-400',
  'bg-emerald-400',
  'bg-amber-400',
  'bg-purple-400',
  'bg-red-400',
  'bg-cyan-400',
  'bg-orange-400',
];

function DNABar({ label, value, max = 99, colorClass }: { label: string; value: number; max?: number; colorClass: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-dark-400 w-16 text-right truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full', colorClass)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-dark-300 w-6 text-right">{value}</span>
    </div>
  );
}

function PlayerDNASummary({ player }: { player: TrainingPlanPlayer }) {
  const bars: { label: string; value: number; max?: number }[] = [];

  // Batting DNA
  if (player.batting_dna) {
    const d = player.batting_dna;
    if (player.role === 'bowler') {
      // Show fewer batting stats for bowlers
      bars.push({ label: 'vs Pace', value: d.vs_pace });
      bars.push({ label: 'vs Spin', value: d.vs_spin });
    } else {
      bars.push({ label: 'vs Pace', value: d.vs_pace });
      bars.push({ label: 'vs Spin', value: d.vs_spin });
      bars.push({ label: 'vs Bounce', value: d.vs_bounce });
      bars.push({ label: 'Power', value: d.power });
    }
  }

  // Bowling DNA
  if (player.bowling_dna) {
    const d = player.bowling_dna;
    if ((d as any).type === 'spinner') {
      bars.push({ label: 'Turn', value: (d as any).turn });
      bars.push({ label: 'Flight', value: (d as any).flight });
      bars.push({ label: 'Control', value: (d as any).control });
    } else {
      bars.push({ label: 'Speed', value: (d as any).speed, max: 155 });
      bars.push({ label: 'Swing', value: (d as any).swing });
      bars.push({ label: 'Control', value: (d as any).control });
    }
  }

  if (bars.length === 0) return null;

  return (
    <div className="space-y-1 mt-2">
      {bars.map((bar, i) => (
        <DNABar
          key={bar.label}
          label={bar.label}
          value={bar.value}
          max={bar.max}
          colorClass={DNA_BAR_COLORS[i % DNA_BAR_COLORS.length]}
        />
      ))}
    </div>
  );
}

function FocusSelector({
  player,
  focusOptions,
  onSelect,
  isPending,
  isOpen,
  onToggle,
}: {
  player: TrainingPlanPlayer;
  focusOptions: FocusOption[];
  onSelect: (focus: string) => void;
  isPending: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const validOptions = focusOptions.filter((o) => player.valid_focuses.includes(o.focus));

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        disabled={isPending}
        className={clsx(
          'text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors',
          player.current_focus
            ? 'bg-pitch-500/20 text-pitch-400 hover:bg-pitch-500/30'
            : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
        )}
      >
        {isPending ? (
          <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        ) : player.current_focus ? (
          player.focus_display_name
        ) : (
          'Set Plan'
        )}
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute right-0 top-full mt-1 z-50 w-56 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto">
              {validOptions.map((option) => (
                <button
                  key={option.focus}
                  onClick={() => {
                    onSelect(option.focus);
                    onToggle();
                  }}
                  className={clsx(
                    'w-full text-left px-3 py-2 text-xs hover:bg-dark-700/50 transition-colors flex items-center gap-2',
                    player.current_focus === option.focus && 'bg-pitch-500/10'
                  )}
                >
                  <div className="flex-1">
                    <p className="text-white font-medium">{option.display_name}</p>
                    <p className="text-dark-400 text-[10px] mt-0.5">{option.description}</p>
                  </div>
                  {player.current_focus === option.focus && (
                    <Check className="w-3 h-3 text-pitch-400 flex-shrink-0" />
                  )}
                </button>
              ))}
              {player.current_focus && (
                <button
                  onClick={() => {
                    onSelect('__remove__');
                    onToggle();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 border-t border-dark-700"
                >
                  <X className="w-3 h-3" />
                  Remove Plan
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TrainingHistorySection({
  history,
  isLoading: loading,
}: {
  history: TrainingImprovement[] | undefined;
  isLoading: boolean;
}) {
  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="w-6 h-6 border-2 border-pitch-500/30 border-t-pitch-500 rounded-full animate-spin mx-auto" />
        <p className="text-xs text-dark-400 mt-2">Loading history...</p>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="w-10 h-10 text-dark-600 mx-auto mb-2" />
        <p className="text-sm text-dark-400">No training history yet.</p>
        <p className="text-xs text-dark-500 mt-1">Improvements will appear here after training days.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-2">
      {history.map((item, i) => (
        <motion.div
          key={`${item.player_id}-${item.attribute}-${i}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.02 }}
          className="glass-card p-3 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-pitch-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-pitch-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{item.player_name}</p>
            <p className="text-[10px] text-dark-400">
              {item.attribute.replace(/_/g, ' ')} • {item.focus.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-dark-400 font-mono">{item.old_value}</span>
              <ArrowRight className="w-3 h-3 text-dark-500" />
              <span className="text-white font-mono font-medium">{item.new_value}</span>
            </div>
            <span className="text-[10px] text-pitch-400 font-medium">+{item.gain}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function TrainingPage() {
  const queryClient = useQueryClient();
  const { careerId } = useGameStore();

  const [filter, setFilter] = useState<FilterTab>('all');
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);
  const [pendingPlayerId, setPendingPlayerId] = useState<number | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['training-plans', careerId],
    queryFn: () => trainingApi.getPlans(careerId!).then((r) => r.data),
    enabled: !!careerId,
  });

  const { data: trainingHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['training-history', careerId],
    queryFn: () => trainingApi.getHistory(careerId!, 30).then((r) => r.data),
    enabled: !!careerId && showHistory,
  });

  const setPlanMutation = useMutation({
    mutationFn: ({ playerId, focus }: { playerId: number; focus: string }) =>
      trainingApi.setPlan(careerId!, playerId, focus),
    onMutate: ({ playerId }) => setPendingPlayerId(playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
      setPendingPlayerId(null);
    },
    onError: () => setPendingPlayerId(null),
  });

  const removePlanMutation = useMutation({
    mutationFn: (playerId: number) => trainingApi.removePlan(careerId!, playerId),
    onMutate: (playerId) => setPendingPlayerId(playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
      setPendingPlayerId(null);
    },
    onError: () => setPendingPlayerId(null),
  });

  const players = plansData?.players || [];
  const focusOptions = plansData?.focus_options || [];

  const withPlan = players.filter((p) => p.current_focus);
  const withoutPlan = players.filter((p) => !p.current_focus);

  const filteredPlayers = useMemo(() => {
    if (filter === 'no_plan') return withoutPlan;
    if (filter === 'all') return players;
    return players.filter((p) => p.role === filter);
  }, [players, filter, withoutPlan]);

  const handleFocusSelect = (playerId: number, focus: string) => {
    if (focus === '__remove__') {
      removePlanMutation.mutate(playerId);
    } else {
      setPlanMutation.mutate({ playerId, focus });
    }
  };

  if (!careerId) return null;
  if (isLoading) return <Loading fullScreen text="Loading training plans..." />;

  return (
    <>
      <SubPageHeader title="Training Center" showBack backTo="/dashboard" />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-24">
        {/* Summary */}
        <div className={clsx(
          'glass-card p-4 flex items-center gap-3',
          withoutPlan.length > 0 && 'border-amber-500/30',
        )}>
          <div className={clsx(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            withoutPlan.length === 0 ? 'bg-pitch-500/20' : 'bg-amber-500/20'
          )}>
            {withoutPlan.length === 0 ? (
              <Check className="w-5 h-5 text-pitch-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {withPlan.length}/{players.length} players have training plans
            </p>
            <p className="text-xs text-dark-400">
              {withoutPlan.length === 0
                ? 'All players will improve on training days'
                : `${withoutPlan.length} player(s) won't train — set their plans!`}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {([
            { key: 'all', label: 'All' },
            { key: 'batsman', label: 'Batsmen' },
            { key: 'bowler', label: 'Bowlers' },
            { key: 'all_rounder', label: 'All-Round' },
            { key: 'no_plan', label: `No Plan (${withoutPlan.length})` },
          ] as { key: FilterTab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                filter === key
                  ? 'bg-pitch-500/20 text-pitch-400'
                  : 'bg-dark-800/50 text-dark-400 hover:text-white'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Player List */}
        <div className="space-y-2">
          {filteredPlayers.map((player, i) => {
            const isExpanded = expandedPlayer === player.player_id;
            const isPending = pendingPlayerId === player.player_id;
            const isDropdownOpen = openDropdownId === player.player_id;

            return (
              <motion.div
                key={player.player_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={clsx(
                  'glass-card transition-all relative',
                  !player.current_focus && 'border-amber-500/20',
                  isDropdownOpen && 'z-30',
                )}
                style={isDropdownOpen ? { zIndex: 30 } : undefined}
              >
                {/* Main row */}
                <div className="p-3 flex items-center gap-3">
                  {/* Player info */}
                  <button
                    onClick={() => setExpandedPlayer(isExpanded ? null : player.player_id)}
                    className="flex-1 flex items-center gap-2.5 text-left min-w-0"
                  >
                    <div className="flex-shrink-0">
                      <span className={clsx(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded',
                        ROLE_COLORS[player.role] || 'bg-dark-700 text-dark-400'
                      )}>
                        {ROLE_LABELS[player.role] || player.role}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{player.player_name}</p>
                      <p className="text-[10px] text-dark-500">
                        OVR {player.overall_rating} • Age {player.age}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-dark-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-dark-500 flex-shrink-0" />
                    )}
                  </button>

                  {/* Focus selector */}
                  <FocusSelector
                    player={player}
                    focusOptions={focusOptions}
                    onSelect={(focus) => handleFocusSelect(player.player_id, focus)}
                    isPending={isPending}
                    isOpen={isDropdownOpen}
                    onToggle={() => setOpenDropdownId(isDropdownOpen ? null : player.player_id)}
                  />
                </div>

                {/* Expanded DNA detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 border-t border-dark-700/50">
                        <PlayerDNASummary player={player} />

                        {/* Recommended focuses */}
                        <div className="mt-3">
                          <p className="text-[10px] text-dark-500 uppercase tracking-wider mb-1.5">
                            Recommended Focuses
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {focusOptions
                              .filter(
                                (o) =>
                                  player.valid_focuses.includes(o.focus) &&
                                  o.best_for_roles.includes(player.role)
                              )
                              .slice(0, 6)
                              .map((option) => (
                                <button
                                  key={option.focus}
                                  onClick={() => handleFocusSelect(player.player_id, option.focus)}
                                  className={clsx(
                                    'text-[10px] px-2 py-1 rounded-md transition-colors',
                                    player.current_focus === option.focus
                                      ? 'bg-pitch-500/20 text-pitch-400'
                                      : 'bg-dark-700/50 text-dark-400 hover:text-white hover:bg-dark-700'
                                  )}
                                >
                                  {option.display_name}
                                </button>
                              ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {filteredPlayers.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-sm text-dark-400">
              {filter === 'no_plan' ? 'All players have training plans!' : 'No players match this filter.'}
            </p>
          </div>
        )}

        {/* ─── Training History ─── */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full glass-card p-3 flex items-center justify-between hover:border-dark-500 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-dark-400" />
            <span className="text-sm font-medium text-white">Training History</span>
          </div>
          {showHistory ? (
            <ChevronUp className="w-4 h-4 text-dark-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-dark-500" />
          )}
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <TrainingHistorySection history={trainingHistory} isLoading={historyLoading} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
