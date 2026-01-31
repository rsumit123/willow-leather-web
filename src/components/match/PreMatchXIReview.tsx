import { motion } from 'framer-motion';
import { Edit3, Play, Globe, Star, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PlayingXIPlayer } from '../../api/client';
import { TraitBadges } from '../common/TraitBadge';
import { IntentBadge } from '../common/IntentBadge';
import clsx from 'clsx';

const ROLE_COLORS: Record<string, string> = {
  wicket_keeper: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  batsman: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  all_rounder: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  bowler: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const ROLE_SHORT: Record<string, string> = {
  wicket_keeper: 'WK',
  batsman: 'BAT',
  all_rounder: 'AR',
  bowler: 'BWL',
};

interface PreMatchXIReviewProps {
  players: PlayingXIPlayer[];
  teamName: string;
  opponentName: string;
  fixtureId: string;
  onProceed: () => void;
}

export function PreMatchXIReview({
  players,
  teamName,
  opponentName,
  fixtureId,
  onProceed,
}: PreMatchXIReviewProps) {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/playing-xi?returnTo=/match/${fixtureId}`);
  };

  const overseasCount = players.filter(p => p.is_overseas).length;

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* Header */}
      <div className="bg-dark-900/50 border-b border-dark-800 px-4 py-4 safe-top">
        <div className="max-w-lg mx-auto">
          <div className="text-center">
            <p className="text-xs text-dark-400 uppercase tracking-wider mb-1">
              Upcoming Match
            </p>
            <h1 className="text-lg font-display font-bold text-white">
              {teamName} <span className="text-dark-400">vs</span> {opponentName}
            </h1>
          </div>
        </div>
      </div>

      {/* XI Review */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="max-w-lg mx-auto">
          {/* Title */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-pitch-500" />
              <h2 className="font-semibold text-white">Your Playing XI</h2>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-dark-400">
                <Globe className="w-3 h-3 inline mr-1" />
                {overseasCount}/4 Overseas
              </span>
            </div>
          </div>

          {/* Batting Order List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card overflow-hidden"
          >
            <div className="divide-y divide-dark-800/50">
              {players.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {/* Position */}
                  <div className="w-7 h-7 rounded-full bg-dark-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {index + 1}
                  </div>

                  {/* Player info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">
                        {player.name}
                      </span>
                      {player.is_overseas && (
                        <Globe className="w-3 h-3 text-blue-400 flex-shrink-0" />
                      )}
                      <span className={clsx(
                        'text-[10px] px-1.5 py-0.5 rounded border',
                        ROLE_COLORS[player.role]
                      )}>
                        {ROLE_SHORT[player.role]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {player.role !== 'bowler' && player.batting_intent && (
                        <IntentBadge intent={player.batting_intent} compact />
                      )}
                      {player.traits && player.traits.length > 0 && (
                        <TraitBadges traits={player.traits} maxShow={2} compact />
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className={clsx(
                      'w-3 h-3',
                      player.overall_rating >= 80
                        ? 'text-yellow-400 fill-yellow-400'
                        : player.overall_rating >= 70
                        ? 'text-pitch-400 fill-pitch-400'
                        : 'text-dark-400'
                    )} />
                    <span className="font-bold text-sm text-white">
                      {player.overall_rating}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Help text */}
          <p className="text-xs text-dark-500 text-center mt-4">
            Players are listed in batting order. Edit to change positions.
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 bg-dark-900/50 border-t border-dark-800 safe-bottom">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={handleEdit}
            className="flex-1 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 bg-dark-700 hover:bg-dark-600 text-white transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit XI
          </button>
          <button
            onClick={onProceed}
            className="flex-[2] py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 btn-primary"
          >
            <Play className="w-4 h-4" />
            Start Match
          </button>
        </div>
      </div>
    </div>
  );
}
