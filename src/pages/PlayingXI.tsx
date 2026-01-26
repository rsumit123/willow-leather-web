import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Check,
  AlertCircle,
  Globe,
  Shield,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { careerApi, type Player } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { PageHeader } from '../components/common/PageHeader';
import clsx from 'clsx';

const ROLE_ORDER = ['wicket_keeper', 'batsman', 'all_rounder', 'bowler'];
const ROLE_LABELS: Record<string, string> = {
  wicket_keeper: 'Wicket Keepers',
  batsman: 'Batsmen',
  all_rounder: 'All-Rounders',
  bowler: 'Bowlers',
};

export function PlayingXIPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { careerId, career } = useGameStore();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Get squad
  const { data: squad, isLoading: squadLoading } = useQuery({
    queryKey: ['squad', careerId, career?.user_team_id],
    queryFn: () =>
      careerApi.getSquad(careerId!, career!.user_team_id!).then((r) => r.data),
    enabled: !!careerId && !!career?.user_team_id,
  });

  // Get existing playing XI
  const { data: existingXI, isLoading: xiLoading } = useQuery({
    queryKey: ['playing-xi', careerId],
    queryFn: () => careerApi.getPlayingXI(careerId!).then((r) => r.data),
    enabled: !!careerId,
  });

  // Validate selection (real-time)
  const { data: validation } = useQuery({
    queryKey: ['playing-xi-validation', careerId, selectedIds],
    queryFn: () =>
      careerApi.validatePlayingXI(careerId!, selectedIds).then((r) => r.data),
    enabled: !!careerId && selectedIds.length > 0,
  });

  // Set playing XI mutation
  const setXIMutation = useMutation({
    mutationFn: () => careerApi.setPlayingXI(careerId!, selectedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playing-xi'] });
      navigate('/dashboard');
    },
  });

  // Initialize selection from existing XI
  useEffect(() => {
    if (existingXI?.is_set && existingXI.players.length > 0) {
      setSelectedIds(existingXI.players.map((p) => p.id));
    }
  }, [existingXI]);

  // Group players by role
  const playersByRole = useMemo(() => {
    if (!squad?.players) return {};
    const grouped: Record<string, Player[]> = {};
    for (const role of ROLE_ORDER) {
      grouped[role] = squad.players.filter((p) => p.role === role);
    }
    return grouped;
  }, [squad]);

  // Toggle player selection
  const togglePlayer = (playerId: number) => {
    setSelectedIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  if (squadLoading || xiLoading) {
    return <Loading fullScreen text="Loading squad..." />;
  }

  if (!squad) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center">
        <p className="text-dark-400">No squad found</p>
      </div>
    );
  }

  const selectedPlayers = squad.players.filter((p) => selectedIds.includes(p.id));
  const overseasSelected = selectedPlayers.filter((p) => p.is_overseas).length;
  const isValid = validation?.valid && selectedIds.length === 11;

  return (
    <>
      <PageHeader title="Playing XI" showBack backTo="/dashboard" />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Selection summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-pitch-500" />
              Selected: {selectedIds.length}/11
            </h2>
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  'text-sm px-2 py-0.5 rounded',
                  overseasSelected > 4
                    ? 'bg-ball-500/20 text-ball-400'
                    : 'bg-blue-500/20 text-blue-400'
                )}
              >
                <Globe className="w-3 h-3 inline mr-1" />
                {overseasSelected}/4 Overseas
              </span>
            </div>
          </div>

          {/* Role breakdown */}
          {validation?.breakdown && (
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-purple-500/10 rounded px-2 py-1">
                <p className="text-purple-400 font-bold">
                  {validation.breakdown.wicket_keepers}
                </p>
                <p className="text-dark-400">WK</p>
              </div>
              <div className="bg-blue-500/10 rounded px-2 py-1">
                <p className="text-blue-400 font-bold">
                  {validation.breakdown.batsmen}
                </p>
                <p className="text-dark-400">BAT</p>
              </div>
              <div className="bg-emerald-500/10 rounded px-2 py-1">
                <p className="text-emerald-400 font-bold">
                  {validation.breakdown.all_rounders}
                </p>
                <p className="text-dark-400">AR</p>
              </div>
              <div className="bg-amber-500/10 rounded px-2 py-1">
                <p className="text-amber-400 font-bold">
                  {validation.breakdown.bowlers}
                </p>
                <p className="text-dark-400">BOWL</p>
              </div>
            </div>
          )}

          {/* Validation errors */}
          {validation && !validation.valid && validation.errors.length > 0 && (
            <div className="mt-3 p-3 bg-ball-500/10 border border-ball-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-ball-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {validation.errors.map((error, i) => (
                    <p key={i} className="text-sm text-ball-400">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Success state */}
          {isValid && (
            <div className="mt-3 p-3 bg-pitch-500/10 border border-pitch-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-pitch-400" />
                <p className="text-sm text-pitch-400">
                  Valid playing XI! Ready to confirm.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Player selection by role */}
        {ROLE_ORDER.map((role) => {
          const players = playersByRole[role] || [];
          if (players.length === 0) return null;

          return (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-dark-700/50 flex items-center justify-between">
                <h3 className="font-medium text-white">{ROLE_LABELS[role]}</h3>
                <span className="text-xs text-dark-400">
                  {players.filter((p) => selectedIds.includes(p.id)).length}/
                  {players.length} selected
                </span>
              </div>

              <div className="divide-y divide-dark-800/50">
                {players.map((player) => {
                  const isSelected = selectedIds.includes(player.id);
                  return (
                    <button
                      key={player.id}
                      onClick={() => togglePlayer(player.id)}
                      className={clsx(
                        'w-full px-4 py-3 flex items-center gap-3 transition-colors text-left',
                        isSelected
                          ? 'bg-pitch-500/10'
                          : 'hover:bg-dark-800/50'
                      )}
                    >
                      {/* Selection indicator */}
                      <div
                        className={clsx(
                          'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                          isSelected
                            ? 'bg-pitch-500 border-pitch-500'
                            : 'border-dark-500'
                        )}
                      >
                        {isSelected && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>

                      {/* Player info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={clsx(
                              'font-medium truncate',
                              isSelected ? 'text-pitch-400' : 'text-white'
                            )}
                          >
                            {player.name}
                          </span>
                          {player.is_overseas && (
                            <Globe className="w-3 h-3 text-blue-400 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-dark-400">
                          <span>{player.batting_style.replace('_', ' ')}</span>
                          {player.bowling_type !== 'none' && (
                            <>
                              <span>|</span>
                              <span>
                                {player.bowling_type.replace('_', ' ')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p
                            className={clsx(
                              'font-bold text-lg',
                              player.overall_rating >= 80
                                ? 'text-yellow-400'
                                : player.overall_rating >= 70
                                ? 'text-pitch-400'
                                : 'text-white'
                            )}
                          >
                            {player.overall_rating}
                          </p>
                          <p className="text-[10px] text-dark-500 uppercase">
                            OVR
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        {/* Confirm button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4"
        >
          <button
            onClick={() => setXIMutation.mutate()}
            disabled={!isValid || setXIMutation.isPending}
            className={clsx(
              'w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all',
              isValid
                ? 'btn-primary'
                : 'bg-dark-700 text-dark-400 cursor-not-allowed'
            )}
          >
            {setXIMutation.isPending ? (
              'Saving...'
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Confirm Playing XI
              </>
            )}
          </button>
        </motion.div>
      </div>
    </>
  );
}
