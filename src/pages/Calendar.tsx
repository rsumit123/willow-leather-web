import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Swords,
  Dumbbell,
  Coffee,
  Plane,
  Calendar as CalendarIcon,
  SkipForward,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '../api/client';
import type { GameDay } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { SubPageHeader } from '../components/common/SubPageHeader';
import clsx from 'clsx';

const DAY_TYPE_CONFIG: Record<string, { icon: typeof Swords; color: string; bgColor: string; label: string }> = {
  match_day: { icon: Swords, color: 'text-ball-500', bgColor: 'bg-ball-500/20', label: 'Match Day' },
  training: { icon: Dumbbell, color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'Training' },
  rest: { icon: Coffee, color: 'text-dark-400', bgColor: 'bg-dark-700/50', label: 'Rest Day' },
  travel: { icon: Plane, color: 'text-amber-400', bgColor: 'bg-amber-500/20', label: 'Travel Day' },
  event: { icon: CalendarIcon, color: 'text-purple-400', bgColor: 'bg-purple-500/20', label: 'Event' },
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { careerId } = useGameStore();

  // Current calendar state
  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendar-current', careerId],
    queryFn: () => calendarApi.getCurrent(careerId!).then((r) => r.data),
    enabled: !!careerId,
  });

  // Parse current date for month view
  const currentDate = calendarData?.current_day?.date
    ? new Date(calendarData.current_day.date + 'T00:00:00')
    : new Date();

  const [viewMonth, setViewMonth] = useState<number>(currentDate.getMonth());
  const [viewYear, setViewYear] = useState<number>(currentDate.getFullYear());

  // Get month data
  const { data: monthData } = useQuery({
    queryKey: ['calendar-month', careerId, viewYear, viewMonth + 1],
    queryFn: () => calendarApi.getMonth(careerId!, viewYear, viewMonth + 1).then((r) => r.data),
    enabled: !!careerId,
  });

  const [calendarError, setCalendarError] = useState<string | null>(null);

  // Advance day mutation
  const advanceMutation = useMutation({
    mutationFn: (skipToEvent: boolean) => calendarApi.advance(careerId!, skipToEvent),
    onSuccess: () => {
      setCalendarError(null);
      queryClient.invalidateQueries({ queryKey: ['calendar-current'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] });
      queryClient.invalidateQueries({ queryKey: ['career'] });
    },
    onError: (error: any) => {
      setCalendarError(error?.response?.data?.detail || 'Failed to advance day. Please try again.');
    },
  });

  // Build calendar grid
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Monday=0

    const daysMap = new Map<string, GameDay>();
    monthData?.days?.forEach((d) => daysMap.set(d.date, d));

    const grid: (GameDay | null)[] = [];
    for (let i = 0; i < startDow; i++) grid.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      grid.push(daysMap.get(dateStr) || null);
    }
    return grid;
  }, [monthData, viewMonth, viewYear]);

  const monthName = new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long' });

  // Selected day detail
  const [selectedDay, setSelectedDay] = useState<GameDay | null>(null);
  const displayDay = selectedDay || calendarData?.current_day || null;

  if (!careerId) return null;
  if (isLoading) return <Loading fullScreen text="Loading calendar..." />;

  if (!calendarData?.has_calendar) {
    return (
      <>
        <SubPageHeader title="Calendar" showBack backTo="/dashboard" />
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <CalendarIcon className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">No Calendar Yet</h2>
          <p className="text-dark-400 text-sm">
            The season calendar will be available once fixtures are generated.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <SubPageHeader title="Calendar" showBack backTo="/dashboard" />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
              else setViewMonth(viewMonth - 1);
            }}
            className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-dark-300" />
          </button>
          <h2 className="font-display font-bold text-lg text-white">
            {monthName} {viewYear}
          </h2>
          <button
            onClick={() => {
              if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
              else setViewMonth(viewMonth + 1);
            }}
            className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-dark-300" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="glass-card p-3">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs text-dark-500 font-medium py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarGrid.map((day, i) => {
              if (!day) {
                return <div key={`empty-${i}`} className="aspect-square" />;
              }
              const dateNum = parseInt(day.date.split('-')[2]);
              const isToday = day.is_current;
              const isPast = !isToday && day.date < (calendarData?.current_day?.date || '');
              const isSelected = selectedDay?.date === day.date;

              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDay(day)}
                  className={clsx(
                    'aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all relative',
                    isPast && 'opacity-40',
                    isToday && 'ring-2 ring-pitch-500',
                    isSelected && !isToday && 'ring-2 ring-dark-400',
                    'hover:bg-dark-700/50',
                  )}
                >
                  <span className={clsx(
                    'font-medium',
                    isToday ? 'text-pitch-400' : 'text-white',
                  )}>
                    {dateNum}
                  </span>
                  {/* Day type dot */}
                  <span className={clsx(
                    'w-1.5 h-1.5 rounded-full mt-0.5',
                    day.day_type === 'match_day' && 'bg-ball-500',
                    day.day_type === 'training' && 'bg-blue-500',
                    day.day_type === 'travel' && 'bg-amber-500',
                    day.day_type === 'event' && 'bg-purple-500',
                    day.day_type === 'rest' && 'bg-dark-600',
                  )} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Detail */}
        {displayDay && (
          <motion.div
            key={displayDay.date}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4"
          >
            {(() => {
              const dayConfig = DAY_TYPE_CONFIG[displayDay.day_type] || DAY_TYPE_CONFIG.rest;
              const DayIcon = dayConfig.icon;
              return (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', dayConfig.bgColor)}>
                      <DayIcon className={clsx('w-5 h-5', dayConfig.color)} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{dayConfig.label}</p>
                      <p className="text-xs text-dark-400">{displayDay.date}</p>
                    </div>
                    {displayDay.is_current && (
                      <span className="ml-auto text-xs bg-pitch-500/20 text-pitch-400 px-2 py-0.5 rounded-full">
                        TODAY
                      </span>
                    )}
                  </div>

                  {/* Match day details */}
                  {displayDay.day_type === 'match_day' && displayDay.opponent_name && (
                    <div className="bg-dark-800/50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-white font-medium">
                        vs {displayDay.opponent_name}
                      </p>
                      {displayDay.venue && (
                        <p className="text-xs text-dark-400 mt-0.5">{displayDay.venue}</p>
                      )}
                      {displayDay.match_number && (
                        <p className="text-xs text-dark-500 mt-0.5">Match #{displayDay.match_number}</p>
                      )}
                      {displayDay.is_current && displayDay.fixture_id && (
                        <button
                          onClick={() => navigate(`/match/${displayDay.fixture_id}`)}
                          className="btn-primary text-sm mt-3 w-full"
                        >
                          Play Match
                        </button>
                      )}
                    </div>
                  )}

                  {/* Training day actions */}
                  {displayDay.day_type === 'training' && displayDay.is_current && (
                    <button
                      onClick={() => navigate('/training')}
                      className="btn-primary text-sm w-full"
                    >
                      Train Squad
                    </button>
                  )}

                  {displayDay.event_description && (
                    <p className="text-sm text-dark-300">{displayDay.event_description}</p>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Calendar error */}
        {calendarError && (
          <div className="bg-ball-500/10 border border-ball-500/20 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-ball-400">{calendarError}</span>
            <button onClick={() => setCalendarError(null)} className="text-ball-400 hover:text-ball-300 text-xs ml-3">
              Dismiss
            </button>
          </div>
        )}

        {/* Skip to Next Event */}
        {calendarData?.current_day && calendarData.current_day.day_type !== 'match_day' && (
          <button
            onClick={() => advanceMutation.mutate(true)}
            disabled={advanceMutation.isPending}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <SkipForward className="w-4 h-4" />
            {advanceMutation.isPending ? 'Advancing...' : 'Skip to Next Event'}
          </button>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          {Object.entries(DAY_TYPE_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-dark-400">
              <span className={clsx(
                'w-2 h-2 rounded-full',
                key === 'match_day' && 'bg-ball-500',
                key === 'training' && 'bg-blue-500',
                key === 'travel' && 'bg-amber-500',
                key === 'event' && 'bg-purple-500',
                key === 'rest' && 'bg-dark-600',
              )} />
              {cfg.label}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
