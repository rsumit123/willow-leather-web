import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Dumbbell,
  Zap,
  Check,
  ArrowLeft,
  Target,
  Shield,
  Flame,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingApi, careerApi } from '../api/client';
import type { Drill } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { SubPageHeader } from '../components/common/SubPageHeader';
import clsx from 'clsx';

const DRILL_ICONS: Record<string, typeof Dumbbell> = {
  nets_batting: Target,
  bowling_practice: Flame,
  fielding_drills: Shield,
  fitness_camp: Dumbbell,
  spin_workshop: Zap,
  pace_handling: Zap,
  power_hitting: Zap,
  death_bowling: Zap,
};

const MAX_PLAYERS = 5;

export function TrainingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { careerId, career } = useGameStore();

  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [trainingComplete, setTrainingComplete] = useState(false);

  // Available drills
  const { data: drills, isLoading: drillsLoading, isError: drillsError, error: drillsErrorData } = useQuery({
    queryKey: ['available-drills', careerId],
    queryFn: () => trainingApi.getAvailableDrills(careerId!).then((r) => r.data),
    enabled: !!careerId,
    retry: false,
  });

  // Squad for player selection
  const { data: squad } = useQuery({
    queryKey: ['squad', careerId, career?.user_team_id],
    queryFn: () => careerApi.getSquad(careerId!, career!.user_team_id!).then((r) => r.data),
    enabled: !!careerId && !!career?.user_team_id && !!selectedDrill,
  });

  // Train mutation
  const [trainError, setTrainError] = useState<string | null>(null);
  const trainMutation = useMutation({
    mutationFn: () => trainingApi.train(careerId!, selectedDrill!.drill_type, selectedPlayerIds),
    onSuccess: () => {
      setTrainError(null);
      setTrainingComplete(true);
      queryClient.invalidateQueries({ queryKey: ['calendar-current'] });
      queryClient.invalidateQueries({ queryKey: ['active-boosts'] });
      queryClient.invalidateQueries({ queryKey: ['available-drills'] });
    },
    onError: () => setTrainError('Training failed. Please try again.'),
  });

  const togglePlayer = (id: number) => {
    setSelectedPlayerIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= MAX_PLAYERS) return prev;
      return [...prev, id];
    });
  };

  if (!careerId) return null;
  if (drillsLoading) return <Loading fullScreen text="Loading drills..." />;

  // Error guard — not training day or already trained
  if (drillsError) {
    const errorDetail = (drillsErrorData as any)?.response?.data?.detail || 'Training is not available right now.';
    const isAlreadyTrained = typeof errorDetail === 'string' && errorDetail.toLowerCase().includes('already trained');

    return (
      <>
        <SubPageHeader title="Training" showBack backTo="/dashboard" />
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center"
            style={{ backgroundColor: isAlreadyTrained ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)' }}
          >
            {isAlreadyTrained ? (
              <Check className="w-10 h-10 text-pitch-400" />
            ) : (
              <Dumbbell className="w-10 h-10 text-dark-500" />
            )}
          </div>
          <h2 className="text-xl font-display font-bold text-white mb-2">
            {isAlreadyTrained ? 'Training Complete' : 'Training Unavailable'}
          </h2>
          <p className="text-dark-400 text-sm mb-6">{errorDetail}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Back to Hub
          </button>
        </div>
      </>
    );
  }

  // Training complete screen
  if (trainingComplete) {
    return (
      <>
        <SubPageHeader title="Training" showBack backTo="/dashboard" />
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-pitch-500/20 flex items-center justify-center"
          >
            <Check className="w-10 h-10 text-pitch-400" />
          </motion.div>
          <h2 className="text-xl font-display font-bold text-white mb-2">Training Complete!</h2>
          <p className="text-dark-400 text-sm mb-2">
            {selectedDrill?.display_name} — {selectedPlayerIds.length} player(s) trained
          </p>
          <p className="text-sm text-pitch-400 mb-6">
            +{selectedDrill?.boost_amount} {selectedDrill?.boost_attribute} for {selectedDrill?.duration} matches
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Back to Hub
          </button>
        </div>
      </>
    );
  }

  // Player selection screen
  if (selectedDrill && squad) {
    return (
      <>
        <SubPageHeader title={selectedDrill.display_name} showBack backTo="/dashboard" />
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <div className="glass-card p-4">
            <p className="text-sm text-dark-300">{selectedDrill.description}</p>
            <p className="text-xs text-pitch-400 mt-1">
              +{selectedDrill.boost_amount} {selectedDrill.boost_attribute} for {selectedDrill.duration} matches
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => { setSelectedDrill(null); setSelectedPlayerIds([]); }}
              className="text-sm text-dark-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-sm text-dark-400">
              {selectedPlayerIds.length}/{MAX_PLAYERS} selected
            </span>
          </div>

          <div className="space-y-2">
            {squad.players.map((player) => {
              const isSelected = selectedPlayerIds.includes(player.id);
              return (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={clsx(
                    'glass-card p-3 w-full flex items-center gap-3 transition-all text-left',
                    isSelected && 'border-pitch-500/50 bg-pitch-500/5',
                  )}
                >
                  <div className={clsx(
                    'w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    isSelected ? 'bg-pitch-500 border-pitch-500' : 'border-dark-600',
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">{player.name}</p>
                    <p className="text-xs text-dark-400">
                      {player.role} • OVR {player.overall_rating}
                    </p>
                  </div>
                  <span className="text-xs text-dark-500 uppercase">{player.role}</span>
                </button>
              );
            })}
          </div>

          {/* Error banner */}
          {trainError && (
            <div className="bg-ball-500/10 border border-ball-500/20 rounded-lg p-3 text-sm text-ball-400">
              {trainError}
            </div>
          )}

          {/* Start Training */}
          <div className="fixed bottom-16 left-0 right-0 bg-dark-950/90 backdrop-blur-lg border-t border-dark-800 z-50">
            <div className="max-w-lg mx-auto px-4 py-4">
              <button
                onClick={() => trainMutation.mutate()}
                disabled={selectedPlayerIds.length === 0 || trainMutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {trainMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Training...
                  </>
                ) : (
                  <>
                    <Dumbbell className="w-4 h-4" />
                    Start Training ({selectedPlayerIds.length} player{selectedPlayerIds.length !== 1 ? 's' : ''})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Drill selection screen
  return (
    <>
      <SubPageHeader title="Training Center" showBack backTo="/dashboard" />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <p className="text-sm text-dark-400">
          Choose a drill for today. Training boosts last for the next 2 matches.
        </p>

        {(!drills || drills.length === 0) && (
          <div className="text-center py-12">
            <Dumbbell className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">No Drills Available</h2>
            <p className="text-dark-400 text-sm">
              Training is available on training days only.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {drills?.map((drill, i) => {
            const DrillIcon = DRILL_ICONS[drill.drill_type] || Dumbbell;
            return (
              <motion.button
                key={drill.drill_type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedDrill(drill)}
                className="glass-card p-4 w-full flex items-start gap-3 hover:border-pitch-500/30 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <DrillIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{drill.display_name}</p>
                  <p className="text-xs text-dark-400 mt-0.5">{drill.description}</p>
                  <p className="text-xs text-pitch-400 mt-1">
                    +{drill.boost_amount} {drill.boost_attribute} for {drill.duration} matches
                  </p>
                  <div className="flex gap-1 mt-1.5">
                    {drill.best_for.map((role) => (
                      <span key={role} className="text-[10px] bg-dark-700/50 text-dark-400 px-1.5 py-0.5 rounded">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </>
  );
}
