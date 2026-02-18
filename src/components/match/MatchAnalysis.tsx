import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { matchApi, type MatchAnalysisResponse, type FormChangeEntry } from '../../api/client';
import { DNAMatchupCard } from './DNAMatchupCard';
import { Loading } from '../common/Loading';
import clsx from 'clsx';

interface MatchAnalysisProps {
  careerId: number;
  fixtureId: number;
  team1Name: string;
  team2Name: string;
}

function FormChangeRow({ entry }: { entry: FormChangeEntry }) {
  const isUp = entry.delta > 0;
  const isNeutral = Math.abs(entry.delta) < 0.01;

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex-1 min-w-0">
        <span className="text-sm text-white truncate">{entry.player_name}</span>
        <span className="text-xs text-dark-500 ml-2">{entry.team_name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-dark-400">{entry.old_form.toFixed(2)}</span>
        {isNeutral ? (
          <Minus className="w-3 h-3 text-dark-500" />
        ) : isUp ? (
          <TrendingUp className="w-3 h-3 text-pitch-400" />
        ) : (
          <TrendingDown className="w-3 h-3 text-red-400" />
        )}
        <span className={clsx(
          'text-xs font-semibold min-w-[40px] text-right',
          isNeutral ? 'text-dark-400' : isUp ? 'text-pitch-400' : 'text-red-400'
        )}>
          {entry.new_form.toFixed(2)}
        </span>
        <span className={clsx(
          'text-[10px] min-w-[40px] text-right',
          isNeutral ? 'text-dark-500' : isUp ? 'text-pitch-400/70' : 'text-red-400/70'
        )}>
          ({isUp ? '+' : ''}{entry.delta.toFixed(3)})
        </span>
      </div>
    </div>
  );
}

type InningsTab = 'innings1' | 'innings2' | 'form';

export function MatchAnalysis({ careerId, fixtureId, team1Name, team2Name }: MatchAnalysisProps) {
  const [data, setData] = useState<MatchAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InningsTab>('innings1');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    matchApi.getAnalysis(careerId, fixtureId)
      .then((res) => {
        if (!cancelled) {
          setData(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.detail || 'Failed to load analysis');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [careerId, fixtureId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-8 h-8 mx-auto text-dark-600 mb-2" />
        <p className="text-sm text-dark-500">{error || 'No analysis data available'}</p>
      </div>
    );
  }

  const innings1Matchups = data.innings1_matchups;
  const innings2Matchups = data.innings2_matchups;

  const tabs: { key: InningsTab; label: string }[] = [
    { key: 'innings1', label: team1Name },
    { key: 'innings2', label: team2Name },
    { key: 'form', label: 'Form' },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-dark-800 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'flex-1 py-1.5 text-xs font-medium rounded-md transition-colors',
              activeTab === tab.key
                ? 'bg-dark-700 text-white'
                : 'text-dark-400 hover:text-dark-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'innings1' && (
          <motion.div
            key="innings1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {innings1Matchups.length > 0 ? (
              innings1Matchups.map((mu, i) => (
                <DNAMatchupCard key={`${mu.batter_id}-${mu.bowler_id}`} matchup={mu} index={i} />
              ))
            ) : (
              <p className="text-sm text-dark-500 text-center py-8">No matchup data for this innings</p>
            )}
          </motion.div>
        )}

        {activeTab === 'innings2' && (
          <motion.div
            key="innings2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {innings2Matchups.length > 0 ? (
              innings2Matchups.map((mu, i) => (
                <DNAMatchupCard key={`${mu.batter_id}-${mu.bowler_id}`} matchup={mu} index={i} />
              ))
            ) : (
              <p className="text-sm text-dark-500 text-center py-8">No matchup data for this innings</p>
            )}
          </motion.div>
        )}

        {activeTab === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between text-[10px] text-dark-500 uppercase tracking-wider pb-1 border-b border-dark-800">
              <span>Player</span>
              <span>Old → New (Δ)</span>
            </div>
            {data.form_changes.length > 0 ? (
              data.form_changes
                .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
                .map((fc) => (
                  <FormChangeRow key={fc.player_id} entry={fc} />
                ))
            ) : (
              <p className="text-sm text-dark-500 text-center py-8">No form changes recorded</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
