import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins } from 'lucide-react';
import type { TossResult } from '../../api/client';

interface TossScreenProps {
  onToss: () => void;
  tossResult: TossResult | null;
  onElect: (choice: 'bat' | 'bowl') => void;
  isLoading?: boolean;
  team1Name: string;
  team2Name: string;
}

export function TossScreen({
  onToss,
  tossResult,
  onElect,
  isLoading,
  team1Name,
  team2Name,
}: TossScreenProps) {
  const [isFlipping, setIsFlipping] = useState(false);

  const handleToss = () => {
    setIsFlipping(true);
    setTimeout(() => {
      onToss();
      setIsFlipping(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 max-w-md w-full text-center"
      >
        <h1 className="text-2xl font-display font-bold text-white mb-2">
          {team1Name} vs {team2Name}
        </h1>
        <p className="text-dark-400 mb-8">The Toss</p>

        <AnimatePresence mode="wait">
          {!tossResult ? (
            <motion.div
              key="toss-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <motion.div
                animate={isFlipping ? { rotateY: [0, 1080] } : {}}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg"
              >
                <Coins className="w-12 h-12 text-yellow-900" />
              </motion.div>

              <button
                onClick={handleToss}
                disabled={isFlipping || isLoading}
                className="btn-primary px-8 py-3"
              >
                {isFlipping ? 'Flipping...' : 'Flip Coin'}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="toss-result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pitch-400 to-pitch-600 flex items-center justify-center shadow-lg">
                <Coins className="w-12 h-12 text-pitch-900" />
              </div>

              <div className="text-center">
                <p className="text-lg text-dark-300 mb-1">Toss won by</p>
                <p className="text-2xl font-display font-bold text-pitch-400">
                  {tossResult.toss_winner_name}
                </p>
              </div>

              {tossResult.user_won_toss ? (
                <div className="w-full space-y-3">
                  <p className="text-dark-300 mb-4">Choose to:</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => onElect('bat')}
                      disabled={isLoading}
                      className="flex-1 btn-primary py-3"
                    >
                      Bat First
                    </button>
                    <button
                      onClick={() => onElect('bowl')}
                      disabled={isLoading}
                      className="flex-1 btn-secondary py-3"
                    >
                      Bowl First
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-3">
                  <p className="text-dark-300">
                    {tossResult.toss_winner_name} will make their decision...
                  </p>
                  <button
                    onClick={() => onElect('bowl')}
                    disabled={isLoading}
                    className="w-full btn-primary py-3"
                  >
                    {isLoading ? 'Starting Match...' : 'Continue'}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
