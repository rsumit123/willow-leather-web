import type { PlayerStateBrief } from '../../api/client';
import { Flame } from 'lucide-react';
import clsx from 'clsx';
import { TraitBadge } from '../common/TraitBadge';

interface BattingSectionProps {
  striker?: PlayerStateBrief;
  nonStriker?: PlayerStateBrief;
}

export function BattingSection({ striker, nonStriker }: BattingSectionProps) {
  if (!striker && !nonStriker) return null;

  const players = [
    striker && { player: striker, isStriker: true },
    nonStriker && { player: nonStriker, isStriker: false },
  ].filter(Boolean) as { player: PlayerStateBrief; isStriker: boolean }[];

  return (
    <div className="flex flex-col gap-2 px-4">
      <span className="text-[10px] uppercase font-bold tracking-widest text-dark-500">Batting</span>
      <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl border border-dark-700/50 overflow-hidden">
        {players.map(({ player, isStriker }, idx) => (
          <div
            key={player.name}
            className={clsx(
              "flex items-center justify-between px-4 py-3",
              idx < players.length - 1 && "border-b border-dark-700/30",
              isStriker && "bg-pitch-500/5"
            )}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
              <span
                className={clsx(
                  "font-medium truncate",
                  isStriker ? "text-white" : "text-dark-300"
                )}
              >
                {player.name}
                {isStriker && <span className="text-pitch-400">*</span>}
              </span>
              {player.is_settled && (
                <span className="badge badge-blue text-[9px] px-1.5 py-0.5">Set</span>
              )}
              {player.is_on_fire && (
                <Flame className="w-3.5 h-3.5 text-orange-400" />
              )}
              {player.traits && player.traits.map((trait) => (
                <TraitBadge key={trait} trait={trait} compact clickable />
              ))}
            </div>
            <div className="flex items-baseline gap-1 text-right">
              <span className="text-lg font-display font-bold text-white">
                {player.runs}
              </span>
              <span className="text-xs text-dark-400">
                ({player.balls})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
