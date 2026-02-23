import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Calendar,
  Trophy,
  ChevronRight,
  Zap,
  Crown,
  XCircle,
  ArrowRight,
  Shield,
  Play,
  Target,
  Swords,
  Dumbbell,
  Coffee,
  Bell,
  SkipForward,
  TrendingUp,
  Check,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { careerApi, seasonApi, transferApi, calendarApi, notificationApi, progressionApi, trainingApi } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { TeamBadge } from '../components/common/TeamCard';
import { PlayoffBracket } from '../components/playoffs/PlayoffBracket';
import { AIMatchSimulationOverlay } from '../components/dashboard/AIMatchSimulationOverlay';
import clsx from 'clsx';
import { useCoachMarks } from '../hooks/useCoachMarks';
import { CoachMark } from '../components/common/CoachMark';

const TIER_COLORS: Record<string, { text: string; bg: string; accent: string }> = {
  district: { text: 'text-amber-400', bg: 'bg-amber-500/20', accent: 'border-amber-500/30' },
  state: { text: 'text-blue-400', bg: 'bg-blue-500/20', accent: 'border-blue-500/30' },
  ipl: { text: 'text-pitch-400', bg: 'bg-pitch-500/20', accent: 'border-pitch-500/30' },
};

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { careerId, setCareer } = useGameStore();
  const [showAISimulation, setShowAISimulation] = useState(false);
  const { isVisible: isCoachVisible, dismiss: dismissCoach } = useCoachMarks();

  // Refresh career data
  const { data: careerData, isLoading: careerLoading } = useQuery({
    queryKey: ['career', careerId],
    queryFn: () => careerApi.get(careerId!).then((r) => r.data),
    enabled: !!careerId,
  });

  // Calendar current day
  const { data: calendarData } = useQuery({
    queryKey: ['calendar-current', careerId],
    queryFn: () => calendarApi.getCurrent(careerId!).then((r) => r.data),
    enabled: !!careerId,
  });

  // Notifications
  const { data: notifications } = useQuery({
    queryKey: ['notifications-preview', careerId],
    queryFn: () => notificationApi.list(careerId!, 3).then((r) => r.data),
    enabled: !!careerId,
  });

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count', careerId],
    queryFn: () => notificationApi.unreadCount(careerId!).then((r) => r.data),
    enabled: !!careerId,
  });

  // Progression status (objectives)
  const { data: progressionStatus } = useQuery({
    queryKey: ['progression-status', careerId],
    queryFn: () => progressionApi.getStatus(careerId!).then((r) => r.data),
    enabled: !!careerId,
  });

  // Get standings
  const { data: standings } = useQuery({
    queryKey: ['standings', careerId],
    queryFn: () => seasonApi.getStandings(careerId!).then((r) => r.data),
    enabled: !!careerId && (careerData?.status === 'in_season' || careerData?.status === 'playoffs' || careerData?.status === 'post_season'),
  });

  // Get next fixture (for league phase)
  const { data: nextFixture } = useQuery({
    queryKey: ['next-fixture', careerId],
    queryFn: () => seasonApi.getNextFixture(careerId!).then((r) => r.data),
    enabled: !!careerId && careerData?.status === 'in_season',
  });

  // Get all scheduled fixtures (to find AI matches before user's match)
  const { data: scheduledFixtures } = useQuery({
    queryKey: ['scheduled-fixtures', careerId],
    queryFn: () => seasonApi.getFixtures(careerId!, 'league', 'scheduled').then((r) => r.data),
    enabled: !!careerId && careerData?.status === 'in_season',
  });

  // Get playoff bracket
  const { data: playoffBracket } = useQuery({
    queryKey: ['playoff-bracket', careerId],
    queryFn: () => seasonApi.getPlayoffBracket(careerId!).then((r) => r.data),
    enabled: !!careerId && (careerData?.status === 'playoffs' || careerData?.status === 'post_season'),
  });

  // Get squad
  const { data: squad } = useQuery({
    queryKey: ['squad', careerId, careerData?.user_team_id],
    queryFn: () =>
      careerApi.getSquad(careerId!, careerData!.user_team_id!).then((r) => r.data),
    enabled: !!careerId && !!careerData?.user_team_id,
  });

  // Get playing XI (for pre-season gate and in-season editing)
  const { data: playingXI } = useQuery({
    queryKey: ['playing-xi', careerId],
    queryFn: () => careerApi.getPlayingXI(careerId!).then((r) => r.data),
    enabled: !!careerId && (careerData?.status === 'pre_season' || careerData?.status === 'in_season'),
  });

  // Squad registration (state tier needs 15 from 25)
  const { data: squadRegistration } = useQuery({
    queryKey: ['squad-registration', careerId],
    queryFn: () => careerApi.getSquadRegistration(careerId!).then((r) => r.data),
    enabled: !!careerId && careerData?.status === 'pre_season' && careerData?.tier === 'state',
  });

  // Get leaderboards for preview cards
  const { data: leaderboards } = useQuery({
    queryKey: ['leaderboards', careerId],
    queryFn: () => seasonApi.getLeaderboards(careerId!).then((r) => r.data),
    enabled: !!careerId && (careerData?.status === 'in_season' || careerData?.status === 'playoffs' || careerData?.status === 'post_season'),
  });

  // Check if training is available (only on training days)
  const { isError: trainingUnavailable } = useQuery({
    queryKey: ['available-drills', careerId],
    queryFn: () => trainingApi.getAvailableDrills(careerId!).then((r) => r.data),
    enabled: !!careerId && calendarData?.current_day?.day_type === 'training',
    retry: false,
    staleTime: 60000,
  });

  // Shared error state for dashboard mutations
  const [dashError, setDashError] = useState<string | null>(null);
  const onMutationError = (error: any) => {
    setDashError(error?.response?.data?.detail || 'Something went wrong. Please try again.');
  };

  // Generate fixtures mutation
  const generateFixturesMutation = useMutation({
    mutationFn: () => seasonApi.generateFixtures(careerId!),
    onSuccess: () => {
      setDashError(null);
      queryClient.invalidateQueries({ queryKey: ['career'] });
      queryClient.invalidateQueries({ queryKey: ['standings'] });
      queryClient.invalidateQueries({ queryKey: ['next-fixture'] });
    },
    onError: onMutationError,
  });

  // Simulate next match
  const simulateMatchMutation = useMutation({
    mutationFn: () => seasonApi.simulateNextMatch(careerId!),
    onSuccess: () => {
      setDashError(null);
      queryClient.invalidateQueries({ queryKey: ['standings'] });
      queryClient.invalidateQueries({ queryKey: ['next-fixture'] });
      queryClient.invalidateQueries({ queryKey: ['career'] });
      queryClient.invalidateQueries({ queryKey: ['playoff-bracket'] });
    },
    onError: onMutationError,
  });

  // Generate next playoff fixture
  const generateNextPlayoffMutation = useMutation({
    mutationFn: () => seasonApi.generateNextPlayoff(careerId!),
    onSuccess: (response) => {
      setDashError(null);
      queryClient.invalidateQueries({ queryKey: ['playoff-bracket'] });
      queryClient.invalidateQueries({ queryKey: ['career'] });
      if (response.data.champion) {
        queryClient.invalidateQueries();
      }
    },
    onError: onMutationError,
  });

  // Simulate next playoff match (for spectating when eliminated)
  const simulateNextPlayoffMutation = useMutation({
    mutationFn: async () => {
      await seasonApi.generateNextPlayoff(careerId!);
      return seasonApi.simulateNextMatch(careerId!);
    },
    onSuccess: () => {
      setDashError(null);
      queryClient.invalidateQueries({ queryKey: ['playoff-bracket'] });
      queryClient.invalidateQueries({ queryKey: ['career'] });
      queryClient.invalidateQueries({ queryKey: ['standings'] });
    },
    onError: onMutationError,
  });

  // Simulate all remaining playoff matches
  const simulateAllPlayoffsMutation = useMutation({
    mutationFn: async () => {
      let result;
      for (let i = 0; i < 10; i++) {
        const genResult = await seasonApi.generateNextPlayoff(careerId!);
        if (genResult.data.champion) {
          return genResult;
        }
        try {
          result = await seasonApi.simulateNextMatch(careerId!);
        } catch {
          break;
        }
      }
      return result;
    },
    onSuccess: () => {
      setDashError(null);
      queryClient.invalidateQueries({ queryKey: ['playoff-bracket'] });
      queryClient.invalidateQueries({ queryKey: ['career'] });
      queryClient.invalidateQueries({ queryKey: ['standings'] });
    },
    onError: onMutationError,
  });

  // Calendar advance
  const advanceMutation = useMutation({
    mutationFn: (skipToEvent: boolean) => calendarApi.advance(careerId!, skipToEvent),
    onSuccess: () => {
      setDashError(null);
      queryClient.invalidateQueries({ queryKey: ['calendar-current'] });
      queryClient.invalidateQueries({ queryKey: ['career'] });
      queryClient.invalidateQueries({ queryKey: ['next-fixture'] });
      queryClient.invalidateQueries({ queryKey: ['available-drills'] });
    },
    onError: onMutationError,
  });

  // Transfer window start
  const startTransferMutation = useMutation({
    mutationFn: () => transferApi.start(careerId!),
    onSuccess: () => {
      setDashError(null);
      queryClient.invalidateQueries({ queryKey: ['career'] });
      navigate('/transfer-window');
    },
    onError: onMutationError,
  });

  // Season evaluation
  const [evalResult, setEvalResult] = useState<{
    result: string;
    promotion_available: boolean;
    sacked: boolean;
    reputation_change: number;
    new_reputation: number;
    position: number;
    is_champion: boolean;
    objectives_met: string[];
  } | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);

  const evaluateSeasonMutation = useMutation({
    mutationFn: () => progressionApi.evaluateSeason(careerId!),
    onSuccess: (response) => {
      setEvalResult(response.data);
      queryClient.invalidateQueries({ queryKey: ['career'] });
      queryClient.invalidateQueries({ queryKey: ['progression-status'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
    onError: () => setEvalError('Failed to evaluate season. Please try again.'),
  });

  const acceptPromotionMutation = useMutation({
    mutationFn: () => progressionApi.acceptPromotion(careerId!),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setEvalResult(null);
    },
    onError: () => setEvalError('Failed to accept promotion. Please try again.'),
  });

  const startNextSeasonMutation = useMutation({
    mutationFn: () => progressionApi.startNextSeason(careerId!),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setEvalResult(null);
    },
    onError: () => setEvalError('Failed to start next season. Please try again.'),
  });

  // Update career store when data loads
  useEffect(() => {
    if (careerData) {
      setCareer(careerData);
    }
  }, [careerData]);

  // Redirect if no career
  useEffect(() => {
    if (!careerId) {
      navigate('/');
    }
  }, [careerId]);

  // Auto-generate next playoff fixture if needed
  useEffect(() => {
    if (
      careerData?.status === 'playoffs' &&
      playoffBracket &&
      !generateNextPlayoffMutation.isPending &&
      !generateNextPlayoffMutation.isError
    ) {
      const q1Done = playoffBracket.qualifier_1?.status === 'completed';
      const elimDone = playoffBracket.eliminator?.status === 'completed';
      const q2Exists = !!playoffBracket.qualifier_2?.team1;
      const q2Done = playoffBracket.qualifier_2?.status === 'completed';
      const finalExists = !!playoffBracket.final?.team1;

      if (q1Done && elimDone && !q2Exists) {
        generateNextPlayoffMutation.mutate();
      } else if (q1Done && q2Done && !finalExists) {
        generateNextPlayoffMutation.mutate();
      }
    }
  }, [playoffBracket, careerData?.status, generateNextPlayoffMutation.isPending, generateNextPlayoffMutation.isError]);

  // Redirect to auction if needed
  useEffect(() => {
    if (careerData?.status === 'pre_auction' || careerData?.status === 'auction') {
      navigate('/auction');
    }
  }, [careerData?.status, navigate]);

  if (!careerId || careerLoading) {
    return <Loading fullScreen text="Loading..." />;
  }

  if (careerData?.status === 'pre_auction' || careerData?.status === 'auction') {
    return <Loading fullScreen text="Loading..." />;
  }

  const userTeam = careerData?.user_team;
  const userStanding = standings?.find((s) => s.team_id === userTeam?.id);
  const tier = careerData?.tier || 'ipl';
  const tierColors = TIER_COLORS[tier] || TIER_COLORS.ipl;

  // Playoff helpers
  const qualifiedForPlayoffs = userStanding && userStanding.position <= 4;
  const isChampion = playoffBracket?.final?.winner === userTeam?.short_name;
  const isRunnerUp = playoffBracket?.final?.status === 'completed' &&
    (playoffBracket.final.team1 === userTeam?.short_name || playoffBracket.final.team2 === userTeam?.short_name) &&
    !isChampion;

  const playedInQ1 = playoffBracket?.qualifier_1?.team1 === userTeam?.short_name ||
    playoffBracket?.qualifier_1?.team2 === userTeam?.short_name;
  const playedInElim = playoffBracket?.eliminator?.team1 === userTeam?.short_name ||
    playoffBracket?.eliminator?.team2 === userTeam?.short_name;
  const playedInQ2 = playoffBracket?.qualifier_2?.team1 === userTeam?.short_name ||
    playoffBracket?.qualifier_2?.team2 === userTeam?.short_name;

  const eliminatedInElim = playoffBracket?.eliminator?.status === 'completed' &&
    playedInElim && playoffBracket.eliminator.winner !== userTeam?.short_name;
  const eliminatedInQ2 = playoffBracket?.qualifier_2?.status === 'completed' &&
    playedInQ2 && playoffBracket.qualifier_2.winner !== userTeam?.short_name;
  const lostQ1WaitingForQ2 = playoffBracket?.qualifier_1?.status === 'completed' &&
    playedInQ1 && playoffBracket.qualifier_1.winner !== userTeam?.short_name &&
    !playoffBracket?.qualifier_2?.team1;

  const isEliminated = eliminatedInElim || eliminatedInQ2;
  const didNotQualify = careerData?.status === 'playoffs' && !qualifiedForPlayoffs;
  const playoffsComplete = playoffBracket?.final?.status === 'completed';
  const hasMorePlayoffMatches = careerData?.status === 'playoffs' && !playoffsComplete;

  // AI matches before user's next match
  const aiMatchesBeforeUserMatch = scheduledFixtures?.filter(f => {
    const userNextMatch = scheduledFixtures?.find(
      fix => fix.team1_id === userTeam?.id || fix.team2_id === userTeam?.id
    );
    if (!userNextMatch) return false;
    return f.match_number < userNextMatch.match_number &&
      f.team1_id !== userTeam?.id && f.team2_id !== userTeam?.id;
  }) || [];

  const userNextMatch = scheduledFixtures?.find(
    f => f.team1_id === userTeam?.id || f.team2_id === userTeam?.id
  );

  const handleNextMatch = () => {
    if (aiMatchesBeforeUserMatch.length > 0) {
      setShowAISimulation(true);
    } else if (userNextMatch) {
      navigate(`/match/${userNextMatch.id}`);
    }
  };

  const handleAISimulationComplete = () => {
    setShowAISimulation(false);
    queryClient.invalidateQueries({ queryKey: ['standings'] });
    queryClient.invalidateQueries({ queryKey: ['next-fixture'] });
    queryClient.invalidateQueries({ queryKey: ['scheduled-fixtures'] });
    if (userNextMatch) {
      navigate(`/match/${userNextMatch.id}`);
    }
  };

  // Current day info
  const currentDay = calendarData?.current_day;
  const hasCalendar = calendarData?.has_calendar;

  // Detect if the current match_day's fixture is already completed
  // scheduledFixtures only returns status=scheduled fixtures, so absence means completed
  const isCurrentMatchCompleted = currentDay?.day_type === 'match_day'
    && currentDay?.fixture_id
    && scheduledFixtures
    && !scheduledFixtures.find(f => f.id === currentDay.fixture_id);

  // Detect if there's a match in progress (for resume functionality)
  const isCurrentMatchInProgress = currentDay?.day_type === 'match_day'
    && currentDay?.fixture_id
    && currentDay?.fixture_status === 'in_progress';

  // Tier display name
  const tierDisplayName = tier === 'district' ? 'District Cricket' : tier === 'state' ? 'State / Ranji' : 'IPL';

  return (
    <>
      {/* AI Match Simulation Overlay */}
      <AnimatePresence>
        {showAISimulation && userTeam && (
          <AIMatchSimulationOverlay
            careerId={careerId!}
            fixtures={[...aiMatchesBeforeUserMatch, ...(userNextMatch ? [userNextMatch] : [])]}
            userTeamId={userTeam.id}
            onComplete={handleAISimulationComplete}
          />
        )}
      </AnimatePresence>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* ─── Header Card ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 relative overflow-hidden"
        >
          {userTeam && (
            <div
              className="absolute inset-0 opacity-10"
              style={{
                background: `linear-gradient(135deg, ${userTeam.primary_color} 0%, transparent 60%)`,
              }}
            />
          )}

          <div className="relative flex items-center gap-4">
            {userTeam && <TeamBadge team={userTeam} size="md" />}
            <div className="flex-1">
              <h1 className="font-display font-bold text-xl text-white">
                {userTeam?.name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-dark-400">
                <span className={clsx('capitalize font-medium', tierColors.text)}>
                  {tierDisplayName}
                </span>
                <span>•</span>
                <span>Season {careerData?.current_season_number}</span>
              </div>
            </div>
          </div>

          {/* Date display */}
          {currentDay && (
            <div className="relative mt-3 pt-3 border-t border-dark-700/50 flex items-center justify-between">
              <span className="text-sm text-dark-300">{currentDay.date}</span>
              <span className={clsx(
                'text-xs capitalize',
                careerData?.status === 'playoffs' && 'text-yellow-400',
                careerData?.status === 'post_season' && 'text-pitch-400',
                careerData?.status === 'in_season' && 'text-dark-400',
              )}>
                {careerData?.status === 'post_season' ? 'Season Complete' : careerData?.status?.replace('_', ' ')}
              </span>
            </div>
          )}

          {/* Stats row */}
          {userStanding && (
            <div className="relative mt-3 pt-3 border-t border-dark-700/50 grid grid-cols-4 gap-2">
              <div className="text-center">
                <p className={clsx(
                  'text-2xl font-bold',
                  userStanding.position <= 4 ? 'text-pitch-400' : 'text-white'
                )}>
                  #{userStanding.position}
                </p>
                <p className="text-xs text-dark-400">Position</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-pitch-400">{userStanding.won}</p>
                <p className="text-xs text-dark-400">Wins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-ball-400">{userStanding.lost}</p>
                <p className="text-xs text-dark-400">Losses</p>
              </div>
              <div className="text-center">
                <p className={clsx(
                  'text-2xl font-bold',
                  (userStanding.nrr || 0) >= 0 ? 'text-pitch-400' : 'text-ball-400'
                )}>
                  {(userStanding.nrr || 0) >= 0 ? '+' : ''}{userStanding.nrr?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-dark-400">NRR</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* ─── Dashboard Error Banner ─── */}
        {dashError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-ball-500/10 border border-ball-500/20 rounded-lg p-3 flex items-center justify-between"
          >
            <span className="text-sm text-ball-400">{dashError}</span>
            <button onClick={() => setDashError(null)} className="text-ball-400 hover:text-ball-300 text-xs ml-3">
              Dismiss
            </button>
          </motion.div>
        )}

        {/* ─── Championship / Elimination Banners ─── */}
        {isChampion && careerData?.status === 'post_season' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 text-center bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border-yellow-500/30"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-yellow-500/20 flex items-center justify-center">
              <Crown className="w-10 h-10 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-display font-bold text-yellow-400 mb-2">CHAMPIONS!</h2>
            <p className="text-dark-300">
              {userTeam?.name} won the {tierDisplayName} Season {careerData?.current_season_number}!
            </p>
          </motion.div>
        )}

        {isRunnerUp && careerData?.status === 'post_season' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 text-center bg-gradient-to-br from-gray-400/20 to-gray-500/10 border-gray-400/30"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gray-400/20 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-display font-bold text-gray-300 mb-2">Runner Up</h2>
            <p className="text-dark-400">
              {userTeam?.name} finished as runner-up in Season {careerData?.current_season_number}
            </p>
          </motion.div>
        )}

        {lostQ1WaitingForQ2 && !isEliminated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 text-center border-amber-500/30 bg-amber-500/5"
          >
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-lg font-semibold text-amber-400 mb-1">Waiting for Qualifier 2</h2>
            <p className="text-dark-400 text-sm mb-3">
              {userTeam?.short_name} lost Qualifier 1 but gets another chance!
            </p>
            <button
              onClick={() => simulateNextPlayoffMutation.mutate()}
              disabled={simulateNextPlayoffMutation.isPending}
              className="btn-primary text-sm"
            >
              {simulateNextPlayoffMutation.isPending ? 'Simulating...' : 'Simulate Eliminator'}
            </button>
          </motion.div>
        )}

        {(isEliminated || didNotQualify) && !isChampion && !isRunnerUp && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 text-center border-ball-500/30 bg-ball-500/5"
          >
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-ball-500/20 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-ball-500" />
            </div>
            <h2 className="text-lg font-semibold text-ball-400 mb-1">
              {didNotQualify ? 'Did Not Qualify' : 'Season Over'}
            </h2>
            <p className="text-dark-400 text-sm mb-3">
              {didNotQualify
                ? `${userTeam?.short_name} finished ${userStanding?.position}${getOrdinalSuffix(userStanding?.position || 0)} and missed the playoffs`
                : `${userTeam?.short_name} has been knocked out. Better luck next season!`}
            </p>
            {hasMorePlayoffMatches && (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => simulateNextPlayoffMutation.mutate()}
                  disabled={simulateNextPlayoffMutation.isPending || simulateAllPlayoffsMutation.isPending}
                  className="btn-secondary text-sm"
                >
                  {simulateNextPlayoffMutation.isPending ? 'Simulating...' : 'Watch Next Match'}
                </button>
                <button
                  onClick={() => simulateAllPlayoffsMutation.mutate()}
                  disabled={simulateNextPlayoffMutation.isPending || simulateAllPlayoffsMutation.isPending}
                  className="btn-primary text-sm"
                >
                  {simulateAllPlayoffsMutation.isPending ? 'Simulating...' : 'Skip to Finals'}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Today Card ─── */}
        {hasCalendar && currentDay && careerData?.status === 'in_season' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={clsx('glass-card p-4', tierColors.accent)}
          >
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-semibold text-white text-sm uppercase tracking-wider">Today</h2>
              <span className="text-xs text-dark-500">{currentDay.date}</span>
            </div>

            {currentDay.day_type === 'match_day' && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    isCurrentMatchCompleted ? 'bg-pitch-500/20' : isCurrentMatchInProgress ? 'bg-amber-500/20' : 'bg-ball-500/20',
                  )}>
                    {isCurrentMatchCompleted ? (
                      <Check className="w-5 h-5 text-pitch-400" />
                    ) : isCurrentMatchInProgress ? (
                      <Play className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Swords className="w-5 h-5 text-ball-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {isCurrentMatchCompleted ? 'Match Complete' : isCurrentMatchInProgress ? 'Match In Progress' : 'Match Day'}
                    </p>
                    {currentDay.opponent_name && (
                      <p className="text-xs text-dark-400">
                        {userTeam?.short_name} vs {currentDay.opponent_name}
                      </p>
                    )}
                  </div>
                </div>
                {isCurrentMatchCompleted ? (
                  <button
                    onClick={() => advanceMutation.mutate(true)}
                    disabled={advanceMutation.isPending}
                    className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                  >
                    <SkipForward className="w-4 h-4" />
                    {advanceMutation.isPending ? 'Advancing...' : 'Advance to Next Event'}
                  </button>
                ) : isCurrentMatchInProgress ? (
                  <button
                    onClick={() => navigate(`/match/${currentDay.fixture_id}`)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm bg-amber-500 hover:bg-amber-400 text-dark-950 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Resume Match
                  </button>
                ) : currentDay.fixture_id ? (
                  <button
                    onClick={() => {
                      if (aiMatchesBeforeUserMatch.length > 0) {
                        handleNextMatch();
                      } else {
                        navigate(`/match/${currentDay.fixture_id}`);
                      }
                    }}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Play Match
                    {aiMatchesBeforeUserMatch.length > 0 && (
                      <span className="text-xs opacity-75">
                        ({aiMatchesBeforeUserMatch.length} AI first)
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleNextMatch}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Next Match
                  </button>
                )}
              </div>
            )}

            {currentDay.day_type === 'training' && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    trainingUnavailable ? 'bg-pitch-500/20' : 'bg-blue-500/20',
                  )}>
                    {trainingUnavailable ? (
                      <Check className="w-5 h-5 text-pitch-400" />
                    ) : (
                      <Dumbbell className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {trainingUnavailable ? 'Training Complete' : 'Training Day'}
                    </p>
                    <p className="text-xs text-dark-400">
                      {trainingUnavailable ? 'You have already trained today' : 'Choose drills for your squad'}
                    </p>
                  </div>
                </div>
                {!trainingUnavailable ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate('/training')}
                      className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
                    >
                      <Dumbbell className="w-4 h-4" />
                      Train Squad
                    </button>
                    <button
                      onClick={() => advanceMutation.mutate(true)}
                      disabled={advanceMutation.isPending}
                      className="btn-secondary flex items-center justify-center gap-2 text-sm"
                    >
                      <SkipForward className="w-4 h-4" />
                      Skip
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => advanceMutation.mutate(true)}
                    disabled={advanceMutation.isPending}
                    className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                  >
                    <SkipForward className="w-4 h-4" />
                    {advanceMutation.isPending ? 'Advancing...' : 'Skip to Next Event'}
                  </button>
                )}
              </div>
            )}

            {(currentDay.day_type === 'rest' || currentDay.day_type === 'travel') && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    currentDay.day_type === 'rest' ? 'bg-dark-700/50' : 'bg-amber-500/20',
                  )}>
                    {currentDay.day_type === 'rest' ? (
                      <Coffee className="w-5 h-5 text-dark-400" />
                    ) : (
                      <ArrowRight className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {currentDay.day_type === 'rest' ? 'Rest Day' : 'Travel Day'}
                    </p>
                    <p className="text-xs text-dark-400">
                      {currentDay.day_type === 'rest' ? 'Players recover fitness' : 'Traveling to next venue'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => advanceMutation.mutate(true)}
                  disabled={advanceMutation.isPending}
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                >
                  <SkipForward className="w-4 h-4" />
                  {advanceMutation.isPending ? 'Advancing...' : 'Skip to Next Event'}
                </button>
              </div>
            )}

            {currentDay.day_type === 'event' && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Event Day</p>
                    <p className="text-xs text-dark-400">{currentDay.event_description || 'Special event'}</p>
                  </div>
                </div>
                <button
                  onClick={() => advanceMutation.mutate(true)}
                  disabled={advanceMutation.isPending}
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                >
                  <SkipForward className="w-4 h-4" />
                  {advanceMutation.isPending ? 'Advancing...' : 'Skip to Next Event'}
                </button>
              </div>
            )}

            {/* Unknown day_type fallback */}
            {!['match_day', 'training', 'rest', 'travel', 'event'].includes(currentDay.day_type) && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-dark-700/50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-dark-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white capitalize">{currentDay.day_type.replace('_', ' ')}</p>
                  </div>
                </div>
                <button
                  onClick={() => advanceMutation.mutate(true)}
                  disabled={advanceMutation.isPending}
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                >
                  <SkipForward className="w-4 h-4" />
                  {advanceMutation.isPending ? 'Advancing...' : 'Skip to Next Event'}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Coach Marks ─── */}
        {careerData?.status === 'pre_season' && !playingXI?.is_set && (
          <CoachMark
            id="first_playing_xi"
            title="Welcome, Manager!"
            message="Start by selecting your Playing XI — pick 11 players to take the field."
            isVisible={isCoachVisible('first_playing_xi')}
            onDismiss={dismissCoach}
          />
        )}
        {hasCalendar && currentDay?.day_type === 'match_day' && !isCurrentMatchCompleted && (
          <CoachMark
            id="first_match_day"
            title="Match Day!"
            message="Tap Play Match to begin. Review your XI, do the toss, then play ball-by-ball."
            isVisible={isCoachVisible('first_match_day')}
            onDismiss={dismissCoach}
          />
        )}
        {hasCalendar && currentDay?.day_type === 'training' && (
          <CoachMark
            id="first_training_day"
            title="Training Day"
            message="Training drills give temporary stat boosts for 2 matches. Choose wisely!"
            isVisible={isCoachVisible('first_training_day')}
            onDismiss={dismissCoach}
          />
        )}
        {hasCalendar && (currentDay?.day_type === 'rest' || currentDay?.day_type === 'travel') && (
          <CoachMark
            id="first_rest_day"
            title="Rest Day"
            message="Nothing to do today. Tap 'Skip to Next Event' to jump ahead."
            isVisible={isCoachVisible('first_rest_day')}
            onDismiss={dismissCoach}
          />
        )}

        {/* ─── Pre-season actions ─── */}
        {careerData?.status === 'pre_season' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5 text-center"
          >
            {/* State tier: squad registration gate */}
            {tier === 'state' && squadRegistration && !squadRegistration.is_complete ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Register Tournament Squad</h2>
                <p className="text-dark-400 text-sm mb-4">
                  Select {squadRegistration.max_allowed} players from your {squad?.total_players || 25} to register for the State Tournament.
                </p>
                <button
                  onClick={() => navigate('/squad-registration')}
                  className="btn-primary"
                >
                  Register Squad
                </button>
              </>
            ) : playingXI?.is_set ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-pitch-500/20 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-pitch-500" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Ready for Season?</h2>
                <p className="text-dark-400 text-sm mb-4">
                  Your playing XI is set! Generate the fixtures to start the league.
                </p>
                <button
                  onClick={() => generateFixturesMutation.mutate()}
                  disabled={generateFixturesMutation.isPending}
                  className="btn-primary"
                >
                  {generateFixturesMutation.isPending ? 'Generating...' : 'Generate Fixtures'}
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Select Your Playing XI</h2>
                <p className="text-dark-400 text-sm mb-4">
                  Choose your 11 players before generating fixtures.
                </p>
                <button
                  onClick={() => navigate('/playing-xi')}
                  className="btn-primary"
                >
                  Select Playing XI
                </button>
              </>
            )}
          </motion.div>
        )}

        {/* ─── Inbox Preview ─── */}
        {notifications && notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card overflow-hidden"
          >
            <Link
              to="/inbox"
              className="px-4 py-3 border-b border-dark-700/50 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-dark-400" />
                <h2 className="font-semibold text-white text-sm">Inbox</h2>
                {(unreadData?.count || 0) > 0 && (
                  <span className="text-xs bg-ball-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                    {unreadData!.count}
                  </span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-dark-500" />
            </Link>
            <div className="divide-y divide-dark-800/50">
              {notifications.slice(0, 3).map((n) => (
                <Link
                  key={n.id}
                  to={n.action_url || '/inbox'}
                  className={clsx(
                    'px-4 py-3 flex items-start gap-3 hover:bg-dark-800/30 transition-colors',
                    !n.read && 'bg-dark-850/50',
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className={clsx(
                      'text-sm',
                      !n.read ? 'text-white font-medium' : 'text-dark-300',
                    )}>
                      {n.title}
                    </p>
                    <p className="text-xs text-dark-400 truncate">{n.body}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-pitch-500 mt-1 flex-shrink-0" />}
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── Season Objective ─── */}
        {progressionStatus && progressionStatus.objectives.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Link
              to="/progression"
              className={clsx('glass-card p-4 block hover:border-dark-500 transition-colors', tierColors.accent)}
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Season Objective</h3>
                <ChevronRight className="w-4 h-4 text-dark-500 ml-auto" />
              </div>
              {progressionStatus.objectives.map((obj) => (
                <div key={obj.id} className="mb-1 last:mb-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={clsx(
                      obj.achieved ? 'text-pitch-400' : 'text-dark-300',
                    )}>
                      {obj.description}
                    </span>
                    {obj.achieved && <span className="text-pitch-400 font-medium">Done</span>}
                  </div>
                </div>
              ))}
              {/* Reputation bar */}
              <div className="mt-2 pt-2 border-t border-dark-700/50">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-dark-400">Reputation</span>
                  <span className="text-amber-400 font-medium">
                    {progressionStatus.reputation_title} ({progressionStatus.reputation})
                  </span>
                </div>
                <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                    style={{ width: `${progressionStatus.reputation}%` }}
                  />
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* ─── Playoff Bracket ─── */}
        {(careerData?.status === 'playoffs' || careerData?.status === 'post_season') && playoffBracket && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Playoff Bracket
              </h2>
              {qualifiedForPlayoffs && (
                <span className="badge badge-green">Qualified</span>
              )}
            </div>
            <PlayoffBracket
              bracket={playoffBracket}
              userTeamShortName={userTeam?.short_name}
              onPlayMatch={(fixtureId) => navigate(`/match/${fixtureId}`)}
            />
          </motion.div>
        )}

        {/* ─── Next Match (fallback for non-calendar flow) ─── */}
        {nextFixture && careerData?.status === 'in_season' && !hasCalendar && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Next Match</h2>
              <span className="badge badge-yellow">Match #{nextFixture.match_number}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className={clsx(
                  'font-display font-bold text-2xl',
                  nextFixture.team1_id === userTeam?.id && 'text-pitch-400'
                )}>
                  {nextFixture.team1_name}
                </p>
              </div>
              <div className="px-4 py-2 bg-dark-800 rounded-lg">
                <span className="text-dark-400 text-sm">VS</span>
              </div>
              <div className="text-center flex-1">
                <p className={clsx(
                  'font-display font-bold text-2xl',
                  nextFixture.team2_id === userTeam?.id && 'text-pitch-400'
                )}>
                  {nextFixture.team2_name}
                </p>
              </div>
            </div>
            <p className="text-center text-dark-400 text-sm mt-3">{nextFixture.venue}</p>
            {aiMatchesBeforeUserMatch.length > 0 ? (
              <button
                onClick={handleNextMatch}
                className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Next Match
                <span className="text-xs opacity-75">
                  ({aiMatchesBeforeUserMatch.length} AI match{aiMatchesBeforeUserMatch.length > 1 ? 'es' : ''} first)
                </span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (nextFixture.team1_id === userTeam?.id || nextFixture.team2_id === userTeam?.id) {
                    navigate(`/match/${nextFixture.id}`);
                  } else {
                    simulateMatchMutation.mutate();
                  }
                }}
                disabled={simulateMatchMutation.isPending}
                className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                {simulateMatchMutation.isPending ? 'Simulating...' :
                  (nextFixture.team1_id === userTeam?.id || nextFixture.team2_id === userTeam?.id) ? 'Play Match' : 'Simulate Match'}
              </button>
            )}
          </motion.div>
        )}

        {/* ─── Post-season actions ─── */}
        {careerData?.status === 'post_season' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
          >
            {/* Error banner */}
            {evalError && (
              <div className="bg-ball-500/10 border border-ball-500/20 rounded-lg p-3 mb-4 text-sm text-ball-400">
                {evalError}
              </div>
            )}

            {/* Game Over */}
            {(evalResult?.sacked || careerData?.game_over) ? (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                  <XCircle className="w-7 h-7 text-red-400" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-1">Career Over</h2>
                <p className="text-dark-400 text-sm mb-4">
                  The board has decided to part ways with you.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => navigate('/manager-stats')}
                    className="btn-secondary flex items-center gap-2"
                  >
                    View Stats
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="btn-primary flex items-center gap-2"
                  >
                    Main Menu
                  </button>
                </div>
              </div>

            /* Step 1: Not evaluated yet — show "Evaluate Season" */
            ) : !evalResult ? (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-7 h-7 text-amber-400" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-1">Season Complete</h2>
                <p className="text-dark-400 text-sm mb-4">
                  {isChampion ? 'Congratulations, Champion!' : 'The season is over.'} Evaluate your performance to see what comes next.
                </p>
                <button
                  onClick={() => evaluateSeasonMutation.mutate()}
                  disabled={evaluateSeasonMutation.isPending}
                  className="btn-primary flex items-center justify-center gap-2 mx-auto"
                >
                  <TrendingUp className="w-4 h-4" />
                  {evaluateSeasonMutation.isPending ? 'Evaluating...' : 'Evaluate Season'}
                </button>
              </div>

            /* Step 2: Evaluated — show results + next action */
            ) : (
              <div>
                {/* Evaluation results */}
                <div className="text-center mb-4">
                  <h2 className="text-lg font-semibold text-white mb-2">Season Evaluation</h2>
                  <div className="flex items-center justify-center gap-4 text-sm mb-3">
                    <span className="text-dark-400">
                      Finished <span className="text-white font-bold">#{evalResult.position}</span>
                    </span>
                    <span className={clsx(
                      'font-bold',
                      evalResult.reputation_change > 0 ? 'text-pitch-400' : evalResult.reputation_change < 0 ? 'text-ball-400' : 'text-dark-400'
                    )}>
                      {evalResult.reputation_change > 0 ? '+' : ''}{evalResult.reputation_change} Rep
                    </span>
                  </div>
                  {evalResult.objectives_met.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {evalResult.objectives_met.map((obj, i) => (
                        <div key={i} className="flex items-center justify-center gap-2 text-sm text-pitch-400">
                          <Target className="w-3.5 h-3.5" />
                          {obj}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Promotion available */}
                {evalResult.promotion_available ? (
                  <div className="text-center">
                    <div className="bg-pitch-500/10 border border-pitch-500/20 rounded-lg p-4 mb-4">
                      <Crown className="w-6 h-6 text-pitch-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-pitch-400">
                        Promotion Available!
                      </p>
                      <p className="text-xs text-dark-400 mt-1">
                        You've earned a spot at the next level of cricket.
                      </p>
                    </div>
                    <button
                      onClick={() => acceptPromotionMutation.mutate()}
                      disabled={acceptPromotionMutation.isPending}
                      className="btn-primary flex items-center justify-center gap-2 mx-auto w-full"
                    >
                      <Crown className="w-4 h-4" />
                      {acceptPromotionMutation.isPending ? 'Promoting...' : 'Accept Promotion'}
                    </button>
                  </div>

                /* No promotion — district: start next season directly */
                ) : tier === 'district' ? (
                  <div className="text-center">
                    <button
                      onClick={() => startNextSeasonMutation.mutate()}
                      disabled={startNextSeasonMutation.isPending}
                      className="btn-primary flex items-center justify-center gap-2 mx-auto w-full"
                    >
                      {startNextSeasonMutation.isPending ? 'Starting...' : 'Start Next Season'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                /* No promotion — state/ipl: transfer window */
                ) : (
                  <div className="text-center">
                    <button
                      onClick={() => startTransferMutation.mutate()}
                      disabled={startTransferMutation.isPending}
                      className="btn-primary flex items-center justify-center gap-2 mx-auto w-full"
                    >
                      {startTransferMutation.isPending ? 'Starting...' : 'Transfer Window'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {careerData?.status === 'transfer_window' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5 text-center"
          >
            <h2 className="text-lg font-semibold mb-2">Transfer Window Open</h2>
            <p className="text-dark-400 text-sm mb-4">
              Continue with player retentions and the mini-auction.
            </p>
            <button
              onClick={() => navigate('/transfer-window')}
              className="btn-primary flex items-center justify-center gap-2 mx-auto"
            >
              Continue Transfer <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ─── Quick Links ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          <Link
            to="/squad"
            className="glass-card p-4 flex items-center gap-3 hover:border-dark-500 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-white">Squad</p>
              <p className="text-xs text-dark-400">{squad?.total_players || 0} players</p>
            </div>
            <ChevronRight className="w-4 h-4 text-dark-500 ml-auto" />
          </Link>

          <Link
            to="/standings"
            className="glass-card p-4 flex items-center gap-3 hover:border-dark-500 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-white">Table</p>
              <p className="text-xs text-dark-400">League standings</p>
            </div>
            <ChevronRight className="w-4 h-4 text-dark-500 ml-auto" />
          </Link>

          {careerData?.status === 'in_season' && (
            <Link
              to="/playing-xi"
              className="glass-card p-4 flex items-center gap-3 hover:border-dark-500 transition-colors col-span-2"
            >
              <div className="w-10 h-10 rounded-xl bg-pitch-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-pitch-400" />
              </div>
              <div>
                <p className="font-medium text-white">Playing XI</p>
                <p className="text-xs text-dark-400">Edit your lineup before the next match</p>
              </div>
              <ChevronRight className="w-4 h-4 text-dark-500 ml-auto" />
            </Link>
          )}
        </motion.div>

        {/* ─── Leaderboards Preview ─── */}
        {leaderboards && (leaderboards.orange_cap.length > 0 || leaderboards.purple_cap.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-2 gap-3"
          >
            <Link to="/leaderboards" className="glass-card p-4 hover:border-orange-500/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="text-xs font-medium text-orange-400">Orange Cap</span>
                </div>
                <ChevronRight className="w-4 h-4 text-dark-500" />
              </div>
              {leaderboards.orange_cap.length > 0 ? (
                <div className="space-y-2">
                  {leaderboards.orange_cap.slice(0, 3).map((player, i) => (
                    <div key={player.player_id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                          i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          i === 1 ? 'bg-gray-400/20 text-gray-400' :
                          'bg-amber-600/20 text-amber-500'
                        )}>{i + 1}</span>
                        <span className="text-dark-300 truncate max-w-[80px]">{player.player_name}</span>
                      </div>
                      <span className={clsx('font-bold', i === 0 ? 'text-orange-400' : 'text-white')}>
                        {player.runs}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-500 text-xs">No stats yet</p>
              )}
            </Link>

            <Link to="/leaderboards" className="glass-card p-4 hover:border-purple-500/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Target className="w-4 h-4 text-purple-500" />
                  </div>
                  <span className="text-xs font-medium text-purple-400">Purple Cap</span>
                </div>
                <ChevronRight className="w-4 h-4 text-dark-500" />
              </div>
              {leaderboards.purple_cap.length > 0 ? (
                <div className="space-y-2">
                  {leaderboards.purple_cap.slice(0, 3).map((player, i) => (
                    <div key={player.player_id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                          i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          i === 1 ? 'bg-gray-400/20 text-gray-400' :
                          'bg-amber-600/20 text-amber-500'
                        )}>{i + 1}</span>
                        <span className="text-dark-300 truncate max-w-[80px]">{player.player_name}</span>
                      </div>
                      <span className={clsx('font-bold', i === 0 ? 'text-purple-400' : 'text-white')}>
                        {player.wickets}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-500 text-xs">No stats yet</p>
              )}
            </Link>
          </motion.div>
        )}

        {/* ─── Mini Standings ─── */}
        {standings && standings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-dark-700/50 flex items-center justify-between">
              <h2 className="font-semibold text-white">Standings</h2>
              <Link to="/standings" className="text-pitch-400 text-sm">View all</Link>
            </div>
            <div className="divide-y divide-dark-800/50">
              {standings.slice(0, 4).map((team, index) => (
                <div
                  key={team.team_id}
                  className={clsx(
                    'px-4 py-3 flex items-center gap-3',
                    team.team_id === userTeam?.id && 'bg-pitch-500/10'
                  )}
                >
                  <span className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold',
                    index === 0 && 'bg-yellow-500/20 text-yellow-400',
                    index === 1 && 'bg-gray-400/20 text-gray-400',
                    index === 2 && 'bg-amber-600/20 text-amber-500',
                    index >= 3 && 'bg-dark-700 text-dark-400'
                  )}>
                    {team.position}
                  </span>
                  <span className={clsx(
                    'font-medium flex-1',
                    team.team_id === userTeam?.id && 'text-pitch-400'
                  )}>
                    {team.team_short_name}
                  </span>
                  <span className="text-dark-400 text-sm w-8 text-center">{team.played}</span>
                  <span className="font-bold w-8 text-center">{team.points}</span>
                </div>
              ))}
            </div>
            {careerData?.status === 'in_season' && (
              <div className="px-4 py-2 bg-dark-800/50 border-t border-dashed border-pitch-500/30">
                <p className="text-xs text-center text-pitch-400">
                  Top 4 teams qualify for playoffs
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </>
  );
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
