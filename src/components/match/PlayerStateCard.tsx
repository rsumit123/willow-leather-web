import type { PlayerStateBrief, BowlerStateBrief } from '../../api/client';
import { Zap, AlertCircle, Flame } from 'lucide-react';
import clsx from 'clsx';

interface PlayerStateCardProps {
  player?: PlayerStateBrief;
  bowler?: BowlerStateBrief;
  isStriker?: boolean;
}

export function PlayerStateCard({ player, bowler, isStriker }: PlayerStateCardProps) {
  if (player) {
    return (
      <div className={clsx(
        "glass-card p-4 flex-1 min-w-0 transition-all duration-300",
        isStriker && "border-pitch-500/50 ring-1 ring-pitch-500/20"
      )}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className={clsx(
              "font-bold truncate",
              isStriker ? "text-white" : "text-dark-300 text-sm"
            )}>
              {player.name}{isStriker && '*'}
            </h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {player.is_settled && <span className="badge badge-blue text-[10px]">Settled</span>}
              {player.is_nervous && <span className="badge badge-yellow text-[10px] flex items-center gap-0.5"><AlertCircle size={10} /> Nervous</span>}
              {player.is_on_fire && <span className="badge bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] flex items-center gap-0.5"><Flame size={10} /> On Fire</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-display font-bold text-white leading-none">
              {player.runs}
            </div>
            <div className="text-xs text-dark-400 mt-1">
              ({player.balls})
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (bowler) {
    return (
      <div className="glass-card p-4 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white truncate">
              {bowler.name}
            </h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {bowler.is_tired && <span className="badge badge-red text-[10px]">Tired</span>}
              {bowler.has_confidence && <span className="badge badge-green text-[10px] flex items-center gap-0.5"><Zap size={10} /> Confident</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-display font-bold text-white leading-none">
              {bowler.wickets}/{bowler.runs}
            </div>
            <div className="text-xs text-dark-400 mt-1">
              ({bowler.overs}.{bowler.balls})
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
