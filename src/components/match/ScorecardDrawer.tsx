import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import type { LiveScorecardResponse, InningsScorecard } from '../../api/client';
import { TraitBadge } from '../common/TraitBadge';

interface ScorecardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  scorecard: LiveScorecardResponse | null;
  isLoading: boolean;
}

function InningsTab({ innings, isActive }: { innings: InningsScorecard; isActive: boolean }) {
  const [showBowling, setShowBowling] = useState(false);

  if (!isActive) return null;

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
                    <div className="font-medium text-white flex items-center gap-1">
                      <span>
                        {batter.player_name}
                        {!batter.is_out && <span className="text-pitch-400">*</span>}
                      </span>
                      {batter.traits && batter.traits.map((trait) => (
                        <TraitBadge key={trait} trait={trait} compact clickable />
                      ))}
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

export function ScorecardDrawer({ isOpen, onClose, scorecard, isLoading }: ScorecardDrawerProps) {
  const [activeTab, setActiveTab] = useState<1 | 2>(1);

  const innings1 = scorecard?.innings1;
  const innings2 = scorecard?.innings2;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-dark-900 rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-800">
              <h2 className="text-lg font-display font-bold text-white">Scorecard</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-dark-800 transition-colors"
              >
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>

            {/* Tabs */}
            {innings1 && (
              <div className="flex border-b border-dark-800">
                <button
                  onClick={() => setActiveTab(1)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === 1
                      ? 'text-pitch-400 border-b-2 border-pitch-400'
                      : 'text-dark-400 hover:text-white'
                  }`}
                >
                  {innings1.batting_team_name}
                </button>
                {innings2 && (
                  <button
                    onClick={() => setActiveTab(2)}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      activeTab === 2
                        ? 'text-pitch-400 border-b-2 border-pitch-400'
                        : 'text-dark-400 hover:text-white'
                    }`}
                  >
                    {innings2.batting_team_name}
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-pitch-400 border-t-transparent rounded-full" />
                </div>
              ) : !scorecard || !innings1 ? (
                <div className="text-center py-8 text-dark-400">
                  No scorecard data available
                </div>
              ) : (
                <>
                  {innings1 && <InningsTab innings={innings1} isActive={activeTab === 1} />}
                  {innings2 && <InningsTab innings={innings2} isActive={activeTab === 2} />}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
