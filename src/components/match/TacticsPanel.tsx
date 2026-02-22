import { useState, useRef } from 'react';
import { Shield, Target, Zap, Play, SkipForward, FastForward, Star, Info, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import type { DeliveryOption } from '../../api/client';

interface TacticsPanelProps {
  aggression: string;
  setAggression: (val: string) => void;
  onPlayBall: () => void;
  onSimulateOver: () => void;
  onSimulateInnings: () => void;
  isLoading: boolean;
  disabled?: boolean;
  isUserBatting: boolean;
  availableDeliveries?: DeliveryOption[];
  selectedDelivery?: string | null;
  onSelectDelivery?: (name: string | null) => void;
}

function getDifficultyColor(difficulty: number) {
  if (difficulty < 35) return 'text-pitch-400 border-pitch-500/30';
  if (difficulty <= 50) return 'text-amber-400 border-amber-500/30';
  return 'text-ball-400 border-ball-500/30';
}

function getDifficultyBg(difficulty: number, selected: boolean) {
  if (!selected) return 'bg-dark-800/80';
  if (difficulty < 35) return 'bg-pitch-500/15';
  if (difficulty <= 50) return 'bg-amber-500/15';
  return 'bg-ball-500/15';
}

const weaknessLabels: Record<string, string> = {
  vs_pace: 'Pace',
  vs_bounce: 'Bounce',
  vs_spin: 'Spin',
  vs_deception: 'Deception',
  off_side: 'Off Side',
  leg_side: 'Leg Side',
  power: 'Power',
};

function UsageDots({ used, max }: { used: number; max: number }) {
  return (
    <div className="flex gap-0.5 mt-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            'w-1 h-1 rounded-full',
            i < used ? 'bg-amber-400' : 'bg-dark-600'
          )}
        />
      ))}
    </div>
  );
}

