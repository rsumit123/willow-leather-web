import { motion } from 'framer-motion';
import { Trophy, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import type { PlayoffBracket } from '../../api/client';

interface PlayoffBracketProps {
  bracket: PlayoffBracket;
  userTeamShortName?: string;
  onPlayMatch?: (fixtureId: number) => void;
}

interface MatchCardProps {
  title: string;
  matchNumber?: number;
  team1?: string | null;
  team2?: string | null;
  winner?: string | null;
  status: string;
  result?: string | null;
  userTeamShortName?: string;
  isFinal?: boolean;
  fixtureId?: number;
  onPlay?: () => void;
}

function MatchCard({
  title,
  matchNumber,
  team1,
  team2,
  winner,
  status,
  result,
  userTeamShortName,
  isFinal,
  onPlay,
}: MatchCardProps) {
  const isCompleted = status === 'completed';
  const isPending = !team1 || !team2;
  const isUserMatch = team1 === userTeamShortName || team2 === userTeamShortName;
  const userWon = winner === userTeamShortName;
  const userLost = isCompleted && isUserMatch && !userWon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={clsx(
        'rounded-xl border p-4',
        isFinal ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-dark-800/50 border-dark-700',
        isUserMatch && !isCompleted && 'border-pitch-500/50',
        userWon && 'border-pitch-500 bg-pitch-500/10',
        userLost && 'border-ball-500/50 bg-ball-500/5'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isFinal && <Trophy className="w-4 h-4 text-yellow-500" />}
          <span className={clsx(
            'text-xs font-bold uppercase tracking-wider',
            isFinal ? 'text-yellow-500' : 'text-dark-400'
          )}>
            {title}
          </span>
        </div>
        {matchNumber && (
          <span className="text-xs text-dark-500">#{matchNumber}</span>
        )}
      </div>

      {isPending ? (
        <div className="text-center py-4 text-dark-500 text-sm">
          Waiting for previous matches...
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div className={clsx(
              'flex items-center justify-between p-2 rounded-lg',
              winner === team1 ? 'bg-pitch-500/20' : 'bg-dark-700/50',
              team1 === userTeamShortName && 'ring-1 ring-pitch-500/50'
            )}>
              <span className={clsx(
                'font-medium',
                winner === team1 ? 'text-pitch-400' : 'text-white',
                team1 === userTeamShortName && 'text-pitch-400'
              )}>
                {team1}
              </span>
              {winner === team1 && (
                <span className="text-xs bg-pitch-500/30 text-pitch-400 px-2 py-0.5 rounded">
                  Winner
                </span>
              )}
            </div>

            <div className={clsx(
              'flex items-center justify-between p-2 rounded-lg',
              winner === team2 ? 'bg-pitch-500/20' : 'bg-dark-700/50',
              team2 === userTeamShortName && 'ring-1 ring-pitch-500/50'
            )}>
              <span className={clsx(
                'font-medium',
                winner === team2 ? 'text-pitch-400' : 'text-white',
                team2 === userTeamShortName && 'text-pitch-400'
              )}>
                {team2}
              </span>
              {winner === team2 && (
                <span className="text-xs bg-pitch-500/30 text-pitch-400 px-2 py-0.5 rounded">
                  Winner
                </span>
              )}
            </div>
          </div>

          {result && (
            <p className="text-xs text-dark-400 mt-2 text-center">{result}</p>
          )}

          {!isCompleted && isUserMatch && onPlay && (
            <button
              onClick={onPlay}
              className="btn-primary w-full mt-3 text-sm py-2 flex items-center justify-center gap-1"
            >
              Play Match <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </motion.div>
  );
}

export function PlayoffBracket({ bracket, userTeamShortName, onPlayMatch }: PlayoffBracketProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Qualifier 1 */}
        <MatchCard
          title="Qualifier 1"
          matchNumber={bracket.qualifier_1?.match_number}
          team1={bracket.qualifier_1?.team1}
          team2={bracket.qualifier_1?.team2}
          winner={bracket.qualifier_1?.winner}
          status={bracket.qualifier_1?.status || 'pending'}
          result={bracket.qualifier_1?.result}
          userTeamShortName={userTeamShortName}
          fixtureId={bracket.qualifier_1?.fixture_id}
          onPlay={onPlayMatch && bracket.qualifier_1?.fixture_id ? () => onPlayMatch(bracket.qualifier_1!.fixture_id) : undefined}
        />

        {/* Eliminator */}
        <MatchCard
          title="Eliminator"
          matchNumber={bracket.eliminator?.match_number}
          team1={bracket.eliminator?.team1}
          team2={bracket.eliminator?.team2}
          winner={bracket.eliminator?.winner}
          status={bracket.eliminator?.status || 'pending'}
          result={bracket.eliminator?.result}
          userTeamShortName={userTeamShortName}
          fixtureId={bracket.eliminator?.fixture_id}
          onPlay={onPlayMatch && bracket.eliminator?.fixture_id ? () => onPlayMatch(bracket.eliminator!.fixture_id) : undefined}
        />
      </div>

      {/* Qualifier 2 */}
      <MatchCard
        title="Qualifier 2"
        matchNumber={bracket.qualifier_2?.match_number}
        team1={bracket.qualifier_2?.team1}
        team2={bracket.qualifier_2?.team2}
        winner={bracket.qualifier_2?.winner}
        status={bracket.qualifier_2?.status || 'pending'}
        result={bracket.qualifier_2?.result}
        userTeamShortName={userTeamShortName}
        fixtureId={bracket.qualifier_2?.fixture_id}
        onPlay={onPlayMatch && bracket.qualifier_2?.fixture_id ? () => onPlayMatch(bracket.qualifier_2!.fixture_id) : undefined}
      />

      {/* Final */}
      <MatchCard
        title="Final"
        matchNumber={bracket.final?.match_number}
        team1={bracket.final?.team1}
        team2={bracket.final?.team2}
        winner={bracket.final?.winner}
        status={bracket.final?.status || 'pending'}
        result={bracket.final?.result}
        userTeamShortName={userTeamShortName}
        isFinal
        fixtureId={bracket.final?.fixture_id}
        onPlay={onPlayMatch && bracket.final?.fixture_id ? () => onPlayMatch(bracket.final!.fixture_id) : undefined}
      />
    </div>
  );
}
