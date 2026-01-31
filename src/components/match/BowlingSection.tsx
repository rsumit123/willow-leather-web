import type { BowlerStateBrief } from '../../api/client';
import { Zap, Battery } from 'lucide-react';
import { TraitBadge } from '../common/TraitBadge';

interface BowlingSectionProps {
  bowler?: BowlerStateBrief;
}

export function BowlingSection({ bowler }: BowlingSectionProps) {
  if (!bowler) return null;
  return (
    <div className="flex flex-col gap-2 px-4">
      <span className="text-[10px] uppercase font-bold tracking-widest text-dark-500">Bowling</span>
      <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl border border-dark-700/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
            <span className="font-medium text-white truncate">
              {bowler.name}
            </span>
            {bowler.has_confidence && (
              <Zap className="w-3.5 h-3.5 text-pitch-400" />
            )}
            {bowler.is_tired && (
              <Battery className="w-3.5 h-3.5 text-ball-400" />
            )}
            {bowler.traits && bowler.traits.map((trait) => (
              <TraitBadge key={trait} trait={trait} compact clickable />
            ))}
          </div>
          <div className="flex items-baseline gap-1 text-right">
            <span className="text-lg font-display font-bold text-white">
              {bowler.wickets}/{bowler.runs}
            </span>
            <span className="text-xs text-dark-400">
              ({bowler.overs}.{bowler.balls})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
