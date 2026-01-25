import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  Trophy,
  ChevronRight,
  Zap,
  Crown,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { careerApi, seasonApi } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { TeamBadge } from '../components/common/TeamCard';
import { PageHeader } from '../components/common/PageHeader';
import { PlayoffBracket } from '../components/playoffs/PlayoffBracket';
import clsx from 'clsx';

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { careerId, setCareer } = useGameStore();

  // Refresh career data
  const { data: careerData, isLoading: careerLoading } = useQuery({
    queryKey: ['career', careerId],
    queryFn: () => careerApi.get(careerId!).then((r) => r.data),
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

  // Generate fixtures mutation
  const generateFixturesMutation = useMutation({
    mutationFn: () => seasonApi.generateFixtures(careerId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career'] });
      queryClient.invalidateQueries({ queryKey: ['standings'] });
      queryClient.invalidateQueries({ queryKey: ['next-fixture'] });
    },
  });

  // Simulate next match
  const simulateMatchMutation = useMutation({
    mutationFn: () => seasonApi.simulateNextMatch(careerId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standings'] });
      queryClient.invalidateQueries({ queryKey: ['next-fixture'] });
      queryClient.invalidateQueries({ queryKey: ['career'] });
      queryClient.invalidateQueries({ queryKey: ['playoff-bracket'] });
    },
  });

  // Generate next playoff fixture
  const generateNextPlayoffMutation = useMutation({
    mutationFn: () => seasonApi.generateNextPlayoff(careerId!),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['playoff-bracket'] });
      queryClient.invalidateQueries({ queryKey: ['career'] });
      if (response.data.champion) {
        // Season complete - refresh everything
        queryClient.invalidateQueries();
      }
    },
  });

  // Simulate next playoff match (for spectating when eliminated)
  const simulateNextPlayoffMutation = useMutation({
    mutationFn: async () => {
      // First, ensure any needed playoff fixtures are generated
      await seasonApi.generateNextPlayoff(careerId!);
      // Then simulate the next match
      return seasonApi.simulateNextMatch(careerId!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playoff-bracket'] });
      queryClient.invalidateQueries({ queryKey: ['career'] });
      queryClient.invalidateQueries({ queryKey: ['standings'] });
    },
  });

  // Simulate all remaining playoff matches
  const simulateAllPlayoffsMutation = useMutation({
    mutationFn: async () => {
      // Keep simulating until season is complete
      let result;
      for (let i = 0; i < 10; i++) { // Max 10 iterations (safety)
        // Generate next playoff if needed
        const genResult = await seasonApi.generateNextPlayoff(careerId!);
        if (genResult.data.champion) {
          return genResult; // Season complete
        }
        // Simulate next match
        try {
          result = await seasonApi.simulateNextMatch(careerId!);
        } catch {
          break; // No more matches
        }
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playoff-bracket'] });
      queryClient.invalidateQueries({ queryKey: ['career'] });
      queryClient.invalidateQueries({ queryKey: ['standings'] });
    },
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
    if (careerData?.status === 'playoffs' && playoffBracket) {
      const q1Done = playoffBracket.qualifier_1?.status === 'completed';
      const elimDone = playoffBracket.eliminator?.status === 'completed';
      const q2Exists = !!playoffBracket.qualifier_2?.team1;
      const q2Done = playoffBracket.qualifier_2?.status === 'completed';
      const finalExists = !!playoffBracket.final?.team1;

      // Need to generate Q2?
      if (q1Done && elimDone && !q2Exists) {
        generateNextPlayoffMutation.mutate();
      }
      // Need to generate Final?
      else if (q1Done && q2Done && !finalExists) {
        generateNextPlayoffMutation.mutate();
      }
    }
  }, [playoffBracket, careerData?.status]);

  if (!careerId || careerLoading) {
    return <Loading fullScreen text="Loading..." />;
  }

  // Check if need to go to auction
  if (careerData?.status === 'pre_auction' || careerData?.status === 'auction') {
    navigate('/auction');
    return null;
  }

  const userTeam = careerData?.user_team;
  const userStanding = standings?.find((s) => s.team_id === userTeam?.id);

  // Check playoff qualification
  const qualifiedForPlayoffs = userStanding && userStanding.position <= 4;
  const isChampion = playoffBracket?.final?.winner === userTeam?.short_name;
  const isRunnerUp = playoffBracket?.final?.status === 'completed' &&
    (playoffBracket.final.team1 === userTeam?.short_name || playoffBracket.final.team2 === userTeam?.short_name) &&
    !isChampion;

  // Check if eliminated from playoffs
  const eliminatedInQ1 = playoffBracket?.qualifier_1?.status === 'completed' &&
    playoffBracket?.qualifier_2?.status === 'completed' &&
    playoffBracket.qualifier_1.winner !== userTeam?.short_name &&
    playoffBracket.qualifier_2.winner !== userTeam?.short_name &&
    (playoffBracket.qualifier_1.team1 === userTeam?.short_name || playoffBracket.qualifier_1.team2 === userTeam?.short_name);

  const eliminatedInElim = playoffBracket?.eliminator?.status === 'completed' &&
    playoffBracket.eliminator.winner !== userTeam?.short_name &&
    (playoffBracket.eliminator.team1 === userTeam?.short_name || playoffBracket.eliminator.team2 === userTeam?.short_name);

  const eliminatedInQ2 = playoffBracket?.qualifier_2?.status === 'completed' &&
    playoffBracket.qualifier_2.winner !== userTeam?.short_name &&
    (playoffBracket.qualifier_2.team1 === userTeam?.short_name || playoffBracket.qualifier_2.team2 === userTeam?.short_name);

  const isEliminated = eliminatedInQ1 || eliminatedInElim || eliminatedInQ2;
  const didNotQualify = careerData?.status === 'playoffs' && !qualifiedForPlayoffs;

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Championship Banner */}
        {isChampion && careerData?.status === 'post_season' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 text-center bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border-yellow-500/30"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-yellow-500/20 flex items-center justify-center">
              <Crown className="w-10 h-10 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-display font-bold text-yellow-400 mb-2">
              CHAMPIONS!
            </h2>
            <p className="text-dark-300">
              {userTeam?.name} won the IPL Season {careerData?.current_season_number}!
            </p>
          </motion.div>
        )}

        {/* Runner Up Banner */}
        {isRunnerUp && careerData?.status === 'post_season' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 text-center bg-gradient-to-br from-gray-400/20 to-gray-500/10 border-gray-400/30"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gray-400/20 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-display font-bold text-gray-300 mb-2">
              Runner Up
            </h2>
            <p className="text-dark-400">
              {userTeam?.name} finished as runner-up in Season {careerData?.current_season_number}
            </p>
          </motion.div>
        )}

        {/* Eliminated Banner */}
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
              {didNotQualify ? 'Did Not Qualify' : 'Eliminated'}
            </h2>
            <p className="text-dark-400 text-sm mb-3">
              {didNotQualify
                ? `${userTeam?.short_name} finished ${userStanding?.position}${getOrdinalSuffix(userStanding?.position || 0)} and missed the playoffs`
                : `${userTeam?.short_name} has been knocked out of the playoffs`
              }
            </p>
            {careerData?.status === 'playoffs' && (
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

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 relative overflow-hidden"
        >
          {/* Background gradient */}
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
              <p className="text-dark-400 text-sm">
                Season {careerData?.current_season_number} •{' '}
                <span className={clsx(
                  'capitalize',
                  careerData?.status === 'playoffs' && 'text-yellow-400',
                  careerData?.status === 'post_season' && 'text-pitch-400'
                )}>
                  {careerData?.status === 'post_season' ? 'Season Complete' : careerData?.status?.replace('_', ' ')}
                </span>
              </p>
            </div>
          </div>

          {/* Stats row */}
          {userStanding && (
            <div className="relative mt-4 pt-4 border-t border-dark-700/50 grid grid-cols-4 gap-2">
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
                <p className="text-2xl font-bold text-pitch-400">
                  {userStanding.won}
                </p>
                <p className="text-xs text-dark-400">Wins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-ball-400">
                  {userStanding.lost}
                </p>
                <p className="text-xs text-dark-400">Losses</p>
              </div>
              <div className="text-center">
                <p
                  className={clsx(
                    'text-2xl font-bold',
                    (userStanding.nrr || 0) >= 0 ? 'text-pitch-400' : 'text-ball-400'
                  )}
                >
                  {(userStanding.nrr || 0) >= 0 ? '+' : ''}
                  {userStanding.nrr?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-dark-400">NRR</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Pre-season actions */}
        {careerData?.status === 'pre_season' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-pitch-500/20 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-pitch-500" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Ready for Season?</h2>
            <p className="text-dark-400 text-sm mb-4">
              Your squad is set! Generate the fixtures to start the league.
            </p>
            <button
              onClick={() => generateFixturesMutation.mutate()}
              disabled={generateFixturesMutation.isPending}
              className="btn-primary"
            >
              {generateFixturesMutation.isPending ? 'Generating...' : 'Generate Fixtures'}
            </button>
          </motion.div>
        )}

        {/* Playoff Bracket */}
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

        {/* Next match (League phase) */}
        {nextFixture && careerData?.status === 'in_season' && (
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
                <p
                  className={clsx(
                    'font-display font-bold text-2xl',
                    nextFixture.team1_id === userTeam?.id && 'text-pitch-400'
                  )}
                >
                  {nextFixture.team1_name}
                </p>
              </div>

              <div className="px-4 py-2 bg-dark-800 rounded-lg">
                <span className="text-dark-400 text-sm">VS</span>
              </div>

              <div className="text-center flex-1">
                <p
                  className={clsx(
                    'font-display font-bold text-2xl',
                    nextFixture.team2_id === userTeam?.id && 'text-pitch-400'
                  )}
                >
                  {nextFixture.team2_name}
                </p>
              </div>
            </div>

            <p className="text-center text-dark-400 text-sm mt-3">
              {nextFixture.venue}
            </p>

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
          </motion.div>
        )}

        {/* Post-season - Next Season CTA */}
        {careerData?.status === 'post_season' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5 text-center"
          >
            <h2 className="text-lg font-semibold mb-2">Season Complete</h2>
            <p className="text-dark-400 text-sm mb-4">
              Ready to start Season {(careerData?.current_season_number || 1) + 1}?
            </p>
            <button
              className="btn-primary flex items-center justify-center gap-2 mx-auto"
              disabled
            >
              Start Next Season <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-dark-500 mt-2">Coming soon...</p>
          </motion.div>
        )}

        {/* Quick links */}
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
        </motion.div>

        {/* Top of table */}
        {standings && standings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-dark-700/50 flex items-center justify-between">
              <h2 className="font-semibold text-white">Standings</h2>
              <Link to="/standings" className="text-pitch-400 text-sm">
                View all
              </Link>
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
                  <span
                    className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold',
                      index === 0 && 'bg-yellow-500/20 text-yellow-400',
                      index === 1 && 'bg-gray-400/20 text-gray-400',
                      index === 2 && 'bg-amber-600/20 text-amber-500',
                      index >= 3 && 'bg-dark-700 text-dark-400'
                    )}
                  >
                    {team.position}
                  </span>
                  <span
                    className={clsx(
                      'font-medium flex-1',
                      team.team_id === userTeam?.id && 'text-pitch-400'
                    )}
                  >
                    {team.team_short_name}
                  </span>
                  <span className="text-dark-400 text-sm w-8 text-center">
                    {team.played}
                  </span>
                  <span className="font-bold w-8 text-center">{team.points}</span>
                </div>
              ))}
            </div>

            {/* Playoff qualification line */}
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
