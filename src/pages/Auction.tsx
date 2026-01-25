import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gavel,
  Play,
  FastForward,
  User,
  Globe,
  Star,
  TrendingUp,
  CheckCircle,
  XCircle,
  X,
  Sparkles,
  Zap,
  AlertCircle,
  SkipForward,
  List,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auctionApi, careerApi, type Player, type SkipCategoryPlayerResult } from '../api/client';
import { PlayerListDrawer } from '../components/auction/PlayerListDrawer';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { PageHeader } from '../components/common/PageHeader';
import clsx from 'clsx';

// Auction states
type AuctionPhase = 'user_turn' | 'ai_simulation' | 'cap_exceeded' | 'auction_end';

export function AuctionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { careerId, career } = useGameStore();

  // UI States
  const [lastResult, setLastResult] = useState<{
    player: string;
    sold: boolean;
    team?: string;
    price: number;
  } | null>(null);
  const [phase, setPhase] = useState<AuctionPhase>('user_turn');
  const [autoBidEnabled, setAutoBidEnabled] = useState(false);
  const [maxBidCap, setMaxBidCap] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' | 'success' } | null>(null);
  const [capExceededAmount, setCapExceededAmount] = useState<number>(0);
  const [capExceededReason, setCapExceededReason] = useState<'manual_cap' | 'budget_reserve'>('manual_cap');
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [skipResults, setSkipResults] = useState<SkipCategoryPlayerResult[] | null>(null);

  // Ref to track if we're in the middle of a simulation
  const simulationRef = useRef(false);

  // Fetch auction state
  const { data: state, isLoading: stateLoading, refetch: refetchState } = useQuery({
    queryKey: ['auction-state', careerId],
    queryFn: () => auctionApi.getState(careerId!).then((r) => r.data),
    enabled: !!careerId,
  });

  // Fetch teams state
  const { data: teams, refetch: refetchTeams } = useQuery({
    queryKey: ['auction-teams', careerId],
    queryFn: () => auctionApi.getTeamsState(careerId!).then((r) => r.data),
    enabled: !!careerId,
  });

  // Fetch remaining players by category
  const { data: remainingPlayers, refetch: refetchRemainingPlayers } = useQuery({
    queryKey: ['remaining-players', careerId],
    queryFn: () => auctionApi.getRemainingPlayers(careerId!).then((r) => r.data),
    enabled: !!careerId && state?.status === 'in_progress',
  });

  // Start auction
  const startMutation = useMutation({
    mutationFn: () => auctionApi.start(careerId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction-state'] });
      queryClient.invalidateQueries({ queryKey: ['auction-teams'] });
    },
  });

  // Next player
  const nextPlayerMutation = useMutation({
    mutationFn: () => auctionApi.nextPlayer(careerId!),
    onSuccess: (response) => {
      if (response.data.auction_finished) {
        navigate('/dashboard');
      }
      setHasStarted(true);
      setPhase('user_turn');
      setAutoBidEnabled(false);
      setMaxBidCap('');
      queryClient.invalidateQueries({ queryKey: ['auction-state'] });
      queryClient.invalidateQueries({ queryKey: ['auction-teams'] });
    },
  });

  // User bid
  const bidMutation = useMutation({
    mutationFn: () => auctionApi.bid(careerId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction-state'] });
      queryClient.invalidateQueries({ queryKey: ['auction-teams'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Cannot place bid';
      showToast(message, 'error');
      setAutoBidEnabled(false);
    },
  });

  // Simulate AI bidding round
  const simulateMutation = useMutation({
    mutationFn: () => auctionApi.simulateBidding(careerId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction-state'] });
      queryClient.invalidateQueries({ queryKey: ['auction-teams'] });
    },
  });

  // Finalize player
  const finalizeMutation = useMutation({
    mutationFn: () => auctionApi.finalizePlayer(careerId!),
    onSuccess: (response) => {
      const result = response.data;
      setLastResult({
        player: result.player_name,
        sold: result.is_sold,
        team: result.sold_to_team_name || undefined,
        price: result.sold_price,
      });
      setPhase('auction_end');
      setAutoBidEnabled(false);
      simulationRef.current = false;
      queryClient.invalidateQueries({ queryKey: ['auction-state'] });
      queryClient.invalidateQueries({ queryKey: ['auction-teams'] });
    },
  });

  // Auto-complete
  const autoCompleteMutation = useMutation({
    mutationFn: () => auctionApi.autoComplete(careerId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction-state'] });
      queryClient.invalidateQueries({ queryKey: ['auction-teams'] });
      queryClient.invalidateQueries({ queryKey: ['career'] });
      navigate('/dashboard');
    },
  });

  // Skip category mutation
  const skipCategoryMutation = useMutation({
    mutationFn: (category: string) => auctionApi.skipCategory(careerId!, category),
    onSuccess: (response) => {
      setSkipResults(response.data.results);
      queryClient.invalidateQueries({ queryKey: ['auction-state'] });
      queryClient.invalidateQueries({ queryKey: ['auction-teams'] });
      queryClient.invalidateQueries({ queryKey: ['remaining-players'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to skip category';
      showToast(message, 'error');
    },
  });

  // Quick pass mutation
  const quickPassMutation = useMutation({
    mutationFn: () => auctionApi.quickPass(careerId!),
    onSuccess: (response) => {
      const result = response.data;
      setLastResult({
        player: result.player_name,
        sold: result.is_sold,
        team: result.sold_to_team_name || undefined,
        price: result.sold_price,
      });
      setPhase('auction_end');
      setAutoBidEnabled(false);
      simulationRef.current = false;
      queryClient.invalidateQueries({ queryKey: ['auction-state'] });
      queryClient.invalidateQueries({ queryKey: ['auction-teams'] });
      queryClient.invalidateQueries({ queryKey: ['remaining-players'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to quick pass';
      showToast(message, 'error');
    },
  });

  // Get user team state
  const userTeamState = teams?.find((t) => career?.user_team?.short_name === t.team_name);

  // Calculate max affordable bid
  const calculateMaxAffordable = () => {
    if (!userTeamState) return 0;
    const minPlayersNeeded = Math.max(0, 18 - userTeamState.total_players);
    const reservedAmount = minPlayersNeeded * 5000000; // 50L per player minimum
    return Math.max(0, userTeamState.remaining_budget - reservedAmount);
  };

  // Parse max bid cap from input
  const parseMaxBidCap = (): number => {
    if (!maxBidCap.trim()) return calculateMaxAffordable();
    const value = parseFloat(maxBidCap);
    if (isNaN(value)) return calculateMaxAffordable();
    return value * 10000000; // Convert crore to rupees
  };

  // Show toast message
  const showToast = (message: string, type: 'error' | 'info' | 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle user bid with auto-bid logic
  const handleBid = async () => {
    try {
      await bidMutation.mutateAsync();

      // If auto-bid enabled, start simulation loop
      if (autoBidEnabled) {
        setPhase('ai_simulation');
        runAutoBidLoop();
      }
    } catch (error) {
      // Error handled in mutation onError
    }
  };

  // Auto-bid loop
  const runAutoBidLoop = async () => {
    simulationRef.current = true;
    let consecutiveWinningRounds = 0;

    while (simulationRef.current) {
      await new Promise(resolve => setTimeout(resolve, 600)); // 0.6s delay

      if (!simulationRef.current) break;

      // Refresh state
      const { data: currentState } = await refetchState();
      const { data: currentTeams } = await refetchTeams();

      if (!currentState || !currentState.current_player) {
        simulationRef.current = false;
        break;
      }

      // Check if user is highest bidder
      if (currentState.current_bidder_team_name === career?.user_team?.short_name) {
        // User is winning, simulate AI to see if they outbid
        const previousBid = currentState.current_bid;
        const previousBidder = currentState.current_bidder_team_id;

        await simulateMutation.mutateAsync();

        // Check if AI actually bid
        const { data: afterSimState } = await refetchState();

        if (afterSimState?.current_bidder_team_id === previousBidder &&
            afterSimState?.current_bid === previousBid) {
          // No one outbid user - they won!
          consecutiveWinningRounds++;

          if (consecutiveWinningRounds >= 2) {
            // User has won the auction - finalize automatically
            showToast('You won the auction!', 'success');
            simulationRef.current = false;
            setAutoBidEnabled(false);
            await finalizeMutation.mutateAsync();
            break;
          }
        } else {
          consecutiveWinningRounds = 0;
        }
        continue;
      }

      // Reset winning counter since user is not highest bidder
      consecutiveWinningRounds = 0;

      // Validate if user can still bid
      const userState = currentTeams?.find((t) => career?.user_team?.short_name === t.team_name);
      if (!userState) {
        simulationRef.current = false;
        break;
      }

      const nextBid = currentState.current_bid + getBidIncrement(currentState.current_bid);
      const maxCap = parseMaxBidCap();

      // Check if we should continue auto-bidding
      if (nextBid > userState.max_bid_possible) {
        showToast('Budget reserve limit reached', 'info');
        setAutoBidEnabled(false);
        setCapExceededAmount(nextBid);
        setCapExceededReason('budget_reserve');
        setPhase('cap_exceeded');
        simulationRef.current = false;
        break;
      }

      if (nextBid > maxCap) {
        // Manual cap exceeded - show options to user
        setAutoBidEnabled(false);
        setCapExceededAmount(nextBid);
        setCapExceededReason('manual_cap');
        setPhase('cap_exceeded');
        simulationRef.current = false;
        break;
      }

      // Place bid
      try {
        await bidMutation.mutateAsync();
      } catch (error) {
        setAutoBidEnabled(false);
        setPhase('user_turn');
        simulationRef.current = false;
        break;
      }
    }
  };

  // Get bid increment based on current bid
  const getBidIncrement = (currentBid: number): number => {
    if (currentBid >= 150000000) return 10000000; // 1 crore
    if (currentBid >= 100000000) return 5000000;  // 50 lakh
    if (currentBid >= 50000000) return 2500000;   // 25 lakh
    if (currentBid >= 10000000) return 1000000;   // 10 lakh
    return 500000; // 5 lakh
  };

  // Load team players when modal opens
  useEffect(() => {
    if (selectedTeamId && careerId) {
      careerApi.getSquad(careerId, selectedTeamId).then((response) => {
        setTeamPlayers(response.data.players);
      });
    }
  }, [selectedTeamId, careerId]);

  // Reset phase when player changes
  useEffect(() => {
    if (state?.current_player) {
      setPhase('user_turn');
    }
  }, [state?.current_player?.id]);

  // Format price
  const formatPrice = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    return `₹${((amount || 0) / 100000).toFixed(0)} L`;
  };

  // Get player type display
  const getPlayerType = (role: string, bowlingType: string) => {
    if (role === 'bowler') {
      const typeMap: Record<string, string> = {
        pace: 'Fast Bowler',
        medium: 'Medium Pacer',
        off_spin: 'Off Spinner',
        leg_spin: 'Leg Spinner',
        left_arm_spin: 'Left-Arm Spinner',
      };
      return typeMap[bowlingType] || 'Bowler';
    }
    return role.replace('_', ' ');
  };

  if (!careerId) {
    navigate('/');
    return null;
  }

  if (stateLoading || autoCompleteMutation.isPending) {
    return <Loading fullScreen text={autoCompleteMutation.isPending ? "Completing auction..." : "Loading auction..."} />;
  }

  // Not started state
  if (state?.status === 'not_started') {
    return (
      <>
        <PageHeader title="Auction" />
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-8 max-w-md w-full text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-pitch-500/20 to-pitch-600/20 flex items-center justify-center">
              <Gavel className="w-10 h-10 text-pitch-500" />
            </div>

            <h1 className="text-2xl font-display font-bold text-white mb-2">
              Mega Auction
            </h1>
            <p className="text-dark-400 mb-6">
              Build your dream squad! You have ₹90 Cr to bid on 150+ players.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start Auction
              </button>

              <button
                onClick={() => autoCompleteMutation.mutate()}
                disabled={autoCompleteMutation.isPending}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <FastForward className="w-5 h-5" />
                Auto-Complete (Skip)
              </button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  // Completed state
  if (state?.status === 'completed') {
    navigate('/dashboard');
    return null;
  }

  const isUserHighestBidder = state?.current_bidder_team_name === career?.user_team?.short_name;
  const nextBidAmount = state?.current_bid ? state.current_bid + getBidIncrement(state.current_bid) : 0;
  const canAffordNextBid = userTeamState ? nextBidAmount <= userTeamState.max_bid_possible : false;

  return (
    <>
      <PageHeader title="Auction" />
      <div className="min-h-screen bg-dark-950 flex flex-col">
        {/* Header */}
        <header className="sticky top-14 z-30 bg-dark-950/90 backdrop-blur-lg border-b border-dark-800">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPlayerList(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <List className="w-4 h-4 text-pitch-400" />
                  <span className="text-xs text-dark-300">Players</span>
                </button>
                <p className="text-xs text-dark-400">
                  {state?.players_sold || 0} sold • {state?.players_unsold || 0} unsold
                </p>
              </div>

              {userTeamState && (
                <div className="text-right">
                  <p className={clsx(
                    'font-bold',
                    userTeamState.remaining_budget < 50000000 ? 'text-ball-400' : 'text-pitch-400'
                  )}>
                    {formatPrice(userTeamState.remaining_budget)}
                  </p>
                  <p className="text-xs text-dark-400">
                    {userTeamState.total_players}/25 players
                  </p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg mx-auto px-4 pt-4"
            >
              <div className={clsx(
                'border rounded-lg p-3 flex items-center gap-2',
                toast.type === 'error' && 'bg-ball-500/20 border-ball-500/30',
                toast.type === 'info' && 'bg-blue-500/20 border-blue-500/30',
                toast.type === 'success' && 'bg-pitch-500/20 border-pitch-500/30'
              )}>
                {toast.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 text-pitch-500" />
                ) : (
                  <AlertCircle className={clsx('w-5 h-5 flex-shrink-0', toast.type === 'error' ? 'text-ball-500' : 'text-blue-500')} />
                )}
                <p className={clsx(
                  'text-sm',
                  toast.type === 'error' && 'text-ball-300',
                  toast.type === 'info' && 'text-blue-300',
                  toast.type === 'success' && 'text-pitch-300'
                )}>{toast.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Player */}
        <div className="flex-1 px-4 py-6">
          <AnimatePresence mode="wait">
            {state?.current_player ? (
              <motion.div
                key={state.current_player.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Player card */}
                <div className="glass-card p-6 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center">
                    <User className="w-10 h-10 text-dark-400" />
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h2 className="text-2xl font-display font-bold text-white">
                      {state.current_player.name}
                    </h2>
                    {state.current_player.is_overseas && (
                      <Globe className="w-5 h-5 text-blue-400" />
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-3 mb-3">
                    <span className="badge badge-blue capitalize">
                      {getPlayerType(state.current_player.role, state.current_player.bowling_type)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold">
                        {state.current_player.overall_rating}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-dark-400">
                    Base: {formatPrice(state.current_player.base_price)}
                  </p>
                </div>

                {/* Current bid */}
                <motion.div
                  key={state.current_bid}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  <p className="text-dark-400 text-sm mb-1">Current Bid</p>
                  <p className="text-4xl font-display font-bold text-pitch-400">
                    {formatPrice(state.current_bid)}
                  </p>
                  {state.current_bidder_team_name && (
                    <p className="text-dark-300 mt-2">
                      by{' '}
                      <span className={clsx(
                        'font-semibold',
                        isUserHighestBidder ? 'text-pitch-400' : 'text-white'
                      )}>
                        {state.current_bidder_team_name}
                        {isUserHighestBidder && ' (You)'}
                      </span>
                    </p>
                  )}
                </motion.div>

                {/* Phase indicator */}
                {phase === 'ai_simulation' && (
                  <div className="text-center py-2">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-blue-400 text-sm font-medium">
                        {autoBidEnabled ? 'Auto-Bidding...' : 'AI Teams Bidding...'}
                      </span>
                    </div>
                  </div>
                )}

                {phase === 'cap_exceeded' && (
                  <div className="text-center py-2">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <span className="text-amber-400 text-sm font-medium">
                        Your Action Required
                      </span>
                    </div>
                  </div>
                )}

                {/* Auto Bid Controls - Only show in user_turn phase */}
                {phase === 'user_turn' && (
                  <div className="glass-card p-4 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoBidEnabled}
                        onChange={(e) => setAutoBidEnabled(e.target.checked)}
                        className="w-5 h-5 rounded border-dark-600 bg-dark-800 text-pitch-500 focus:ring-pitch-500 focus:ring-offset-dark-900"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-pitch-500" />
                          <span className="font-medium text-white">Auto-Bid</span>
                        </div>
                        <p className="text-xs text-dark-400 mt-0.5">
                          Automatically bid until you win or hit the cap
                        </p>
                      </div>
                    </label>

                    {autoBidEnabled && (
                      <div className="flex items-center gap-2 pt-2 border-t border-dark-700">
                        <label className="text-sm text-dark-400">Max Cap:</label>
                        <div className="flex-1 flex items-center">
                          <span className="text-dark-400 text-sm mr-1">₹</span>
                          <input
                            type="number"
                            value={maxBidCap}
                            onChange={(e) => setMaxBidCap(e.target.value)}
                            placeholder={((calculateMaxAffordable() || 0) / 10000000).toFixed(1)}
                            className="flex-1 bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-pitch-500"
                          />
                          <span className="text-dark-400 text-sm ml-1">Cr</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  {phase === 'user_turn' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleBid}
                          disabled={bidMutation.isPending || isUserHighestBidder || !canAffordNextBid}
                          className={clsx(
                            "flex flex-col items-center justify-center gap-1 py-3",
                            canAffordNextBid ? "btn-primary" : "btn-secondary opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            <span>Bid</span>
                          </div>
                          <span className="text-xs opacity-75">
                            {formatPrice(nextBidAmount)}
                          </span>
                        </button>

                        <button
                          onClick={() => quickPassMutation.mutate()}
                          disabled={quickPassMutation.isPending || simulateMutation.isPending}
                          className="btn-secondary flex items-center justify-center gap-2"
                        >
                          <SkipForward className="w-5 h-5" />
                          {quickPassMutation.isPending ? 'AI Bidding...' : 'Pass'}
                        </button>
                      </div>

                      {!canAffordNextBid && !isUserHighestBidder && (
                        <p className="text-center text-amber-400 text-sm">
                          Can't bid - need to reserve ₹2Cr per slot for min squad ({Math.max(0, 18 - (userTeamState?.total_players || 0))} slots left)
                        </p>
                      )}

                      {isUserHighestBidder && (
                        <p className="text-center text-pitch-400 text-sm">
                          You're the highest bidder! Wait for AI or finalize.
                        </p>
                      )}

                      {/* Manual next bid for testing */}
                      <button
                        onClick={() => simulateMutation.mutate()}
                        disabled={simulateMutation.isPending}
                        className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                      >
                        <Play className="w-4 h-4" />
                        Simulate AI Bid
                      </button>
                    </>
                  )}

                  {phase === 'cap_exceeded' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-card p-4 border-2 border-amber-500/50 bg-amber-500/10"
                    >
                      {capExceededReason === 'budget_reserve' ? (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                            <p className="font-semibold text-amber-400">Budget Reserve Limit</p>
                          </div>
                          <p className="text-sm text-dark-300 mb-2">
                            You need to reserve funds for your minimum squad (18 players).
                          </p>
                          <div className="bg-dark-800/50 rounded-lg p-3 mb-4 text-sm">
                            <div className="flex justify-between mb-1">
                              <span className="text-dark-400">Your purse:</span>
                              <span className="text-white">{formatPrice(userTeamState?.remaining_budget || 0)}</span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="text-dark-400">Players owned:</span>
                              <span className="text-white">{userTeamState?.total_players || 0}/18 min</span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="text-dark-400">Slots to fill:</span>
                              <span className="text-white">{Math.max(0, 18 - (userTeamState?.total_players || 0))}</span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="text-dark-400">Reserved (₹2Cr/slot):</span>
                              <span className="text-ball-400">-{formatPrice(Math.max(0, 18 - (userTeamState?.total_players || 0) - 1) * 20000000)}</span>
                            </div>
                            <div className="border-t border-dark-700 mt-2 pt-2 flex justify-between">
                              <span className="text-dark-400">Max bid possible:</span>
                              <span className="text-pitch-400 font-semibold">{formatPrice(userTeamState?.max_bid_possible || 0)}</span>
                            </div>
                          </div>
                          <p className="text-xs text-dark-500 mb-4">
                            Buy more players at base price to free up your bidding power, or pass on this player.
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                            <p className="font-semibold text-amber-400">Auto-Bid Cap Reached</p>
                          </div>
                          <p className="text-sm text-dark-300 mb-4">
                            Bidding has exceeded your auto-bid cap of {formatPrice(parseMaxBidCap())}.
                            Next bid would be {formatPrice(capExceededAmount)}.
                          </p>

                          <div className="flex items-center gap-2 mb-3">
                            <label className="text-sm text-dark-400 whitespace-nowrap">New Cap:</label>
                            <div className="flex-1 flex items-center">
                              <span className="text-dark-400 text-sm mr-1">₹</span>
                              <input
                                type="number"
                                value={maxBidCap}
                                onChange={(e) => setMaxBidCap(e.target.value)}
                                placeholder={((capExceededAmount || 0) / 10000000 + 1).toFixed(1)}
                                className="flex-1 bg-dark-800 border-2 border-amber-500/50 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-amber-500"
                              />
                              <span className="text-dark-400 text-sm ml-1">Cr</span>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {capExceededReason === 'manual_cap' && (
                            <button
                              onClick={() => {
                                setAutoBidEnabled(true);
                                setPhase('ai_simulation');
                                runAutoBidLoop();
                              }}
                              className="btn-primary py-3 flex items-center justify-center gap-2 ring-2 ring-pitch-400/50 animate-pulse"
                            >
                              <Zap className="w-4 h-4" />
                              Continue Bidding
                            </button>
                          )}

                          <button
                            onClick={() => quickPassMutation.mutate()}
                            disabled={quickPassMutation.isPending}
                            className={clsx(
                              "btn-secondary py-3 flex items-center justify-center gap-2",
                              capExceededReason === 'budget_reserve' && "col-span-2"
                            )}
                          >
                            <SkipForward className="w-4 h-4" />
                            {quickPassMutation.isPending ? 'AI Bidding...' : 'Pass on Player'}
                          </button>
                        </div>

                        <button
                          onClick={() => setPhase('user_turn')}
                          className="w-full text-center text-dark-400 text-sm py-2 hover:text-dark-300"
                        >
                          ← Back to manual bidding
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {phase === 'ai_simulation' && !autoBidEnabled && (
                    <div className="text-center text-dark-400 text-sm">
                      AI teams are bidding... please wait.
                    </div>
                  )}

                  {(phase === 'user_turn' && state.current_bidder_team_id) && (
                    <button
                      onClick={() => finalizeMutation.mutate()}
                      disabled={finalizeMutation.isPending}
                      className="btn-secondary w-full"
                    >
                      {finalizeMutation.isPending ? 'Finalizing...' : 'Finalize Sale'}
                    </button>
                  )}

                  {phase !== 'cap_exceeded' && (
                    <button
                      onClick={() => autoCompleteMutation.mutate()}
                      disabled={autoCompleteMutation.isPending}
                      className="w-full text-center text-dark-400 text-sm py-2 hover:text-dark-300"
                    >
                      Skip to end of auction →
                    </button>
                  )}
                </div>
              </motion.div>
            ) : phase === 'auction_end' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 text-center py-12"
              >
                <div className="glass-card p-6 max-w-md mx-auto">
                  {lastResult && (
                    <>
                      <div className={clsx(
                        'w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center',
                        lastResult.sold ? 'bg-pitch-500/20' : 'bg-ball-500/20'
                      )}>
                        {lastResult.sold ? (
                          <CheckCircle className="w-8 h-8 text-pitch-500" />
                        ) : (
                          <XCircle className="w-8 h-8 text-ball-500" />
                        )}
                      </div>
                      <h2 className="text-xl font-semibold text-white mb-2">
                        {lastResult.player}
                      </h2>
                      <p className="text-dark-400 mb-6">
                        {lastResult.sold
                          ? `Sold to ${lastResult.team} for ${formatPrice(lastResult.price)}`
                          : 'Unsold'}
                      </p>
                    </>
                  )}
                  <button
                    onClick={() => nextPlayerMutation.mutate()}
                    disabled={nextPlayerMutation.isPending}
                    className="btn-primary"
                  >
                    {nextPlayerMutation.isPending ? 'Loading...' : 'Next Player'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 text-center py-12"
              >
                <div className="glass-card p-6 max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-pitch-500/20 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-pitch-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    {!hasStarted ? 'Welcome to the Auction!' : 'Next Player'}
                  </h2>
                  <p className="text-dark-400 text-sm mb-6">
                    {!hasStarted
                      ? 'Ready to start bidding? Click the button below to bring the first player on stage.'
                      : 'Click to bring the next player on stage.'}
                  </p>
                  <button
                    onClick={() => nextPlayerMutation.mutate()}
                    disabled={nextPlayerMutation.isPending}
                    className="btn-primary"
                  >
                    {nextPlayerMutation.isPending ? 'Loading...' : (!hasStarted ? 'Bring First Player' : 'Next Player')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Teams overview */}
        {teams && teams.length > 0 && (
          <div className="border-t border-dark-800 bg-dark-900/50 p-4 safe-bottom">
            <div className="max-w-lg mx-auto">
              <p className="text-xs text-dark-400 mb-2">Teams (tap to view squad)</p>
              <div className="grid grid-cols-4 gap-2">
                {teams.map((team) => (
                  <button
                    key={team.team_id}
                    onClick={() => setSelectedTeamId(team.team_id)}
                    className={clsx(
                      'text-center p-2 rounded-lg transition-all',
                      career?.user_team?.short_name === team.team_name
                        ? 'bg-pitch-500/20 ring-1 ring-pitch-500/50'
                        : 'bg-dark-800/50 hover:bg-dark-800'
                    )}
                  >
                    <p className="font-bold text-sm">{team.team_name}</p>
                    <p className="text-xs text-dark-400">{team.total_players}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Team Players Modal */}
        <AnimatePresence>
          {selectedTeamId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
              onClick={() => setSelectedTeamId(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-card p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    {teams?.find((t) => t.team_id === selectedTeamId)?.team_name} Squad
                  </h2>
                  <button
                    onClick={() => setSelectedTeamId(null)}
                    className="p-1 hover:bg-dark-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {teamPlayers.length === 0 ? (
                  <p className="text-dark-400 text-center py-8">No players purchased yet</p>
                ) : (
                  <div className="space-y-2">
                    {teamPlayers
                      .sort((a, b) => b.overall_rating - a.overall_rating)
                      .map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white">{player.name}</p>
                              {player.is_overseas && (
                                <Globe className="w-3 h-3 text-blue-400" />
                              )}
                            </div>
                            <p className="text-xs text-dark-400 capitalize">
                              {getPlayerType(player.role, player.bowling_type)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-bold">{player.overall_rating}</span>
                            </div>
                            <p className="text-xs text-dark-400">
                              {formatPrice(player.sold_price || 0)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player List Drawer */}
        <PlayerListDrawer
          isOpen={showPlayerList}
          onClose={() => setShowPlayerList(false)}
          categories={remainingPlayers?.categories || {}}
          counts={remainingPlayers?.counts || {}}
          sold={remainingPlayers?.sold || {}}
          soldCounts={remainingPlayers?.sold_counts || {}}
          currentCategory={remainingPlayers?.current_category || null}
          currentPlayerId={remainingPlayers?.current_player_id || null}
          onSkipCategory={(category) => skipCategoryMutation.mutate(category)}
          isSkipping={skipCategoryMutation.isPending}
          skipResults={skipResults}
          onClearResults={() => {
            setSkipResults(null);
            refetchState();
            refetchTeams();
            refetchRemainingPlayers();
          }}
        />
      </div>
    </>
  );
}
