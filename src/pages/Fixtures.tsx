import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Circle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { seasonApi } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { PageHeader } from '../components/common/PageHeader';
import clsx from 'clsx';

export function FixturesPage() {
  const { careerId, career } = useGameStore();
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all');

  const { data: fixtures, isLoading } = useQuery({
    queryKey: ['fixtures', careerId, filter],
    queryFn: () =>
      seasonApi.getFixtures(careerId!, undefined, filter === 'all' ? undefined : filter).then((r) => r.data),
    enabled: !!careerId,
  });

  if (isLoading || !fixtures) {
    return <Loading fullScreen text="Loading fixtures..." />;
  }

  return (
    <>
      <PageHeader title="Fixtures" showBack backTo="/dashboard" />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-white">Fixtures</h1>
          <p className="text-dark-400 text-sm">Season {career?.current_season_number}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'scheduled', label: 'Upcoming' },
          { key: 'completed', label: 'Results' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filter === f.key
                ? 'bg-pitch-500 text-white'
                : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Fixtures list */}
      <div className="space-y-3">
        {fixtures.map((fixture, index) => (
          <motion.div
            key={fixture.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={clsx(
              'glass-card p-4',
              (fixture.team1_id === career?.user_team?.id ||
                fixture.team2_id === career?.user_team?.id) &&
                'ring-1 ring-pitch-500/30'
            )}
          >
            {/* Match number & status */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-dark-400">
                Match #{fixture.match_number}
              </span>
              {fixture.status === 'completed' ? (
                <CheckCircle className="w-4 h-4 text-pitch-500" />
              ) : (
                <Circle className="w-4 h-4 text-dark-600" />
              )}
            </div>

            {/* Teams */}
            <div className="grid grid-cols-7 items-center gap-2">
              <div className="col-span-3 text-right">
                <p
                  className={clsx(
                    'font-semibold text-sm',
                    fixture.team1_id === career?.user_team?.id
                      ? 'text-pitch-400'
                      : fixture.winner_id === fixture.team1_id
                      ? 'text-white'
                      : 'text-dark-400'
                  )}
                >
                  {fixture.team1_name}
                </p>
              </div>

              <div className="col-span-1 text-center">
                <span className="text-xs text-dark-500">vs</span>
              </div>

              <div className="col-span-3 text-left">
                <p
                  className={clsx(
                    'font-semibold text-sm',
                    fixture.team2_id === career?.user_team?.id
                      ? 'text-pitch-400'
                      : fixture.winner_id === fixture.team2_id
                      ? 'text-white'
                      : 'text-dark-400'
                  )}
                >
                  {fixture.team2_name}
                </p>
              </div>
            </div>

            {/* Venue or Result */}
            <div className="mt-3 pt-3 border-t border-dark-700/50">
              {fixture.result_summary ? (
                <p className="text-xs text-dark-300 text-center">
                  {fixture.result_summary}
                </p>
              ) : (
                <p className="text-xs text-dark-400 text-center">{fixture.venue}</p>
              )}
            </div>
          </motion.div>
        ))}

        {fixtures.length === 0 && (
          <div className="glass-card p-8 text-center">
            <p className="text-dark-400">No fixtures found</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
