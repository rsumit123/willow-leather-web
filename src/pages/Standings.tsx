import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { seasonApi } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { PageHeader } from '../components/common/PageHeader';
import clsx from 'clsx';

export function StandingsPage() {
  const { careerId, career } = useGameStore();

  const { data: standings, isLoading } = useQuery({
    queryKey: ['standings', careerId],
    queryFn: () => seasonApi.getStandings(careerId!).then((r) => r.data),
    enabled: !!careerId,
  });

  if (isLoading || !standings) {
    return <Loading fullScreen text="Loading standings..." />;
  }

  return (
    <>
      <PageHeader title="League Table" showBack backTo="/dashboard" />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white">League Table</h1>
            <p className="text-dark-400 text-sm">Season {career?.current_season_number}</p>
          </div>
        </div>

      {/* Legend */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-7 text-xs text-dark-400 font-medium">
          <div className="col-span-2">Team</div>
          <div className="text-center">P</div>
          <div className="text-center">W</div>
          <div className="text-center">L</div>
          <div className="text-center">Pts</div>
          <div className="text-center">NRR</div>
        </div>
      </div>

      {/* Table */}
      <div className="space-y-2">
        {standings.map((team, index) => (
          <motion.div
            key={team.team_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={clsx(
              'glass-card p-4 relative overflow-hidden',
              team.team_id === career?.user_team?.id && 'ring-2 ring-pitch-500 border-pitch-500/50'
            )}
          >
            {/* Qualification indicator */}
            {index < 4 && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-pitch-500" />
            )}

            <div className="grid grid-cols-7 items-center">
              {/* Position & Team */}
              <div className="col-span-2 flex items-center gap-3">
                <div
                  className={clsx(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                    index === 0 && 'bg-yellow-500/20 text-yellow-400',
                    index === 1 && 'bg-gray-400/20 text-gray-400',
                    index === 2 && 'bg-amber-600/20 text-amber-500',
                    index >= 3 && 'bg-dark-700 text-dark-400'
                  )}
                >
                  {team.position}
                </div>
                <div className="min-w-0">
                  <p
                    className={clsx(
                      'font-semibold text-sm truncate',
                      team.team_id === career?.user_team?.id ? 'text-pitch-400' : 'text-white'
                    )}
                  >
                    {team.team_short_name}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="text-center text-sm text-dark-400">{team.played}</div>
              <div className="text-center text-sm text-pitch-400 font-semibold">
                {team.won}
              </div>
              <div className="text-center text-sm text-ball-400 font-semibold">
                {team.lost}
              </div>
              <div className="text-center text-sm text-white font-bold">{team.points}</div>
              <div className="text-center text-sm">
                <div
                  className={clsx(
                    'inline-flex items-center gap-0.5 font-semibold',
                    (team.nrr || 0) >= 0 ? 'text-pitch-400' : 'text-ball-400'
                  )}
                >
                  {(team.nrr || 0) >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{(team.nrr || 0) >= 0 ? '+' : ''}{team.nrr?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Qualification info */}
      <div className="glass-card p-4 text-xs text-dark-400">
        <p className="mb-1">
          <span className="inline-block w-2 h-2 rounded-full bg-pitch-500 mr-2" />
          Top 4 teams qualify for playoffs
        </p>
        <p className="text-dark-500 text-xs">
          P: Played • W: Won • L: Lost • Pts: Points • NRR: Net Run Rate
        </p>
      </div>
    </div>
    </>
  );
}
