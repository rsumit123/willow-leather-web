import { Shield, Target, Zap, Play, SkipForward, FastForward } from 'lucide-react';
import clsx from 'clsx';

interface TacticsPanelProps {
  aggression: string;
  setAggression: (val: string) => void;
  onPlayBall: () => void;
  onSimulateOver: () => void;
  onSimulateInnings: () => void;
  isLoading: boolean;
}

export function TacticsPanel({
  aggression,
  setAggression,
  onPlayBall,
  onSimulateOver,
  onSimulateInnings,
  isLoading
}: TacticsPanelProps) {
  const options = [
    { id: 'defend', label: 'Defend', icon: Shield, color: 'text-blue-400', desc: 'Low risk, high defense' },
    { id: 'balanced', label: 'Balanced', icon: Target, color: 'text-pitch-400', desc: 'Standard play' },
    { id: 'attack', label: 'Attack', icon: Zap, color: 'text-orange-400', desc: 'High risk, high reward' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-xl border-t border-dark-800 p-4 pb-8 safe-bottom rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
      <div className="max-w-md mx-auto flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-3">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setAggression(opt.id)}
              className={clsx(
                "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200",
                aggression === opt.id 
                  ? "bg-dark-800 ring-2 ring-pitch-500 shadow-lg" 
                  : "bg-dark-800/50 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
              )}
            >
              <opt.icon className={clsx("w-6 h-6", opt.color)} />
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-white uppercase">{opt.label}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onPlayBall}
            disabled={isLoading}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2 rounded-2xl text-lg group"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Play className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" />
                <span>Play Next Ball</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-3 mt-1">
            <button
              onClick={onSimulateOver}
              disabled={isLoading}
              className="btn-secondary py-3 flex items-center justify-center gap-2 rounded-xl text-sm"
            >
              <SkipForward className="w-4 h-4" />
              <span>Simulate Over</span>
            </button>
            <button
              onClick={onSimulateInnings}
              disabled={isLoading}
              className="btn-secondary py-3 flex items-center justify-center gap-2 rounded-xl text-sm"
            >
              <FastForward className="w-4 h-4" />
              <span>Skip Innings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
