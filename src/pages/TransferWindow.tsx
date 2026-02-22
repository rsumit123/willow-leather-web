import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, RefreshCw, Trophy, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transferApi, type AIRetentionEntry } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { SubPageHeader } from '../components/common/SubPageHeader';
import { RetentionBoard } from '../components/transfer/RetentionBoard';
import { AIRetentionReveal } from '../components/transfer/AIRetentionReveal';
import clsx from 'clsx';

type Step = 'retention' | 'ai-reveal' | 'release' | 'ready';

export function TransferWindowPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { careerId } = useGameStore();
  const [step, setStep] = useState<Step>('retention');
  const [aiRetentions, setAiRetentions] = useState<AIRetentionEntry[]>([]);
  const [poolSize, setPoolSize] = useState(0);

  // Check transfer status
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['transfer-status', careerId],
    queryFn: () => transferApi.getStatus(careerId!).then((r) => r.data),
    enabled: !!careerId,
  });

  // Get retention candidates
  const { data: candidates, isLoading: candidatesLoading } = useQuery({
    queryKey: ['retention-candidates', careerId],
    queryFn: () => transferApi.getRetentionCandidates(careerId!).then((r) => r.data),
    enabled: !!careerId && step === 'retention',
  });

  // Skip to right step based on status
  if (status && step === 'retention') {
    if (status.mini_auction_started) {
      // Already started mini-auction, redirect
      navigate('/auction');
      return null;
    }
    if (status.players_released && status.ai_retentions_done) {
      // Ready for mini-auction
      setStep('ready');
    } else if (status.ai_retentions_done) {
      setStep('release');
    } else if (status.user_retentions_done) {
      setStep('ai-reveal');
    }
  }

  // Retain mutation
  const retainMutation = useMutation({
    mutationFn: (playerIds: number[]) => transferApi.retain(careerId!, playerIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-status'] });
      setStep('ai-reveal');
    },
  });

  // AI retention mutation
  const aiRetentionMutation = useMutation({
    mutationFn: () => transferApi.processAIRetentions(careerId!),
    onSuccess: (response) => {
      setAiRetentions(response.data.retentions);
    },
  });

  // Release mutation
  const releaseMutation = useMutation({
    mutationFn: () => transferApi.releaseAndPrepare(careerId!),
    onSuccess: (response) => {
      setPoolSize(response.data.players_in_pool);
      queryClient.invalidateQueries({ queryKey: ['transfer-status'] });
      setStep('ready');
    },
  });

  // Start mini-auction mutation
  const startAuctionMutation = useMutation({
    mutationFn: () => transferApi.startMiniAuction(careerId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career'] });
      navigate('/auction');
    },
  });

  // Trigger AI retentions when entering ai-reveal step
  const handleRetentionConfirm = (playerIds: number[]) => {
    retainMutation.mutate(playerIds);
  };

  const handleAIRevealComplete = () => {
    setStep('release');
  };

  // Start AI retentions if not already done
  if (step === 'ai-reveal' && aiRetentions.length === 0 && !aiRetentionMutation.isPending && !aiRetentionMutation.isSuccess) {
    aiRetentionMutation.mutate();
  }

  if (!careerId || statusLoading) {
    return <Loading fullScreen text="Loading..." />;
  }

  return (
    <>
      <SubPageHeader title="Transfer Window" showBack backTo="/dashboard" />
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {(['retention', 'ai-reveal', 'release', 'ready'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                step === s ? 'bg-pitch-500 text-white' :
                (['retention', 'ai-reveal', 'release', 'ready'].indexOf(step) > i)
                  ? 'bg-pitch-500/20 text-pitch-400'
                  : 'bg-dark-700 text-dark-500'
              )}>
                {i + 1}
              </div>
              {i < 3 && (
                <div className={clsx(
                  'w-6 h-0.5',
                  (['retention', 'ai-reveal', 'release', 'ready'].indexOf(step) > i)
                    ? 'bg-pitch-500/40'
                    : 'bg-dark-700'
                )} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Retention Selection */}
          {step === 'retention' && (
            <motion.div
              key="retention"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {candidatesLoading ? (
                <Loading text="Loading squad..." />
              ) : candidates ? (
                <RetentionBoard
                  candidates={candidates}
                  onConfirm={handleRetentionConfirm}
                  isSubmitting={retainMutation.isPending}
                />
              ) : (
                <p className="text-dark-400 text-center">No candidates found</p>
              )}
            </motion.div>
          )}

          {/* Step 2: AI Retention Reveal */}
          {step === 'ai-reveal' && (
            <motion.div
              key="ai-reveal"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {aiRetentionMutation.isPending ? (
                <Loading text="AI teams deciding retentions..." />
              ) : aiRetentions.length > 0 ? (
                <AIRetentionReveal
                  retentions={aiRetentions}
                  onComplete={handleAIRevealComplete}
                />
              ) : (
                <Loading text="Processing..." />
              )}
            </motion.div>
          )}

          {/* Step 3: Release & Prepare */}
          {step === 'release' && (
            <motion.div
              key="release"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 flex items-center justify-center">
                <RefreshCw className="w-10 h-10 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white mb-2">
                  Release & Rebuild
                </h2>
                <p className="text-dark-400 text-sm">
                  Non-retained players will be released to the auction pool.
                  New players will be added to refresh the talent pool.
                </p>
              </div>
              <button
                onClick={() => releaseMutation.mutate()}
                disabled={releaseMutation.isPending}
                className="btn-primary flex items-center justify-center gap-2 mx-auto"
              >
                {releaseMutation.isPending ? (
                  'Releasing players...'
                ) : (
                  <>
                    <Users className="w-5 h-5" />
                    Release & Generate Pool
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Step 4: Ready for Mini-Auction */}
          {step === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 mx-auto rounded-3xl bg-pitch-500/20 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-pitch-500" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white mb-2">
                  Ready for Mini-Auction
                </h2>
                <p className="text-dark-400 text-sm">
                  {poolSize > 0
                    ? `${poolSize} players available in the auction pool.`
                    : 'Players have been released and new talent added.'}
                  {' '}Time to rebuild your squad!
                </p>
              </div>
              <button
                onClick={() => startAuctionMutation.mutate()}
                disabled={startAuctionMutation.isPending}
                className="btn-primary flex items-center justify-center gap-2 mx-auto"
              >
                {startAuctionMutation.isPending ? (
                  'Setting up auction...'
                ) : (
                  <>
                    Start Mini-Auction
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
