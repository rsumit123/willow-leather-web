import { Shield, Target, Zap, Play, SkipForward, FastForward } from 'lucide-react';
import clsx from 'clsx';

interface TacticsPanelProps {
  aggression: string;
  setAggression: (val: string) => void;
  onPlayBall: () => void;
  onSimulateOver: () => void;
  onSimulateInnings: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function TacticsPanel({
  aggression,
  setAggression,
  onPlayBall,
  onSimulateOver,
  onSimulateInnings,
  isLoading,
  disabled = false
}: TacticsPanelProps) {
  const isDisabled = isLoading || disabled;
  const options = [
    { id: 'defend', icon: Shield, color: 'text-blue-400', activeColor: 'bg-blue-500/20' },
    { id: 'balanced', label: 'Balanced', icon: Target, color: 'text-pitch-400', activeColor: 'bg-pitch-500/20' },
    { id: 'attack', icon: Zap, color: 'text-orange-400', activeColor: 'bg-orange-500/20' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-xl border-t border-dark-800 p-3 pb-6 safe-bottom rounded-t-[2rem] shadow-[0_-10px_30px_rgba(0,0,0,0.4)]">
      <div className="max-w-md mx-auto flex flex-col gap-4">
        {/* iOS-style Segmented Control */}
        <div className="flex items-center bg-dark-800/80 rounded-xl p-1 border border-dark-700/50">
          {options.map((opt) => (
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

        {/* Play Ball Button */}
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
              <span>Play Next Ball</span>
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
