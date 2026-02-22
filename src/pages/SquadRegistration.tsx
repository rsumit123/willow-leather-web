import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Globe, Star, User, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { careerApi } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { PageHeader } from '../components/common/PageHeader';
import clsx from 'clsx';

const roleLabels: Record<string, string> = {
  batsman: 'BAT',
  bowler: 'BOWL',
  all_rounder: 'AR',
  wicket_keeper: 'WK',
};

const roleColors: Record<string, string> = {
  batsman: 'text-blue-400',
  bowler: 'text-purple-400',
  all_rounder: 'text-amber-400',
  wicket_keeper: 'text-emerald-400',
};

export function SquadRegistrationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { careerId, career } = useGameStore();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [initialized, setInitialized] = useState(false);

  const MAX_REGISTERED = 15;
  const MAX_OVERSEAS = 2;

  // Get full squad
  const { data: squad, isLoading: squadLoading } = useQuery({
    queryKey: ['squad', careerId, career?.user_team_id],
    queryFn: () =>
      careerApi.getSquad(careerId!, career!.user_team_id!).then((r) => r.data),
    enabled: !!careerId && !!career?.user_team_id,
  });

  // Get current registration
  const { data: registration, isLoading: regLoading } = useQuery({
    queryKey: ['squad-registration', careerId],
    queryFn: () => careerApi.getSquadRegistration(careerId!).then((r) => r.data),
    enabled: !!careerId,
  });

  // Initialize selection from existing registration
  if (registration && !initialized && squad) {
    setSelectedIds(new Set(registration.registered_player_ids));
    setInitialized(true);
  }

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (playerIds: number[]) =>
      careerApi.setSquadRegistration(careerId!, playerIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['squad-registration'] });
      queryClient.invalidateQueries({ queryKey: ['playing-xi'] });
      navigate('/dashboard');
    },
  });

  // Compute validation state
  const validation = useMemo(() => {
    if (!squad) return { errors: [], overseasCount: 0, wkCount: 0 };

    const selected = squad.players.filter((p) => selectedIds.has(p.id));
    const overseasCount = selected.filter((p) => p.is_overseas).length;
    const wkCount = selected.filter((p) => p.role === 'wicket_keeper').length;

    const errors: string[] = [];
    if (selectedIds.size !== MAX_REGISTERED) {
      errors.push(`Select exactly ${MAX_REGISTERED} players (${selectedIds.size}/${MAX_REGISTERED})`);
    }
    if (overseasCount > MAX_OVERSEAS) {
      errors.push(`Max ${MAX_OVERSEAS} overseas (${overseasCount} selected)`);
    }
    if (wkCount < 1 && selectedIds.size === MAX_REGISTERED) {
      errors.push('Must include at least 1 wicket keeper');
    }

    return { errors, overseasCount, wkCount };
  }, [selectedIds, squad]);

  const togglePlayer = (playerId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else if (next.size < MAX_REGISTERED) {
        next.add(playerId);
      }
      return next;
    });
  };

  if (squadLoading || regLoading || !squad) {
    return <Loading fullScreen text="Loading squad..." />;
  }

  // Sort players: registered first, then by rating
  const sortedPlayers = [...squad.players].sort((a, b) => {
    const aSelected = selectedIds.has(a.id) ? 1 : 0;
    const bSelected = selectedIds.has(b.id) ? 1 : 0;
    if (aSelected !== bSelected) return bSelected - aSelected;
    return b.overall_rating - a.overall_rating;
  });

  const isValid = validation.errors.length === 0;

  return (
    <>
      <PageHeader title="Squad Registration" showBack backTo="/dashboard" />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Info */}
        <div className="glass-card p-4">
          <h2 className="font-display font-bold text-white mb-1">
            Register Tournament Squad
          </h2>
          <p className="text-sm text-dark-400">
            Select {MAX_REGISTERED} from {squad.total_players} players for the State
            Tournament. Your playing XI will be picked from these {MAX_REGISTERED}.
          </p>
        </div>

        {/* Progress bar */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">
              {selectedIds.size}/{MAX_REGISTERED} registered
            </span>
            <div className="flex items-center gap-3 text-xs text-dark-400">
              <span>
                <Globe className="w-3 h-3 inline mr-1 text-blue-400" />
                {validation.overseasCount}/{MAX_OVERSEAS} overseas
              </span>
              <span>
                WK: {validation.wkCount}
              </span>
            </div>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <motion.div
              className={clsx(
                'h-full rounded-full transition-colors',
                selectedIds.size === MAX_REGISTERED
                  ? 'bg-pitch-500'
                  : 'bg-blue-500'
              )}
              animate={{ width: `${(selectedIds.size / MAX_REGISTERED) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Validation errors */}
        {validation.errors.length > 0 && selectedIds.size >= MAX_REGISTERED - 1 && (
          <div className="bg-ball-500/10 border border-ball-500/20 rounded-lg p-3">
            {validation.errors.map((err, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-ball-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {err}
              </div>
            ))}
          </div>
        )}

        {/* Player list */}
        <div className="space-y-2">
          {sortedPlayers.map((player) => {
            const isSelected = selectedIds.has(player.id);
            const isFull = selectedIds.size >= MAX_REGISTERED && !isSelected;

            return (
              <motion.button
                key={player.id}
                onClick={() => togglePlayer(player.id)}
                disabled={isFull}
                className={clsx(
                  'w-full glass-card p-3 flex items-center gap-3 transition-all text-left',
                  isSelected && 'ring-2 ring-pitch-500/50 border-pitch-500/30',
                  isFull && 'opacity-40',
                )}
                layout
              >
                {/* Checkbox */}
                <div
                  className={clsx(
                    'w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    isSelected
                      ? 'bg-pitch-500 border-pitch-500'
                      : 'border-dark-500',
                  )}
                >
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>

                {/* Avatar */}
                <div
                  className={clsx(
                    'w-9 h-9 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0',
                  )}
                >
                  <User className="w-4 h-4 text-dark-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-white truncate">
                      {player.name}
                    </span>
                    {player.is_overseas && (
                      <Globe className="w-3 h-3 text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                  <span className={clsx('text-xs font-medium', roleColors[player.role])}>
                    {roleLabels[player.role] || player.role}
                  </span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-sm text-white">
                    {player.overall_rating}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Fixed bottom CTA */}
        <div className="h-20" /> {/* spacer */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-dark-950/95 backdrop-blur-sm border-t border-dark-800 z-40">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => saveMutation.mutate(Array.from(selectedIds))}
              disabled={!isValid || saveMutation.isPending}
              className={clsx(
                'w-full py-3 rounded-xl font-semibold text-sm transition-all',
                isValid
                  ? 'bg-pitch-500 text-white hover:bg-pitch-600'
                  : 'bg-dark-700 text-dark-400 cursor-not-allowed',
              )}
            >
              {saveMutation.isPending
                ? 'Saving...'
                : isValid
                  ? 'Confirm Registration'
                  : `Select ${MAX_REGISTERED - selectedIds.size} more`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
