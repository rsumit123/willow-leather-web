import { motion } from 'framer-motion';
import type { MatchState } from '../../api/client';
import clsx from 'clsx';

interface ScoreHeaderProps {
  state: MatchState;
  team1Name: string;
  team2Name: string;
}

export function ScoreHeader({ state, team1Name, team2Name }: ScoreHeaderProps) {
  // Use batting_team_name from state if available, otherwise fallback to old logic
  const battingTeam = state.batting_team_name || (state.innings === 1 ? team1Name : team2Name);
  const bowlingTeam = state.bowling_team_name || (state.innings === 1 ? team2Name : team1Name);

  return (
    <div className="sticky top-0 z-40 w-full bg-dark-950/80 backdrop-blur-md border-b border-dark-800 px-4 py-3 safe-top">
      <div className="flex flex-col gap-1">
        {/* Team indicator badge */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className={clsx(
              'px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider',
              state.is_user_batting
                ? 'bg-pitch-500/20 text-pitch-400'
                : 'bg-dark-700 text-dark-400'
            )}
          >
            {state.is_user_batting ? 'YOUR TEAM BATTING' : 'OPPONENT BATTING'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-sm font-medium text-dark-400 uppercase tracking-wider">
              <span className={state.is_user_batting ? 'text-pitch-400' : ''}>{battingTeam}</span>
              {' vs '}
              <span className={!state.is_user_batting ? 'text-pitch-400' : ''}>{bowlingTeam}</span>
            </h2>
            <div className="flex items-baseline gap-2">
              <motion.span
                key={state.runs + state.wickets}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-display font-bold text-white"
              >
                {state.runs}/{state.wickets}
              </motion.span>
              <span className="text-lg text-dark-400 font-medium">
                ({state.overs})
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-dark-400 font-medium uppercase tracking-wider">
              CRR: {state.run_rate?.toFixed(2) || '0.00'}
            </div>
            {state.required_rate != null && (
              <div className="text-sm font-bold text-pitch-400">
                RRR: {state.required_rate.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {state.target && (
          <div className="text-xs font-medium text-dark-300">
            Target: <span className="text-white">{state.target}</span> • 
            Need <span className="text-pitch-400">{state.target - state.runs}</span> runs from 
            <span className="text-white"> {state.balls_remaining}</span> balls
          </div>
        )}
      </div>
    </div>
  );
}
