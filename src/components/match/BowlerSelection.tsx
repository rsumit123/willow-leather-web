import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AvailableBowler } from '../../api/client';
import clsx from 'clsx';

interface BowlerSelectionProps {
  bowlers: AvailableBowler[];
  onSelect: (bowlerId: number) => void;
  onClose: () => void;
  isLoading: boolean;
}

export function BowlerSelection({ bowlers, onSelect, onClose, isLoading }: BowlerSelectionProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [autoSelectTimer, setAutoSelectTimer] = useState(5);

  // Auto-select first available bowler after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoSelectTimer((prev) => {
        if (prev <= 1) {
          // Auto-select best available bowler
          const availableBowler = bowlers.find(b => b.can_bowl);
          if (availableBowler) {
            onSelect(availableBowler.id);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [bowlers, onSelect]);

  const handleSelect = (bowler: AvailableBowler) => {
    if (!bowler.can_bowl) return;
    setSelectedId(bowler.id);
  };

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card p-6 max-w-md w-full"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-display font-bold text-white">
              Select Bowler
            </h2>
            <span className="text-sm text-dark-400">
              Auto-select in {autoSelectTimer}s
            </span>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {bowlers.map((bowler) => (
              <button
                key={bowler.id}
                onClick={() => handleSelect(bowler)}
                disabled={!bowler.can_bowl || isLoading}
                className={clsx(
                  "w-full p-3 rounded-xl text-left transition-all",
                  bowler.can_bowl
                    ? selectedId === bowler.id
                      ? "bg-pitch-500/30 border-2 border-pitch-500"
                      : "bg-dark-800/50 hover:bg-dark-700/50 border border-dark-700"
                    : "bg-dark-900/50 border border-dark-800 opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-white">{bowler.name}</div>
                    {!bowler.can_bowl && bowler.reason && (
                      <div className="text-xs text-red-400 mt-1">{bowler.reason}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white">
                      {bowler.wickets}/{bowler.runs_conceded}
                    </div>
                    <div className="text-xs text-dark-400">
                      {bowler.overs_bowled} ov | {bowler.economy} econ
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={isLoading}
            >
              Auto Select
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedId || isLoading}
              className={clsx(
                "flex-1 btn-primary",
                (!selectedId || isLoading) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isLoading ? 'Selecting...' : 'Confirm'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
