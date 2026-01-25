import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchApi, seasonApi, type BallResult, type TossResult } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { ScoreHeader } from '../components/match/ScoreHeader';
import { BallDisplay } from '../components/match/BallDisplay';
import { PlayerStateCard } from '../components/match/PlayerStateCard';
import { ThisOver } from '../components/match/ThisOver';
import { TacticsPanel } from '../components/match/TacticsPanel';
import { TossScreen } from '../components/match/TossScreen';
import { Trophy, Home, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

export function MatchPage() {
  const { fixtureId } = useParams<{ fixtureId: string }>();
  const navigate = useNavigate();
  const { careerId } = useGameStore();
  const queryClient = useQueryClient();
  const [aggression, setAggression] = useState('balanced');
  const [lastBall, setLastBall] = useState<BallResult | null>(null);
  const [showToss, setShowToss] = useState(true);
  const [tossResult, setTossResult] = useState<TossResult | null>(null);
  const [showInningsChange, setShowInningsChange] = useState(false);
  const [inningsChangeInfo, setInningsChangeInfo] = useState<{ target: number; battingTeam: string } | null>(null);

  const fid = parseInt(fixtureId || '0');

  // Fetch fixture details
  const { data: fixture } = useQuery({
    queryKey: ['fixture', careerId, fid],
    queryFn: () => seasonApi.getFixtures(careerId!).then((r) => r.data.find(f => f.id === fid)),
    enabled: !!careerId && !!fid,
  });

  // Fetch match state
  const { data: state, isLoading, isError } = useQuery({
    queryKey: ['match-state', careerId, fid],
    queryFn: () => matchApi.getState(careerId!, fid).then((r) => r.data),
    enabled: !!careerId && !!fid && !showToss,
    refetchInterval: (query) => {
        // Stop polling if match is completed or if there's an error
        if (query.state.error) return false;
        return query.state.data?.status === 'completed' ? false : 2000;
    },
    retry: false, // Don't retry on 404 - session is lost
  });

  // Toss mutation
  const tossMutation = useMutation({
    mutationFn: () => matchApi.doToss(careerId!, fid),
    onSuccess: (response) => {
      setTossResult(response.data);
    },
  });

  // Start match mutation
  const startMutation = useMutation({
    mutationFn: ({ tossWinnerId, electedTo }: { tossWinnerId?: number; electedTo?: string }) =>
      matchApi.startMatch(careerId!, fid, tossWinnerId, electedTo),
    onSuccess: () => {
      setShowToss(false);
      queryClient.invalidateQueries({ queryKey: ['match-state'] });
    },
  });

  // Play ball mutation
  const playBallMutation = useMutation({
    mutationFn: (agg: string) => matchApi.playBall(careerId!, fid, agg),
    onSuccess: (response) => {
      setLastBall(response.data);
      queryClient.setQueryData(['match-state', careerId, fid], response.data.match_state);
      // Check for innings change
      if (response.data.match_state.innings_just_changed) {
        setInningsChangeInfo({
          target: response.data.match_state.target || 0,
          battingTeam: response.data.match_state.batting_team_name
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

  // Check if match is already in progress (skip toss)
  // If there's an error (404 - session lost), show toss screen to restart
  useEffect(() => {
    if (state && !isError) {
      setShowToss(false);
    }
    if (isError) {
      setShowToss(true);
      setTossResult(null);
    }
  }, [state, isError]);

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

  // Show toss screen
  if (showToss && !state) {
    return (
      <TossScreen
        onToss={() => tossMutation.mutate()}
        tossResult={tossResult}
        onElect={handleElect}
        isLoading={tossMutation.isPending || startMutation.isPending}
        team1Name={fixture?.team1_name || 'Team 1'}
        team2Name={fixture?.team2_name || 'Team 2'}
      />
    );
  }

  if (isLoading && !state) {
    return <Loading fullScreen text="Initializing match..." />;
  }

  if (!state) {
    return <Loading fullScreen text="Starting match..." />;
  }

  const handlePlayBall = () => {
    playBallMutation.mutate(aggression);
  };

  if (state.status === 'completed') {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-8 max-w-md w-full"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-yellow-500/20 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Match Over!
          </h1>
          <p className="text-pitch-400 font-bold text-xl mb-4">
            {state.winner_name} won by {state.margin}
          </p>
          
          <div className="space-y-4 pt-4 border-t border-dark-800">
            <div className="flex justify-between text-dark-400">
              <span>Final Score</span>
              <span className="text-white font-bold">{state.runs}/{state.wickets}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary w-full mt-8 flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
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

      <div className="min-h-screen bg-dark-950 flex flex-col pb-[280px]">
        <ScoreHeader
          state={state}
          team1Name={fixture?.team1_name || 'Team 1'}
          team2Name={fixture?.team2_name || 'Team 2'}
        />

        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
          <BallDisplay 
            outcome={lastBall?.outcome} 
            commentary={lastBall?.commentary || state.last_ball_commentary} 
          />

          <div className="px-4 flex gap-3 mb-4">
            <PlayerStateCard player={state.striker} isStriker={true} />
            <PlayerStateCard player={state.non_striker} />
          </div>

          <div className="px-4 mb-4">
            <PlayerStateCard bowler={state.bowler} />
          </div>

          {state.is_collapse && (
            <div className="mx-4 mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400">
              <AlertCircle size={18} />
              <span className="text-sm font-bold uppercase tracking-wider">Collapse Mode Active!</span>
            </div>
          )}

          <ThisOver outcomes={state.this_over} />
        </div>

        <TacticsPanel
          aggression={aggression}
          setAggression={setAggression}
          onPlayBall={handlePlayBall}
          onSimulateOver={() => simulateOverMutation.mutate(aggression)}
          onSimulateInnings={() => simulateInningsMutation.mutate()}
          isLoading={playBallMutation.isPending || simulateOverMutation.isPending || simulateInningsMutation.isPending}
        />
      </div>
    </ErrorBoundary>
  );
}
