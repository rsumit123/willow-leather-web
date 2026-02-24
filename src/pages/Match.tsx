import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchApi, seasonApi, careerApi, calendarApi, type BallResult, type TossResult } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { ScoreHeader } from '../components/match/ScoreHeader';
import { BallDisplay } from '../components/match/BallDisplay';
import { MatchupPanel } from '../components/match/MatchupPanel';
import { ThisOver } from '../components/match/ThisOver';
import { ScoutPopup } from '../components/match/ScoutPopup';
import { PitchReveal } from '../components/match/PitchReveal';
import { TacticsPanel } from '../components/match/TacticsPanel';
import { TossScreen } from '../components/match/TossScreen';
import { BowlerSelection } from '../components/match/BowlerSelection';
import { BatterSelection } from '../components/match/BatterSelection';
import { ScorecardDrawer } from '../components/match/ScorecardDrawer';
import { MatchCompletionScreen } from '../components/match/MatchCompletionScreen';
import { PreMatchXIReview } from '../components/match/PreMatchXIReview';
import { MilestoneAlert, type MilestoneType } from '../components/match/MilestoneAlert';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

export function MatchPage() {
  const { fixtureId } = useParams<{ fixtureId: string }>();
  const navigate = useNavigate();
  const { careerId } = useGameStore();
  const queryClient = useQueryClient();
  const [aggression, setAggression] = useState('balanced');
  const [lastBall, setLastBall] = useState<BallResult | null>(null);
  const [showPreMatchReview, setShowPreMatchReview] = useState(true);
  const [showToss, setShowToss] = useState(false);
  const [tossResult, setTossResult] = useState<TossResult | null>(null);
  const [showInningsChange, setShowInningsChange] = useState(false);
  const [inningsChangeInfo, setInningsChangeInfo] = useState<{ target: number; battingTeam: string } | null>(null);
  const [showBowlerSelect, setShowBowlerSelect] = useState(false);
  const [showBatterSelect, setShowBatterSelect] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [scoutPlayerId, setScoutPlayerId] = useState<number | null>(null);
  const [showPitchReveal, setShowPitchReveal] = useState(false);

  // Milestone alert state
  const [milestone, setMilestone] = useState<{
    type: MilestoneType;
    playerName: string;
    detail?: string;
  } | null>(null);

  // Track previous runs by player ID to detect 50/100 milestones correctly
  const playerMilestonesRef = useRef<Record<number, { shown50: boolean; shown100: boolean }>>({});
  const consecutiveWicketsRef = useRef<number>(0);
  const lastBowlerIdRef = useRef<number | null>(null);

  const fid = parseInt(fixtureId || '0');

  // Fetch fixture details
  const { data: fixture } = useQuery({
    queryKey: ['fixture', careerId, fid],
    queryFn: () => seasonApi.getFixtures(careerId!).then((r) => r.data.find(f => f.id === fid)),
    enabled: !!careerId && !!fid,
  });

  // Fetch playing XI for pre-match review
  const { data: playingXI, isLoading: xiLoading } = useQuery({
    queryKey: ['playing-xi', careerId],
    queryFn: () => careerApi.getPlayingXI(careerId!).then((r) => r.data),
    enabled: !!careerId && showPreMatchReview,
  });

  // Redirect to XI selection if not set
  useEffect(() => {
    if (!xiLoading && playingXI && !playingXI.is_set && showPreMatchReview) {
      navigate(`/playing-xi?returnTo=/match/${fixtureId}`);
    }
  }, [playingXI, xiLoading, showPreMatchReview, navigate, fixtureId]);

  // Early probe: check if match is already in progress (for resume flow)
  // This fires immediately, even before pre-match review / toss screens
  const { data: resumeProbe, isError: resumeProbeError } = useQuery({
    queryKey: ['match-state-probe', careerId, fid],
    queryFn: () => matchApi.getState(careerId!, fid).then((r) => r.data),
    enabled: !!careerId && !!fid && (showPreMatchReview || showToss),
    retry: false,
    staleTime: Infinity, // Only fetch once
  });

  // If the probe finds a live match, skip pre-match review and toss
  useEffect(() => {
    if (resumeProbe && !resumeProbeError) {
      setShowPreMatchReview(false);
      setShowToss(false);
      // Seed the main query cache so it doesn't re-fetch
      queryClient.setQueryData(['match-state', careerId, fid], resumeProbe);
    }
  }, [resumeProbe, resumeProbeError, queryClient, careerId, fid]);

  // Fetch match state (main query — runs after pre-match/toss screens are dismissed)
  const { data: state, isLoading, isError } = useQuery({
    queryKey: ['match-state', careerId, fid],
    queryFn: () => matchApi.getState(careerId!, fid).then((r) => r.data),
    enabled: !!careerId && !!fid && !showToss && !showPreMatchReview,
    refetchInterval: (query) => {
        // Stop polling if match is completed or if there's an error
        if (query.state.error) return false;
        return query.state.data?.status === 'completed' ? false : 2000;
    },
    retry: false, // Don't retry on 404 - session is lost
  });

  const [matchError, setMatchError] = useState<string | null>(null);

  // Toss mutation
  const tossMutation = useMutation({
    mutationFn: () => matchApi.doToss(careerId!, fid),
    onSuccess: (response) => {
      setMatchError(null);
      setTossResult(response.data);
    },
    onError: (error: any) => {
      setMatchError(error?.response?.data?.detail || 'Toss failed. Please try again.');
    },
  });

  // Start match mutation
  const startMutation = useMutation({
    mutationFn: ({ tossWinnerId, electedTo }: { tossWinnerId?: number; electedTo?: string }) =>
      matchApi.startMatch(careerId!, fid, tossWinnerId, electedTo),
    onSuccess: () => {
      setMatchError(null);
      setShowToss(false);
      setShowPitchReveal(true);
      queryClient.invalidateQueries({ queryKey: ['match-state'] });
    },
    onError: (error: any) => {
      setMatchError(error?.response?.data?.detail || 'Failed to start match. Please try again.');
    },
  });

  // Play ball mutation
  const playBallMutation = useMutation({
    mutationFn: ({ agg, delivery }: { agg: string; delivery?: string }) =>
      matchApi.playBall(careerId!, fid, agg, delivery || undefined),
    onSuccess: (response) => {
      const ballResult = response.data;
      const newState = ballResult.match_state;

      setLastBall(ballResult);
      setSelectedDelivery(null); // Reset delivery selection after each ball
      queryClient.setQueryData(['match-state', careerId, fid], newState);

      // Check for milestones (only if innings didn't just change)
      if (!newState.innings_just_changed) {
        const striker = newState.striker;

        // Check for 50 or 100 - track per player ID to avoid duplicate alerts
        if (striker) {
          const playerId = striker.id;
          if (!playerMilestonesRef.current[playerId]) {
            playerMilestonesRef.current[playerId] = { shown50: false, shown100: false };
          }
          const milestones = playerMilestonesRef.current[playerId];

          if (striker.runs >= 100 && !milestones.shown100) {
            milestones.shown100 = true;
            milestones.shown50 = true; // Also mark 50 as shown
            setMilestone({
              type: 'hundred',
              playerName: striker.name,
              detail: `${striker.runs} (${striker.balls})`
            });
          } else if (striker.runs >= 50 && striker.runs < 100 && !milestones.shown50) {
            milestones.shown50 = true;
            setMilestone({
              type: 'fifty',
              playerName: striker.name,
              detail: `${striker.runs} (${striker.balls})`
            });
          }
        }

        // Check for wicket
        if (ballResult.is_wicket) {
          const bowler = newState.bowler;

          // Track consecutive wickets for hat-trick (must be same bowler, consecutive balls)
          if (bowler && lastBowlerIdRef.current === bowler.id) {
            consecutiveWicketsRef.current++;
          } else {
            consecutiveWicketsRef.current = 1;
          }
          lastBowlerIdRef.current = bowler?.id || null;

          // Show hat-trick or wicket alert
          if (consecutiveWicketsRef.current >= 3 && bowler) {
            setMilestone({
              type: 'hatrick',
              playerName: bowler.name,
              detail: `${bowler.wickets}/${bowler.runs}`
            });
          } else if (bowler) {
            setMilestone({
              type: 'wicket',
              playerName: bowler.name,
              detail: ballResult.commentary
            });
          }
        } else {
          // Reset consecutive wickets on ANY non-wicket ball (hat-trick requires 3 consecutive wicket balls)
          consecutiveWicketsRef.current = 0;
        }
      } else {
        // Reset tracking on innings change
        playerMilestonesRef.current = {};
        consecutiveWicketsRef.current = 0;
        lastBowlerIdRef.current = null;
      }

      // Check for innings change
      if (newState.innings_just_changed) {
        setInningsChangeInfo({
          target: newState.target || 0,
          battingTeam: newState.batting_team_name
        });
        setShowInningsChange(true);
      }
    },
    onError: (error: any) => {
      if (error.response?.status === 404) {
        // Session lost - show toss screen to restart
        setShowToss(true);
        setTossResult(null);
        queryClient.removeQueries({ queryKey: ['match-state', careerId, fid] });
      }
    }
  });

  // Simulate over mutation
  const simulateOverMutation = useMutation({
    mutationFn: (agg: string) => matchApi.simulateOver(careerId!, fid, agg),
    onSuccess: (response) => {
      queryClient.setQueryData(['match-state', careerId, fid], response.data);
      // Check for innings change
      if (response.data.innings_just_changed) {
        setInningsChangeInfo({
          target: response.data.target || 0,
          battingTeam: response.data.batting_team_name
        });
        setShowInningsChange(true);
      }
    },
    onError: (error: any) => {
      if (error.response?.status === 404) {
        // Session lost - show toss screen to restart
        setShowToss(true);
        setTossResult(null);
        queryClient.removeQueries({ queryKey: ['match-state', careerId, fid] });
      }
    }
  });

  // Simulate innings mutation
  const simulateInningsMutation = useMutation({
    mutationFn: () => matchApi.simulateInnings(careerId!, fid),
    onSuccess: (response) => {
      queryClient.setQueryData(['match-state', careerId, fid], response.data);
      // Check for innings change
      if (response.data.innings_just_changed) {
        setInningsChangeInfo({
          target: response.data.target || 0,
          battingTeam: response.data.batting_team_name
        });
        setShowInningsChange(true);
      }
    },
    onError: (error: any) => {
      if (error.response?.status === 404) {
        // Session lost - show toss screen to restart
        setShowToss(true);
        setTossResult(null);
        queryClient.removeQueries({ queryKey: ['match-state', careerId, fid] });
      }
    }
  });

  // Get available bowlers query - disable caching to always get fresh data
  const { data: availableBowlers, isFetching: isFetchingBowlers } = useQuery({
    queryKey: ['available-bowlers', careerId, fid],
    queryFn: () => matchApi.getAvailableBowlers(careerId!, fid).then((r) => r.data),
    enabled: !!careerId && !!fid && showBowlerSelect,
    staleTime: 0,
    gcTime: 0, // Don't cache this data at all
  });

  // Get available batters query
  const { data: availableBatters, isFetching: isFetchingBatters } = useQuery({
    queryKey: ['available-batters', careerId, fid],
    queryFn: () => matchApi.getAvailableBatters(careerId!, fid).then((r) => r.data),
    enabled: !!careerId && !!fid && showBatterSelect,
    staleTime: 0,
    gcTime: 0,
  });

  // Get live scorecard query
  const { data: scorecard, isLoading: scorecardLoading } = useQuery({
    queryKey: ['scorecard', careerId, fid],
    queryFn: () => matchApi.getScorecard(careerId!, fid).then((r) => r.data),
    enabled: !!careerId && !!fid && showScorecard && !showToss,
  });

  // Get match result query (for completed matches)
  const { data: matchResult } = useQuery({
    queryKey: ['match-result', careerId, fid],
    queryFn: () => matchApi.getMatchResult(careerId!, fid).then((r) => r.data),
    enabled: !!careerId && !!fid && state?.status === 'completed',
    retry: false,
  });

  // Select bowler mutation
  const selectBowlerMutation = useMutation({
    mutationFn: (bowlerId: number) => matchApi.selectBowler(careerId!, fid, bowlerId),
    onSuccess: (response) => {
      queryClient.setQueryData(['match-state', careerId, fid], response.data);
      setShowBowlerSelect(false);
    },
    onError: (error: any) => {
      setMatchError(error?.response?.data?.detail || 'Failed to select bowler.');
    },
  });

  // Select batter mutation
  const selectBatterMutation = useMutation({
    mutationFn: (batterId: number) => matchApi.selectBatter(careerId!, fid, batterId),
    onSuccess: (response) => {
      queryClient.setQueryData(['match-state', careerId, fid], response.data);
      setShowBatterSelect(false);
    },
    onError: (error: any) => {
      setMatchError(error?.response?.data?.detail || 'Failed to select batter.');
    },
  });

  // Show bowler selection modal when:
  // 1. can_change_bowler is true (start of over, user is bowling)
  // 2. No bowler is currently selected (prevents reopening after selection)
  // 3. Modal is not already showing
  // 4. Not showing innings change modal
  useEffect(() => {
    if (state?.can_change_bowler && !state?.bowler && !showBowlerSelect && !showInningsChange) {
      // Invalidate cached bowler data before showing modal
      queryClient.invalidateQueries({ queryKey: ['available-bowlers', careerId, fid] });
      setShowBowlerSelect(true);
    }
  }, [state?.can_change_bowler, state?.bowler, showBowlerSelect, showInningsChange, queryClient, careerId, fid]);

  // Show batter selection modal when:
  // 1. can_change_batter is true (wicket fell, user is batting)
  // 2. No striker is currently selected
  // 3. Modal is not already showing
  // 4. Not showing innings change modal
  // 5. Innings is not complete (all out or 20 overs) — prevents stuck modal on 10th wicket
  const inningsComplete = (state?.wickets ?? 0) >= 10 || state?.status === 'completed';
  useEffect(() => {
    if (state?.can_change_batter && !state?.striker && !showBatterSelect && !showInningsChange && !inningsComplete) {
      queryClient.invalidateQueries({ queryKey: ['available-batters', careerId, fid] });
      setShowBatterSelect(true);
    }
  }, [state?.can_change_batter, state?.striker, showBatterSelect, showInningsChange, inningsComplete, queryClient, careerId, fid]);

  // Auto-dismiss milestone alert after 3 seconds
  useEffect(() => {
    if (milestone) {
      const timer = setTimeout(() => setMilestone(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [milestone]);

  // Check if match is already in progress (skip pre-match and toss)
  // If there's an error (404 - session lost), show toss screen to restart
  useEffect(() => {
    if (state && !isError) {
      setShowPreMatchReview(false);
      setShowToss(false);
    }
    if (isError) {
      setShowPreMatchReview(false);
      setShowToss(true);
      setTossResult(null);
    }
  }, [state, isError]);

  // Handle proceeding from pre-match review to toss
  const handleProceedToToss = () => {
    setShowPreMatchReview(false);
    setShowToss(true);
  };

  // Handle toss election
  const handleElect = (choice: 'bat' | 'bowl') => {
    if (tossResult) {
      // If user won, use their choice. If AI won, AI always bowls first.
      const electedTo = tossResult.user_won_toss ? choice : 'bowl';
      startMutation.mutate({
        tossWinnerId: tossResult.toss_winner_id,
        electedTo,
      });
    }
  };

  // Show pre-match XI review (wait for fixture and XI to load)
  if (showPreMatchReview && !state) {
    if (!fixture || xiLoading) {
      return <Loading fullScreen text="Loading match..." />;
    }
    if (playingXI?.is_set && playingXI.players.length === 11) {
      return (
        <PreMatchXIReview
          players={playingXI.players}
          teamName={fixture.team1_name}
          opponentName={fixture.team2_name}
          fixtureId={fixtureId || ''}
          onProceed={handleProceedToToss}
        />
      );
    }
    // If XI not set, we'll be redirected by the useEffect
    return <Loading fullScreen text="Checking playing XI..." />;
  }

  // Show toss screen (wait for fixture to load first to avoid flicker)
  if (showToss && !state) {
    if (!fixture) {
      return <Loading fullScreen text="Loading match..." />;
    }
    return (
      <>
        {matchError && (
          <div className="fixed top-4 left-4 right-4 z-[70] bg-ball-500/10 border border-ball-500/20 rounded-lg p-3 text-sm text-ball-400 text-center">
            {matchError}
          </div>
        )}
        <TossScreen
          onToss={() => tossMutation.mutate()}
          tossResult={tossResult}
          onElect={handleElect}
          isLoading={tossMutation.isPending || startMutation.isPending}
          team1Name={fixture.team1_name}
          team2Name={fixture.team2_name}
        />
      </>
    );
  }

  if (isLoading && !state) {
    return <Loading fullScreen text="Initializing match..." />;
  }

  if (!state) {
    return <Loading fullScreen text="Starting match..." />;
  }

  const handlePlayBall = () => {
    playBallMutation.mutate({ agg: aggression, delivery: selectedDelivery || undefined });
  };

  const handleBackToDashboard = async () => {
    try {
      // Advance calendar past the match day so dashboard/calendar show the next event
      await calendarApi.advance(careerId!, true);
    } catch {
      // May fail if season ended or no more days — that's fine
    }
    // Invalidate all stale queries so dashboard/calendar reflect the completed match
    queryClient.invalidateQueries({ queryKey: ['calendar-current'] });
    queryClient.invalidateQueries({ queryKey: ['calendar-month'] });
    queryClient.invalidateQueries({ queryKey: ['scheduled-fixtures'] });
    queryClient.invalidateQueries({ queryKey: ['standings'] });
    queryClient.invalidateQueries({ queryKey: ['career'] });
    queryClient.invalidateQueries({ queryKey: ['next-fixture'] });
    queryClient.invalidateQueries({ queryKey: ['leaderboards'] });
    navigate('/dashboard');
  };

  if (state.status === 'completed') {
    // Show enhanced completion screen if we have match result data
    if (matchResult) {
      return (
        <MatchCompletionScreen
          result={matchResult}
          careerId={careerId!}
          fixtureId={fid}
          onBackToDashboard={handleBackToDashboard}
        />
      );
    }

    // Fallback to loading while fetching result
    return <Loading fullScreen text="Loading match result..." />;
  }

  return (
    <ErrorBoundary>
      {/* Milestone Alert */}
      <MilestoneAlert
        type={milestone?.type || 'fifty'}
        playerName={milestone?.playerName || ''}
        detail={milestone?.detail}
        isVisible={!!milestone}
        onClose={() => setMilestone(null)}
      />

      {/* Innings Change Modal */}
      <AnimatePresence>
        {showInningsChange && inningsChangeInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-md w-full text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-pitch-500/20 flex items-center justify-center">
                <span className="text-3xl">2</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">
                Innings Change
              </h2>
              <p className="text-dark-400 mb-4">
                {inningsChangeInfo.battingTeam} need <span className="text-pitch-400 font-bold">{inningsChangeInfo.target} runs</span> to win
              </p>
              <button
                onClick={() => setShowInningsChange(false)}
                className="btn-primary w-full"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bowler Selection Modal */}
      {showBowlerSelect && availableBowlers && !isFetchingBowlers && (
        <BowlerSelection
          bowlers={availableBowlers.bowlers}
          onSelect={(bowlerId) => selectBowlerMutation.mutate(bowlerId)}
          isLoading={selectBowlerMutation.isPending}
          error={selectBowlerMutation.isError ? ((selectBowlerMutation.error as any)?.response?.data?.detail || 'Selection failed') : undefined}
        />
      )}

      {/* Batter Selection Modal */}
      {showBatterSelect && availableBatters && !isFetchingBatters && (
        <BatterSelection
          batters={availableBatters.batters}
          onSelect={(batterId) => selectBatterMutation.mutate(batterId)}
          isLoading={selectBatterMutation.isPending}
          error={selectBatterMutation.isError ? ((selectBatterMutation.error as any)?.response?.data?.detail || 'Selection failed') : undefined}
        />
      )}

      {/* Pitch Reveal */}
      <PitchReveal
        isOpen={showPitchReveal}
        onClose={() => setShowPitchReveal(false)}
        pitchInfo={state.pitch_info}
      />

      {/* Scout Popup */}
      <ScoutPopup
        isOpen={scoutPlayerId !== null}
        onClose={() => setScoutPlayerId(null)}
        playerName={
          scoutPlayerId === state.striker?.id
            ? state.striker?.name || ''
            : state.non_striker?.name || ''
        }
        batterDna={
          scoutPlayerId === state.striker?.id
            ? state.striker?.batting_dna
            : state.non_striker?.batting_dna
        }
      />

      <div className="min-h-screen bg-dark-950 flex flex-col pb-[200px]">
        <ScoreHeader
          state={state}
          team1Name={fixture?.team1_name || 'Team 1'}
          team2Name={fixture?.team2_name || 'Team 2'}
          onScorecardClick={() => setShowScorecard(true)}
        />

        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full space-y-4">
          <BallDisplay
            outcome={lastBall?.outcome}
            commentary={lastBall?.commentary || state.last_ball_commentary}
            deliveryName={lastBall?.delivery_name || state.last_delivery_name}
            contactQuality={lastBall?.contact_quality}
          />

          <MatchupPanel
            striker={state.striker}
            nonStriker={state.non_striker}
            bowler={state.bowler}
            partnershipRuns={state.partnership_runs}
            isUserBatting={state.is_user_batting}
            onScoutBatter={!state.is_user_batting ? setScoutPlayerId : undefined}
          />

          <ThisOver outcomes={state.this_over} />
        </div>

        <TacticsPanel
          aggression={aggression}
          setAggression={setAggression}
          onPlayBall={handlePlayBall}
          onSimulateOver={() => simulateOverMutation.mutate(aggression)}
          onSimulateInnings={() => simulateInningsMutation.mutate()}
          isLoading={playBallMutation.isPending || simulateOverMutation.isPending || simulateInningsMutation.isPending}
          disabled={showBowlerSelect || showBatterSelect || showInningsChange || (state?.can_change_bowler && !state?.bowler) || (state?.can_change_batter && !state?.striker)}
          isUserBatting={state.is_user_batting}
          availableDeliveries={state.available_deliveries}
          selectedDelivery={selectedDelivery}
          onSelectDelivery={setSelectedDelivery}
        />

        {/* Scorecard Drawer */}
        <ScorecardDrawer
          isOpen={showScorecard}
          onClose={() => setShowScorecard(false)}
          scorecard={scorecard || null}
          isLoading={scorecardLoading}
        />
      </div>
    </ErrorBoundary>
  );
}