export function TacticsPanel({
  aggression,
  setAggression,
  onPlayBall,
  onSimulateOver,
  onSimulateInnings,
  isLoading,
  disabled = false,
  isUserBatting,
  availableDeliveries,
  selectedDelivery,
  onSelectDelivery,
}: TacticsPanelProps) {
  const isDisabled = isLoading || disabled;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [infoDelivery, setInfoDelivery] = useState<DeliveryOption | null>(null);

  const aggressionOptions = [
    { id: 'defend', icon: Shield, color: 'text-blue-400', activeColor: 'bg-blue-500/20' },
    { id: 'balanced', label: 'Balanced', icon: Target, color: 'text-pitch-400', activeColor: 'bg-pitch-500/20' },
    { id: 'attack', icon: Zap, color: 'text-orange-400', activeColor: 'bg-orange-500/20' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-xl border-t border-dark-800 p-3 pb-6 safe-bottom rounded-t-[2rem] shadow-[0_-10px_30px_rgba(0,0,0,0.4)]">
      <div className="max-w-md mx-auto flex flex-col gap-3">
        {isUserBatting ? (
          /* ========== BATTING MODE ========== */
          <div className="flex items-center bg-dark-800/80 rounded-xl p-1 border border-dark-700/50">
            {aggressionOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setAggression(opt.id)}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg transition-all duration-200",
                  aggression === opt.id
                    ? `${opt.activeColor} shadow-sm`
                    : "hover:bg-dark-700/50"
                )}
              >
                <opt.icon className={clsx(
                  "w-5 h-5 transition-colors",
                  aggression === opt.id ? opt.color : "text-dark-400"
                )} />
                {opt.label && (
                  <span className={clsx(
                    "text-xs font-semibold uppercase tracking-wide transition-colors",
                    aggression === opt.id ? "text-white" : "text-dark-400"
                  )}>
                    {opt.label}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          /* ========== BOWLING MODE — Delivery Picker ========== */
          <>
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-dark-500">
                Delivery
              </span>
              {selectedDelivery && onSelectDelivery && (
                <button
                  onClick={() => onSelectDelivery(null)}
                  className="text-[10px] text-dark-400 hover:text-white transition-colors"
                >
                  Auto
                </button>
              )}
            </div>
            {availableDeliveries && availableDeliveries.length > 0 ? (
              <div
                ref={scrollRef}
                className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1"
                style={{ scrollSnapType: 'x mandatory' }}
              >
                {availableDeliveries.map((d) => {
                  const isSelected = selectedDelivery === d.name;
                  const isRestricted = d.is_restricted;
                  const isAtPenalty = !isRestricted && d.max_per_over != null &&
                    (d.times_used_this_over ?? 0) >= d.max_per_over;
                  const diffColor = getDifficultyColor(d.exec_difficulty);
                  const diffBg = isRestricted
                    ? 'bg-red-500/10'
                    : getDifficultyBg(d.exec_difficulty, isSelected);

                  return (
                    <button
                      key={d.name}
                      onClick={() => {
                        if (isRestricted) return;
                        onSelectDelivery?.(isSelected ? null : d.name);
                      }}
                      disabled={isRestricted}
                      className={clsx(
                        'flex flex-col items-center gap-0.5 px-3 pt-4 pb-2 rounded-xl border transition-all duration-150 min-w-[76px] flex-shrink-0 relative',
                        diffBg,
                        isRestricted
                          ? 'border-red-500/40 opacity-50 cursor-not-allowed'
                          : isAtPenalty
                            ? isSelected
                              ? 'border-amber-500/50 ring-1 ring-amber-500/30'
                              : 'border-amber-500/30'
                            : isSelected
                              ? 'border-pitch-500/50 ring-1 ring-pitch-500/30'
                              : 'border-dark-700/50 hover:border-dark-600/50',
                      )}
                      style={{ scrollSnapAlign: 'start' }}
                    >
                      {/* Info button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInfoDelivery(d);
                        }}
                        className="absolute top-1 right-1 p-0.5 rounded-full text-dark-500 hover:text-dark-300 transition-colors"
                      >
                        <Info className="w-2.5 h-2.5" />
                      </button>

                      <span className={clsx(
                        'text-[11px] font-semibold leading-tight text-center',
                        isRestricted ? 'text-dark-500 line-through' : isSelected ? 'text-white' : 'text-dark-200'
                      )}>
                        {d.display_name}
                      </span>

                      <div className="flex items-center gap-1">
                        <span className={clsx('text-[10px] font-mono font-bold', isRestricted ? 'text-red-400' : diffColor)}>
                          {isRestricted ? 'N/B' : d.exec_difficulty}
                        </span>
                        {d.targets_weakness && !isRestricted && (
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        )}
                      </div>

                      {/* Usage dots */}
                      {d.max_per_over != null && (
                        <UsageDots used={d.times_used_this_over ?? 0} max={d.max_per_over} />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-xs text-dark-500 py-2">
                Auto-selecting delivery
              </div>
            )}

            {/* Delivery Info Tooltip */}
            <AnimatePresence>
              {infoDelivery && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="bg-dark-800 border border-dark-700/50 rounded-xl p-3 -mt-1"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <span className="text-xs font-semibold text-white">{infoDelivery.display_name}</span>
                    <button
                      onClick={() => setInfoDelivery(null)}
                      className="p-0.5 rounded text-dark-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-dark-300 leading-relaxed mb-2">{infoDelivery.description}</p>
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <span className={clsx('px-1.5 py-0.5 rounded border', getDifficultyColor(infoDelivery.exec_difficulty))}>
                      Difficulty: {infoDelivery.exec_difficulty}
                    </span>
                    {infoDelivery.targets_weakness && (
                      <span className="px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-400 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        Exploits {weaknessLabels[infoDelivery.targets_weakness] || infoDelivery.targets_weakness}
                      </span>
                    )}
                    {infoDelivery.max_per_over != null && (
                      <span className="px-1.5 py-0.5 rounded border border-dark-600 text-dark-300 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Max {infoDelivery.max_per_over}/over
                      </span>
                    )}
                    {infoDelivery.is_restricted && (
                      <span className="px-1.5 py-0.5 rounded border border-red-500/30 text-red-400">
                        Restricted — No Ball if bowled
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Play Ball / Bowl Button */}
        <button
          onClick={onPlayBall}
          disabled={isDisabled}
          className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 rounded-xl text-base font-semibold group"
        >
          {isDisabled ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
              <span>{isUserBatting ? 'Play Next Ball' : 'Bowl'}</span>
            </>
          )}
        </button>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onSimulateOver}
            disabled={isDisabled}
            className="btn-secondary py-2.5 flex items-center justify-center gap-1.5 rounded-lg text-xs"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Sim Over</span>
          </button>
          <button
            onClick={onSimulateInnings}
            disabled={isDisabled}
            className="btn-secondary py-2.5 flex items-center justify-center gap-1.5 rounded-lg text-xs"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Skip Innings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
