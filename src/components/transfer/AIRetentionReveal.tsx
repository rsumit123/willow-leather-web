import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronRight } from 'lucide-react';
import type { AIRetentionEntry } from '../../api/client';
import { formatPrice } from '../../utils/format';
import clsx from 'clsx';

interface AIRetentionRevealProps {
  retentions: AIRetentionEntry[];
  onComplete: () => void;
}

export function AIRetentionReveal({ retentions, onComplete }: AIRetentionRevealProps) {
  const [revealedIndex, setRevealedIndex] = useState(-1);
  const allRevealed = revealedIndex >= retentions.length - 1;

  // Auto-reveal with delay
  useEffect(() => {
    if (revealedIndex < retentions.length - 1) {
      const timer = setTimeout(() => {
        setRevealedIndex((i) => i + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [revealedIndex, retentions.length]);

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-white text-center">AI Team Retentions</h2>
      <p className="text-sm text-dark-400 text-center">
        See which players each team has decided to keep
      </p>

      <div className="space-y-3">
        {retentions.map((entry, index) => {
          const isRevealed = index <= revealedIndex;

          return (
            <motion.div
              key={entry.team_id}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: isRevealed ? 1 : 0.5 }}
              className={clsx(
                'rounded-xl border overflow-hidden transition-colors',
                isRevealed ? 'border-dark-600 bg-dark-850' : 'border-dark-800 bg-dark-900'
              )}
            >
              {/* Team header */}
              <div className="flex items-center gap-3 p-3 border-b border-dark-800">
                <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-dark-400" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-white">{entry.team_name}</span>
                </div>
                {isRevealed && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xs text-dark-400"
                  >
                    {entry.retained_players.length} retained
                  </motion.span>
                )}
              </div>

              {/* Retained players */}
              <AnimatePresence>
                {isRevealed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    {entry.retained_players.length > 0 ? (
                      <div className="p-2 space-y-1">
                        {entry.retained_players.map((player, pIdx) => (
                          <motion.div
                            key={player.player_id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: pIdx * 0.15 }}
                            className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-dark-800/50"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-dark-500 w-4">#{player.retention_slot}</span>
                              <span className="text-sm text-white">{player.player_name}</span>
                            </div>
                            <span className="text-xs text-pitch-400 font-semibold">
                              {formatPrice(player.retention_price)}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center">
                        <span className="text-xs text-dark-500">No players retained - full rebuild!</span>
                      </div>
                    )}
                    {entry.total_cost > 0 && (
                      <div className="px-3 pb-2 text-right">
                        <span className="text-[10px] text-dark-500 break-words">
                          Total: {formatPrice(entry.total_cost)} | Auction budget: {formatPrice(900_000_000 - entry.total_cost)}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {allRevealed && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onComplete}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          Continue <ChevronRight className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
}
