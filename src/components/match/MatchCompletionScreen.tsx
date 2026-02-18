import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Home, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import type { MatchCompletionResponse, InningsScorecard } from '../../api/client';
import { ManOfTheMatchReveal } from './ManOfTheMatchReveal';
import { MatchAnalysis } from './MatchAnalysis';

interface MatchCompletionScreenProps {
  result: MatchCompletionResponse;
  careerId: number;
  fixtureId: number;
  onBackToDashboard: () => void;
}

type TabType = 'summary' | 'team1' | 'team2' | 'analysis';

function ScorecardTab({ innings }: { innings: InningsScorecard }) {
  const [showBowling, setShowBowling] = useState(false);

  return (
    <div className="space-y-4">
      {/* Batting Section */}
      <div>
        <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
          Batting
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-dark-400 text-xs">
                <th className="text-left py-2 pr-2">Batter</th>
                <th className="text-right px-1">R</th>
                <th className="text-right px-1">B</th>
                <th className="text-right px-1">4s</th>
                <th className="text-right px-1">6s</th>
                <th className="text-right pl-1">SR</th>
              </tr>
            </thead>
            <tbody>
              {innings.batters.map((batter) => (
                <tr key={batter.player_id} className="border-t border-dark-800">
                  <td className="py-2 pr-2">
                    <div className="font-medium text-white">
                      {batter.player_name}
                      {!batter.is_out && <span className="text-pitch-400">*</span>}
                    </div>
                    <div className="text-xs text-dark-500">{batter.dismissal}</div>
                  </td>
                  <td className="text-right px-1 text-white font-medium">{batter.runs}</td>
                  <td className="text-right px-1 text-dark-400">{batter.balls}</td>
                  <td className="text-right px-1 text-dark-400">{batter.fours}</td>
                  <td className="text-right px-1 text-dark-400">{batter.sixes}</td>
                  <td className="text-right pl-1 text-dark-400">{batter.strike_rate.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Extras and Total */}
        <div className="mt-3 pt-3 border-t border-dark-800 space-y-1 text-sm">
          <div className="flex justify-between text-dark-400">
            <span>Extras</span>
            <span>
              {innings.extras.total} (w {innings.extras.wides}, nb {innings.extras.no_balls})
            </span>
          </div>
          <div className="flex justify-between text-white font-bold">
            <span>Total</span>
            <span>
              {innings.total_runs}/{innings.wickets} ({innings.overs} ov, RR: {innings.run_rate})
            </span>
          </div>
        </div>

        {/* Did Not Bat */}
        {innings.did_not_bat.length > 0 && (
          <div className="mt-2 text-xs text-dark-500">
            <span className="text-dark-400">DNB: </span>
            {innings.did_not_bat.join(', ')}
          </div>
        )}
      </div>

      {/* Bowling Section (Collapsible) */}
      <div>
        <button
          onClick={() => setShowBowling(!showBowling)}
          className="w-full flex items-center justify-between py-2 text-dark-400 hover:text-white transition-colors"
        >
          <span className="text-xs font-semibold uppercase tracking-wider">
            Bowling
          </span>
          {showBowling ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <AnimatePresence>
          {showBowling && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-dark-400 text-xs">
                    <th className="text-left py-2 pr-2">Bowler</th>
                    <th className="text-right px-1">O</th>
                    <th className="text-right px-1">R</th>
                    <th className="text-right px-1">W</th>
                    <th className="text-right pl-1">Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {innings.bowlers.map((bowler) => (
                    <tr key={bowler.player_id} className="border-t border-dark-800">
                      <td className="py-2 pr-2 font-medium text-white">{bowler.player_name}</td>
                      <td className="text-right px-1 text-dark-400">{bowler.overs}</td>
                      <td className="text-right px-1 text-dark-400">{bowler.runs}</td>
                      <td className="text-right px-1 text-white font-medium">{bowler.wickets}</td>
                      <td className="text-right pl-1 text-dark-400">{bowler.economy.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function MatchCompletionScreen({ result, careerId, fixtureId, onBackToDashboard }: MatchCompletionScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('summary');

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-8 pb-4 px-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-yellow-500/20 flex items-center justify-center"
        >
          <Trophy className="w-10 h-10 text-yellow-500" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-display font-bold text-white mb-1"
        >
          {result.winner_name} Win!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-pitch-400 font-medium"
        >
          by {result.margin}
        </motion.p>
      </motion.div>

      {/* Tabs */}
      <div className="flex border-b border-dark-800 px-4">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'summary'
              ? 'text-pitch-400 border-b-2 border-pitch-400'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveTab('team1')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'team1'
              ? 'text-pitch-400 border-b-2 border-pitch-400'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          {result.innings1.batting_team_name}
        </button>
        <button
          onClick={() => setActiveTab('team2')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'team2'
              ? 'text-pitch-400 border-b-2 border-pitch-400'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          {result.innings2.batting_team_name}
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'analysis'
              ? 'text-pitch-400 border-b-2 border-pitch-400'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Analysis
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Score Summary */}
              <div className="flex gap-4 justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card p-4 text-center flex-1 max-w-[150px]"
                >
                  <div className="text-xs text-dark-400 mb-1">{result.innings1.batting_team_name}</div>
                  <div className="text-2xl font-bold text-white">
                    {result.innings1.total_runs}/{result.innings1.wickets}
                  </div>
                  <div className="text-xs text-dark-500">({result.innings1.overs} ov)</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-card p-4 text-center flex-1 max-w-[150px]"
                >
                  <div className="text-xs text-dark-400 mb-1">{result.innings2.batting_team_name}</div>
                  <div className="text-2xl font-bold text-white">
                    {result.innings2.total_runs}/{result.innings2.wickets}
                  </div>
                  <div className="text-xs text-dark-500">({result.innings2.overs} ov)</div>
                </motion.div>
              </div>

              {/* Man of the Match */}
              <ManOfTheMatchReveal mom={result.man_of_the_match} />
            </motion.div>
          )}

          {activeTab === 'team1' && (
            <motion.div
              key="team1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ScorecardTab innings={result.innings1} />
            </motion.div>
          )}

          {activeTab === 'team2' && (
            <motion.div
              key="team2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ScorecardTab innings={result.innings2} />
            </motion.div>
          )}

          {activeTab === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <MatchAnalysis
                careerId={careerId}
                fixtureId={fixtureId}
                team1Name={result.innings1.batting_team_name}
                team2Name={result.innings2.batting_team_name}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-dark-800">
        <button
          onClick={onBackToDashboard}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
