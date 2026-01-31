import { motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import type { MatchState } from '../../api/client';
import clsx from 'clsx';

interface ScoreHeaderProps {
  state: MatchState;
  team1Name: string;
  team2Name: string;
  onScorecardClick?: () => void;
}

export function ScoreHeader({ state, team1Name, team2Name, onScorecardClick }: ScoreHeaderProps) {
  // Use batting_team_name from state if available, otherwise fallback to old logic
  const battingTeam = state.batting_team_name || (state.innings === 1 ? team1Name : team2Name);

  // Get short team code (first 2-3 chars)
  const teamCode = battingTeam.substring(0, 3).toUpperCase();

  return (
    <div className="mx-4 mt-4 safe-top">
      {/* Floating pill card */}
      <div className={clsx(
        "rounded-2xl border overflow-hidden",
        state.is_user_batting
          ? "bg-gradient-to-r from-pitch-500/10 to-dark-800/80 border-pitch-500/30"
          : "bg-dark-800/80 border-dark-700/50"
      )}>
        {/* Team indicator strip */}
        <div className={clsx(
          "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest",
          state.is_user_batting
            ? "bg-pitch-500/20 text-pitch-400"
            : "bg-dark-700/50 text-dark-400"
        )}>
          {state.is_user_batting ? 'Your Team Batting' : 'Opponent Batting'}
        </div>

        {/* Main score area */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-white uppercase tracking-wide">
                {teamCode}
              </span>
              <motion.span
                key={state.runs + state.wickets}
                initial={{ y: -5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-xl font-display font-bold text-white"
              >
                {state.runs}/{state.wickets}
              </motion.span>
              <span className="text-sm text-dark-400">
                ({state.overs})
              </span>
            </div>

            <div className="flex items-center gap-3 text-right">
              <div className="text-xs text-dark-400">
                <span className="text-dark-500">CRR </span>
                <span className="font-semibold text-white">{state.run_rate?.toFixed(2) || '0.00'}</span>
              </div>
              {state.required_rate != null && (
                <div className="text-xs">
                  <span className="text-dark-500">RRR </span>
                  <span className="font-semibold text-pitch-400">{state.required_rate.toFixed(2)}</span>
                </div>
              )}
              {onScorecardClick && (
                <button
                  onClick={onScorecardClick}
                  className="p-1.5 rounded-lg bg-dark-700/60 hover:bg-dark-600 transition-colors border border-dark-600/50"
                  title="View Scorecard"
                >
                  <ClipboardList className="w-4 h-4 text-pitch-400" />
                </button>
              )}
            </div>
          </div>

          {state.target && (
            <div className="text-[11px] text-dark-400 mt-2 pt-2 border-t border-dark-700/50">
              Need <span className="text-pitch-400 font-semibold">{state.target - state.runs}</span> from
              <span className="text-white font-medium"> {state.balls_remaining}</span> balls
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
