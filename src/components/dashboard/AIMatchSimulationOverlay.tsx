import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, ChevronRight, SkipForward } from 'lucide-react';
import type { Fixture, MatchResult } from '../../api/client';
import { seasonApi } from '../../api/client';
import { CricketBall } from '../common/CricketBall';

interface AIMatchSimulationOverlayProps {
  careerId: number;
  fixtures: Fixture[];
  onComplete: () => void;
  userTeamId: number;
}

interface SimulatedMatch {
  fixture: Fixture;
  result: MatchResult;
}

export function AIMatchSimulationOverlay({
  careerId,
  fixtures,
  onComplete,
  userTeamId,
}: AIMatchSimulationOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'simulating' | 'showing_result' | 'transitioning'>('simulating');
  const [simulatedMatches, setSimulatedMatches] = useState<SimulatedMatch[]>([]);
  const [currentResult, setCurrentResult] = useState<MatchResult | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [progress, setProgress] = useState(0); // Separate progress state to avoid flickering
  const skipRef = useRef(false);

  const currentFixture = fixtures[currentIndex];
  const totalMatches = fixtures.length;
  const isUserMatch = currentFixture &&
    (currentFixture.team1_id === userTeamId || currentFixture.team2_id === userTeamId);

  // Skip all remaining AI matches
  const handleSkipAll = async () => {
    if (isSkipping) return;
    setIsSkipping(true);
    skipRef.current = true;

    // Simulate all remaining AI matches quickly
    try {
      for (let i = currentIndex; i < fixtures.length; i++) {
        const fixture = fixtures[i];
        const isUser = fixture.team1_id === userTeamId || fixture.team2_id === userTeamId;
        if (isUser) break;

        const result = await seasonApi.simulateNextMatch(careerId);
        setSimulatedMatches(prev => [...prev, { fixture, result: result.data }]);
        // Update progress as we skip through (use Math.max to only go forward)
        const skipProgress = ((i + 1) / totalMatches) * 100;
        setProgress(prev => Math.max(prev, skipProgress));
      }
    } catch (error) {
      console.error('Failed to simulate matches:', error);
    }

    setProgress(100);
    setIsComplete(true);
  };

  // Simulate the current match
  useEffect(() => {
    if (!currentFixture || isUserMatch || skipRef.current) {
      // No more AI matches or reached user's match
      setProgress(100);
      setIsComplete(true);
      return;
    }

    const simulateMatch = async () => {
      setPhase('simulating');
      // Set progress to show we're working on this match
      // Use Math.max to ensure progress only ever increases (prevents flickering)
      const simulatingProgress = ((currentIndex + 0.3) / totalMatches) * 100;
      setProgress(prev => Math.max(prev, simulatingProgress));

      // Add a small delay for visual effect
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (skipRef.current) return; // Check if skipped during delay

      try {
        const result = await seasonApi.simulateNextMatch(careerId);
        if (skipRef.current) return; // Check if skipped during API call

        setCurrentResult(result.data);
        setSimulatedMatches(prev => [...prev, { fixture: currentFixture, result: result.data }]);
        setPhase('showing_result');
        // Update progress to show this match is complete
        // Use Math.max to ensure progress only ever increases
        const completedProgress = ((currentIndex + 1) / totalMatches) * 100;
        setProgress(prev => Math.max(prev, completedProgress));

        // Show result for 3.5 seconds (more time to read), then transition
        setTimeout(() => {
          if (skipRef.current) return;
          setPhase('transitioning');
          setTimeout(() => {
            if (skipRef.current) return;
            if (currentIndex < totalMatches - 1) {
              setCurrentIndex(prev => prev + 1);
            } else {
              setIsComplete(true);
            }
          }, 400);
        }, 3500);
      } catch (error) {
        console.error('Failed to simulate match:', error);
        setIsComplete(true);
      }
    };

    simulateMatch();
  }, [currentIndex, currentFixture, careerId, isUserMatch, totalMatches]);

  // When complete, call onComplete after a short delay
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onComplete]);

  if (isComplete && simulatedMatches.length === 0) {
    return null; // No AI matches to show
  }

  // Count remaining AI matches for skip button
  const remainingAIMatches = fixtures.slice(currentIndex).filter(
    f => f.team1_id !== userTeamId && f.team2_id !== userTeamId
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-dark-950/95 z-50 flex flex-col items-center justify-center px-4 py-6 safe-top safe-bottom overflow-hidden"
    >
      {/* Skip button - top right */}
      {!isComplete && remainingAIMatches > 1 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={handleSkipAll}
          disabled={isSkipping}
          className="absolute top-4 right-4 safe-top flex items-center gap-1.5 px-3 py-1.5 text-xs text-dark-400 hover:text-white bg-dark-800/50 hover:bg-dark-700/50 rounded-full transition-colors"
        >
          <SkipForward className="w-3.5 h-3.5" />
          {isSkipping ? 'Skipping...' : 'Skip All'}
        </motion.button>
      )}

      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-6"
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">
            League Matches
          </span>
        </div>
        <p className="text-dark-400 text-xs">
          Match {currentIndex + 1} of {totalMatches}
        </p>
      </motion.div>

      {/* Progress bar */}
      <div className="w-full max-w-xs mb-6">
        <div className="h-1 bg-dark-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-pitch-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Match card */}
      <AnimatePresence mode="wait">
        {!isComplete && currentFixture && (
          <motion.div
            key={currentFixture.id}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="glass-card p-5 w-full max-w-sm mx-4"
          >
            {/* Match number */}
            <div className="flex justify-center mb-3">
              <span className="badge badge-yellow text-xs">Match #{currentFixture.match_number}</span>
            </div>

            {/* Teams - stacked on very narrow screens */}
            <div className="flex items-center justify-between gap-2 mb-5">
              <div className="text-center flex-1 min-w-0">
                <p className="font-display font-bold text-lg text-white truncate">
                  {currentFixture.team1_name}
                </p>
              </div>
              <div className="px-2 flex-shrink-0">
                <span className="text-dark-500 text-xs font-medium">VS</span>
              </div>
              <div className="text-center flex-1 min-w-0">
                <p className="font-display font-bold text-lg text-white truncate">
                  {currentFixture.team2_name}
                </p>
              </div>
            </div>

            {/* Simulating state */}
            <AnimatePresence mode="wait">
              {phase === 'simulating' && (
                <motion.div
                  key="simulating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3"
                >
                  <CricketBall size="sm" animate />
                  <p className="text-dark-400 text-sm">Simulating match...</p>
                </motion.div>
              )}

              {/* Result state */}
              {(phase === 'showing_result' || phase === 'transitioning') && currentResult && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="text-center"
                >
                  {/* Winner */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center justify-center gap-2 mb-2"
                  >
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="text-lg font-bold text-yellow-400">
                      {currentResult.winner_name || 'Match Tied'}
                    </span>
                  </motion.div>

                  {/* Margin */}
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-pitch-400 font-semibold mb-3"
                  >
                    {currentResult.margin ? `won by ${currentResult.margin}` : ''}
                  </motion.p>

                  {/* Scores */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-1 text-sm text-dark-400"
                  >
                    <p>{currentResult.innings1_score}</p>
                    <p>{currentResult.innings2_score}</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Previous results ticker */}
      {simulatedMatches.length > 0 && !isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 w-full max-w-sm px-4"
        >
          <p className="text-[10px] text-dark-500 uppercase tracking-wider mb-2 text-center">
            Completed
          </p>
          <div className="space-y-1.5 max-h-24 overflow-y-auto">
            {simulatedMatches.slice(-3).map((match, idx) => (
              <motion.div
                key={match.fixture.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between gap-2 px-3 py-1.5 bg-dark-800/50 rounded-lg text-xs"
              >
                <span className="text-dark-400 truncate flex-1 min-w-0">
                  {match.fixture.team1_name} vs {match.fixture.team2_name}
                </span>
                <span className="text-pitch-400 font-medium flex-shrink-0">
                  {match.result.winner_name}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Final summary before navigating to user's match */}
      {isComplete && simulatedMatches.length > 0 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center px-4"
        >
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-pitch-500/20 flex items-center justify-center">
            <ChevronRight className="w-7 h-7 text-pitch-500" />
          </div>
          <h2 className="text-lg font-display font-bold text-white mb-1">
            Your Turn!
          </h2>
          <p className="text-dark-400 text-xs">
            {simulatedMatches.length} match{simulatedMatches.length > 1 ? 'es' : ''} completed.
            Get ready to play!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
