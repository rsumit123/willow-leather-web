import type { PlayerStateBrief, BowlerStateBrief, BatterDNA, BowlerDNA } from '../../api/client';
import { Flame, Users, Zap, Battery, Swords, AlertTriangle, Eye } from 'lucide-react';
import clsx from 'clsx';
import { TraitBadge } from '../common/TraitBadge';

interface MatchupPanelProps {
  striker?: PlayerStateBrief;
  nonStriker?: PlayerStateBrief;
  bowler?: BowlerStateBrief;
  partnershipRuns?: number;
  isUserBatting: boolean;
  onScoutBatter?: (playerId: number) => void;
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

function getMatchupTip(batterDna?: BatterDNA, bowlerDna?: BowlerDNA): string | null {
  if (!batterDna || !bowlerDna) return null;
  const weaknesses = batterDna.weaknesses || [];
  if (weaknesses.length === 0) return null;

  if (bowlerDna.type === 'spinner') {
    if (weaknesses.includes('vs_spin')) return 'Weak against spin — try flighted or arm ball.';
    if (weaknesses.includes('vs_deception')) return 'Struggles with deception — use variations.';
  } else {
    if (weaknesses.includes('vs_bounce')) return 'Vulnerable to bounce — target with bouncers.';
    if (weaknesses.includes('vs_pace')) return 'Struggles against pace — attack the stumps.';
    if (weaknesses.includes('vs_deception')) return 'Can be deceived — try slower balls.';
  }

  if (weaknesses.includes('off_side')) return 'Weak outside off — bowl wide of off stump.';
  if (weaknesses.includes('leg_side')) return 'Suspect against leg-side deliveries.';

  return null;
}

function getKeyBowlerStat(dna: BowlerDNA): { label: string; value: number } | null {
  const rawStats = dna.type === 'pacer'
    ? [
        { label: 'Speed', value: dna.speed },
        { label: 'Swing', value: dna.swing },
        { label: 'Bounce', value: dna.bounce },
      ]
    : [
        { label: 'Turn', value: dna.turn },
        { label: 'Flight', value: dna.flight },
        { label: 'Variation', value: dna.variation },
      ];
  const valid = rawStats
    .filter((s): s is { label: string; value: number } => s.value != null)
    .sort((a, b) => b.value - a.value);
  return valid[0] ?? null;
}

function BatterRow({
  player,
  isStriker,
  showScout,
  onScout,
}: {
  player: PlayerStateBrief;
  isStriker: boolean;
  showScout?: boolean;
  onScout?: () => void;
}) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between px-3 py-2.5',
        isStriker && 'bg-pitch-500/5'
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          {showScout && onScout && (
            <button
              onClick={onScout}
              className="p-0.5 rounded hover:bg-dark-700/50 text-dark-400 hover:text-pitch-400 transition-colors"
              title="Scout batter"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
          <span
            className={clsx(
              'font-medium text-sm truncate',
              isStriker ? 'text-white' : 'text-dark-300'
            )}
          >
            {player.name}
            {isStriker && <span className="text-pitch-400">*</span>}
          </span>
        </div>
        {player.is_settled && (
          <span className="badge badge-blue text-[9px] px-1.5 py-0.5">Set</span>
        )}
        {player.is_on_fire && <Flame className="w-3.5 h-3.5 text-orange-400" />}
        {player.traits &&
          player.traits.map((trait) => (
            <TraitBadge key={trait} trait={trait} compact clickable />
          ))}
      </div>
      <div className="flex items-baseline gap-1 text-right">
        <span className="text-lg font-display font-bold text-white">{player.runs}</span>
        <span className="text-xs text-dark-400">({player.balls})</span>
      </div>
    </div>
  );
}

export function MatchupPanel({
  striker,
  nonStriker,
  bowler,
  partnershipRuns,
  isUserBatting,
  onScoutBatter,
}: MatchupPanelProps) {
  if (!striker && !nonStriker && !bowler) return null;

  const tip = !isUserBatting
    ? getMatchupTip(striker?.batting_dna, bowler?.bowling_dna)
    : null;

  const keyStat = !isUserBatting && bowler?.bowling_dna
    ? getKeyBowlerStat(bowler.bowling_dna)
    : null;

  const bowlerType = bowler?.bowling_dna?.type === 'spinner' ? 'Spin' : 'Pace';

  // Find the most relevant weakness for the current matchup
  const relevantWeakness = !isUserBatting && striker?.batting_dna?.weaknesses?.[0]
    ? striker.batting_dna.weaknesses[0]
    : null;

  return (
    <div className="flex flex-col gap-2 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {!isUserBatting && <Swords className="w-3 h-3 text-pitch-400" />}
          <span className="text-[10px] uppercase font-bold tracking-widest text-dark-500">
            {isUserBatting ? 'Batting' : 'Matchup'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-dark-400">
          <Users className="w-3 h-3" />
          <span>
            Partnership: <span className="text-white font-medium">{partnershipRuns ?? 0}</span>
          </span>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl border border-dark-700/50 overflow-hidden">
        {/* Batters */}
        {striker && (
          <BatterRow
            player={striker}
            isStriker
            showScout={!isUserBatting}
            onScout={onScoutBatter ? () => onScoutBatter(striker.id) : undefined}
          />
        )}
        {nonStriker && (
          <>
            <div className="border-t border-dark-700/30" />
            <BatterRow player={nonStriker} isStriker={false} />
          </>
        )}

        {/* VS connector + Bowler */}
        {bowler && (
          <>
            <div className="border-t border-dark-700/30" />
            <div className="px-3 py-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                  <span className="text-[10px] text-dark-500 font-semibold">vs</span>
                  <span className="font-medium text-sm text-white truncate">{bowler.name}</span>
                  {bowler.has_confidence && <Zap className="w-3.5 h-3.5 text-pitch-400" />}
                  {bowler.is_tired && <Battery className="w-3.5 h-3.5 text-ball-400" />}
                  {bowler.traits &&
                    bowler.traits.map((trait) => (
                      <TraitBadge key={trait} trait={trait} compact clickable />
                    ))}
                  {!isUserBatting && keyStat && (
                    <span className="text-[10px] text-dark-400">
                      {bowlerType} · {keyStat.label}: {keyStat.value}
                    </span>
                  )}
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
          </>
        )}

        {/* Weakness indicator + Tip (only when bowling) */}
        {!isUserBatting && (relevantWeakness || tip) && (
          <>
            <div className="border-t border-dark-700/30" />
            <div className="px-3 py-2 flex items-start gap-2">
              {relevantWeakness && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-1.5 py-0.5 shrink-0">
                  <AlertTriangle className="w-3 h-3" />
                  {weaknessLabels[relevantWeakness] || relevantWeakness}
                </span>
              )}
              {tip && (
                <span className="text-[11px] text-dark-400 leading-tight">{tip}</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
