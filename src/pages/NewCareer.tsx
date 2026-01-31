import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { careerApi } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { TeamCard } from '../components/common/TeamCard';

export function NewCareerPage() {
  const navigate = useNavigate();
  const { setCareer, clearGame } = useGameStore();

  // Clear any existing game state when component mounts
  useEffect(() => {
    clearGame();
  }, []);

  const [step, setStep] = useState(1);
  const [careerName, setCareerName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  const { data: teams, isLoading } = useQuery({
    queryKey: ['team-choices'],
    queryFn: () => careerApi.getTeamChoices().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => careerApi.create(careerName, selectedTeam!),
    onSuccess: (response) => {
      setCareer(response.data);
      navigate('/auction');
    },
  });

  if (isLoading) {
    return <Loading fullScreen text="Loading teams..." />;
  }

  return (
    <div className="min-h-screen bg-dark-950 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-radial from-pitch-500/5 to-transparent" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-dark-950/80 backdrop-blur-lg border-b border-dark-800">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <button
            onClick={() => (step === 1 ? navigate('/') : setStep(step - 1))}
            className="p-2 -ml-2 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="ml-2 font-semibold">New Career</h1>

          {/* Step indicator */}
          <div className="ml-auto flex items-center gap-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${
                  s === step ? 'bg-pitch-500' : 'bg-dark-600'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-display font-bold text-white">
                  Choose Your Franchise
                </h2>
                <p className="text-dark-400 mt-1">
                  Select the team you want to manage
                </p>
              </div>

              <div className="grid gap-3">
                {teams?.map((team, index) => (
                  <motion.div
                    key={team.index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TeamCard
                      team={team}
                      onClick={() => setSelectedTeam(team.index)}
                      selected={selectedTeam === team.index}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-display font-bold text-white">
                  Name Your Career
                </h2>
                <p className="text-dark-400 mt-1">
                  Give your save game a memorable name
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Career Name
                  </label>
                  <input
                    type="text"
                    value={careerName}
                    onChange={(e) => setCareerName(e.target.value)}
                    placeholder="My Championship Run"
                    className="input-field"
                    autoFocus
                  />
                </div>

                {/* Selected team preview */}
                {selectedTeam !== null && teams && (
                  <div className="glass-card p-4">
                    <p className="text-xs text-dark-400 mb-2">Selected Team</p>
                    <TeamCard team={teams[selectedTeam]} size="sm" />
                  </div>
                )}

                {/* What's next */}
                <div className="glass-card p-4 border-pitch-500/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pitch-500/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-pitch-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">What's Next?</h4>
                      <p className="text-sm text-dark-400 mt-0.5">
                        You'll participate in the mega auction to build your squad
                        from 150+ players. Budget: ₹90 Crore
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-dark-950/90 backdrop-blur-lg border-t border-dark-800 safe-bottom">
        <div className="max-w-lg mx-auto px-4 py-4">
          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={selectedTeam === null}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => createMutation.mutate()}
              disabled={!careerName.trim() || createMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Start Career
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
