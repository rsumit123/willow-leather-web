import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Check,
  AlertCircle,
  Globe,
  Shield,
  Star,
  GripVertical,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { careerApi, type Player } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import { PageHeader } from '../components/common/PageHeader';
import { TraitBadges } from '../components/common/TraitBadge';
import { IntentBadge } from '../components/common/IntentBadge';
import { PlayerDetailModal } from '../components/common/PlayerDetailModal';
import clsx from 'clsx';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ROLE_ORDER = ['wicket_keeper', 'batsman', 'all_rounder', 'bowler'];
const ROLE_LABELS: Record<string, string> = {
  wicket_keeper: 'Wicket Keepers',
  batsman: 'Batsmen',
  all_rounder: 'All-Rounders',
  bowler: 'Bowlers',
};

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

// Batting order item content (shared between sortable and overlay)
function BattingItemContent({
  player,
  position,
  onRemove,
  onShowDetails,
  isDragging = false,
  isOverlay = false,
}: {
  player: Player;
  position: number;
  onRemove?: () => void;
  onShowDetails?: () => void;
  isDragging?: boolean;
  isOverlay?: boolean;
}) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 p-3 rounded-xl border transition-all',
        isOverlay
          ? 'bg-pitch-500/30 border-pitch-500 shadow-2xl shadow-pitch-500/30 scale-105'
          : isDragging
          ? 'bg-dark-800/30 border-dark-600 opacity-50'
          : 'bg-dark-800/50 border-dark-700/50 hover:border-dark-600'
      )}
    >
      {/* Position number */}
      <div className="w-7 h-7 rounded-full bg-dark-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
        {position}
      </div>

      {/* Drag handle */}
      <div className="p-1 rounded text-dark-400 cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Player info - clickable for details */}
      <button
        onClick={onShowDetails}
        className="flex-1 min-w-0 text-left hover:bg-dark-700/30 -my-2 -ml-1 py-2 pl-1 pr-2 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate">{player.name}</span>
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
      </button>

      {/* Stats */}
      <div className="flex items-center gap-2 text-xs flex-shrink-0">
        <div className="text-center">
          <p className={clsx(
            'font-semibold',
            player.batting >= 70 ? 'text-pitch-400' : 'text-dark-300'
          )}>
            {player.batting}
          </p>
          <p className="text-[9px] text-dark-500">BAT</p>
        </div>
        <div className="text-center">
          <p className={clsx(
            'font-semibold',
            player.bowling >= 70 ? 'text-purple-400' : 'text-dark-300'
          )}>
            {player.bowling}
          </p>
          <p className="text-[9px] text-dark-500">BWL</p>
        </div>
      </div>

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1.5 rounded-lg hover:bg-ball-500/20 text-dark-400 hover:text-ball-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Sortable batting order item
function SortableBattingItem({
  player,
  position,
  onRemove,
  onShowDetails,
}: {
  player: Player;
  position: number;
  onRemove: () => void;
  onShowDetails: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <BattingItemContent
        player={player}
        position={position}
        onRemove={onRemove}
        onShowDetails={onShowDetails}
        isDragging={isDragging}
      />
    </div>
  );
}

// Squad player row (for selection)
function SquadPlayerRow({
  player,
  isSelected,
  onAdd,
  onShowDetails,
}: {
  player: Player;
  isSelected: boolean;
  onAdd: () => void;
  onShowDetails: () => void;
}) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 transition-colors rounded-lg',
        isSelected
          ? 'bg-dark-700/30 opacity-50'
          : 'hover:bg-dark-800/50'
      )}
    >
      {/* Add button */}
      <button
        onClick={onAdd}
        disabled={isSelected}
        className={clsx(
          'p-2.5 flex items-center justify-center flex-shrink-0 transition-colors',
          isSelected
            ? 'cursor-not-allowed'
            : 'hover:bg-pitch-500/10'
        )}
      >
        <div
          className={clsx(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
            isSelected
              ? 'bg-pitch-500/50 border-pitch-500/50'
              : 'border-dark-500 hover:border-pitch-500 hover:bg-pitch-500/10'
          )}
        >
          {isSelected ? (
            <Check className="w-3.5 h-3.5 text-white/70" />
          ) : (
            <Plus className="w-3.5 h-3.5 text-dark-400" />
          )}
        </div>
      </button>

      {/* Player info - clickable for details */}
      <button
        onClick={onShowDetails}
        className="flex-1 min-w-0 py-2.5 pr-2 text-left flex items-center gap-2"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={clsx(
              'font-medium truncate text-sm',
              isSelected ? 'text-dark-400' : 'text-white'
            )}>
              {player.name}
            </span>
            {player.is_overseas && (
              <Globe className="w-3 h-3 text-blue-400 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-dark-400 mt-0.5">
            <span>{player.age}y</span>
            {player.role !== 'bowler' && player.batting_intent && (
              <IntentBadge intent={player.batting_intent} compact />
            )}
            {player.traits && player.traits.length > 0 && (
              <TraitBadges traits={player.traits} maxShow={1} compact />
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
          <span className={clsx(
            'font-bold text-sm',
            isSelected ? 'text-dark-400' : 'text-white'
          )}>
            {player.overall_rating}
          </span>
        </div>

        {/* Info icon */}
        <Info className="w-4 h-4 text-dark-500 flex-shrink-0" />
      </button>
    </div>
  );
}

// Collapsible role section
function RoleSection({
  role,
  players,
  selectedIds,
  onAdd,
  onShowDetails,
}: {
  role: string;
  players: Player[];
  selectedIds: number[];
  onAdd: (id: number) => void;
  onShowDetails: (player: Player) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const selectedCount = players.filter(p => selectedIds.includes(p.id)).length;

  return (
    <div className="border border-dark-700/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between bg-dark-800/30 hover:bg-dark-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={clsx(
            'text-xs px-2 py-0.5 rounded border',
            ROLE_COLORS[role]
          )}>
            {ROLE_SHORT[role]}
          </span>
          <span className="font-medium text-white text-sm">{ROLE_LABELS[role]}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-400">
            {selectedCount}/{players.length}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-dark-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-dark-400" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-2 space-y-0.5">
              {players.map((player) => (
                <SquadPlayerRow
                  key={player.id}
                  player={player}
                  isSelected={selectedIds.includes(player.id)}
                  onAdd={() => onAdd(player.id)}
                  onShowDetails={() => onShowDetails(player)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PlayingXIPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { careerId, career } = useGameStore();
  const [battingOrder, setBattingOrder] = useState<number[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Check if we came from pre-match flow
  const returnTo = searchParams.get('returnTo');
  const isPreMatch = returnTo?.startsWith('/match/');

  // Sensors for drag and drop - with better mobile support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get squad
  const { data: squad, isLoading: squadLoading } = useQuery({
    queryKey: ['squad', careerId, career?.user_team_id],
    queryFn: () =>
      careerApi.getSquad(careerId!, career!.user_team_id!).then((r) => r.data),
    enabled: !!careerId && !!career?.user_team_id,
  });

  // Get existing playing XI
  const { data: existingXI, isLoading: xiLoading } = useQuery({
    queryKey: ['playing-xi', careerId],
    queryFn: () => careerApi.getPlayingXI(careerId!).then((r) => r.data),
    enabled: !!careerId,
  });

  // Validate selection (real-time)
  const { data: validation } = useQuery({
    queryKey: ['playing-xi-validation', careerId, battingOrder],
    queryFn: () =>
      careerApi.validatePlayingXI(careerId!, battingOrder).then((r) => r.data),
    enabled: !!careerId && battingOrder.length > 0,
  });

  // Set playing XI mutation
  const setXIMutation = useMutation({
    mutationFn: () => careerApi.setPlayingXI(careerId!, battingOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playing-xi'] });
      // Navigate back to where we came from
      if (returnTo) {
        navigate(returnTo);
      } else {
        navigate('/dashboard');
      }
    },
  });

  // Initialize batting order from existing XI
  useEffect(() => {
    if (existingXI?.is_set && existingXI.players.length > 0) {
      // Players come sorted by position from API
      setBattingOrder(existingXI.players.map((p) => p.id));
    }
  }, [existingXI]);

  // Group players by role
  const playersByRole = useMemo(() => {
    if (!squad?.players) return {};
    const grouped: Record<string, Player[]> = {};
    for (const role of ROLE_ORDER) {
      grouped[role] = squad.players.filter((p) => p.role === role);
    }
    return grouped;
  }, [squad]);

  // Get player by ID
  const getPlayer = (id: number): Player | undefined => {
    return squad?.players.find(p => p.id === id);
  };

  // Add player to batting order
  const addPlayer = (playerId: number) => {
    if (battingOrder.length >= 11) return;
    if (battingOrder.includes(playerId)) return;
    setBattingOrder([...battingOrder, playerId]);
  };

  // Remove player from batting order
  const removePlayer = (playerId: number) => {
    setBattingOrder(battingOrder.filter(id => id !== playerId));
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  // Handle drag end for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = battingOrder.indexOf(active.id as number);
      const newIndex = battingOrder.indexOf(over.id as number);
      setBattingOrder(arrayMove(battingOrder, oldIndex, newIndex));
    }
  };

  // Get the active player for the drag overlay
  const activePlayer = activeId ? getPlayer(activeId) : null;
  const activePosition = activeId ? battingOrder.indexOf(activeId) + 1 : 0;

  if (squadLoading || xiLoading) {
    return <Loading fullScreen text="Loading squad..." />;
  }

  if (!squad) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center">
        <p className="text-dark-400">No squad found</p>
      </div>
    );
  }

  const selectedPlayers = battingOrder.map(id => getPlayer(id)).filter(Boolean) as Player[];
  const overseasSelected = selectedPlayers.filter((p) => p.is_overseas).length;
  const isValid = validation?.valid && battingOrder.length === 11;

  return (
    <>
      <PageHeader
        title={isPreMatch ? "Confirm Playing XI" : "Playing XI"}
        showBack
        backTo={returnTo || "/dashboard"}
      />

      <div className="max-w-4xl mx-auto px-4 py-4 pb-24">
        {/* Two column layout on desktop, stacked on mobile */}
        <div className="grid lg:grid-cols-2 gap-4">

          {/* Left: Batting Order */}
          <div className="order-1 lg:order-1">
            <div className="glass-card p-4 lg:sticky lg:top-4">
              {/* Header with count */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-pitch-500" />
                  Batting Order
                </h2>
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    'text-sm px-2 py-0.5 rounded font-medium',
                    battingOrder.length === 11
                      ? 'bg-pitch-500/20 text-pitch-400'
                      : 'bg-dark-700 text-dark-300'
                  )}>
                    {battingOrder.length}/11
                  </span>
                  <span className={clsx(
                    'text-sm px-2 py-0.5 rounded',
                    overseasSelected > 4
                      ? 'bg-ball-500/20 text-ball-400'
                      : 'bg-blue-500/20 text-blue-400'
                  )}>
                    <Globe className="w-3 h-3 inline mr-1" />
                    {overseasSelected}/4
                  </span>
                </div>
              </div>

              {/* Batting order list with drag and drop */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={battingOrder}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 min-h-[200px]">
                    {battingOrder.length === 0 ? (
                      <div className="text-center py-8 text-dark-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Select players from the squad</p>
                        <p className="text-xs mt-1">Drag to reorder batting positions</p>
                      </div>
                    ) : (
                      battingOrder.map((playerId, index) => {
                        const player = getPlayer(playerId);
                        if (!player) return null;
                        return (
                          <SortableBattingItem
                            key={playerId}
                            player={player}
                            position={index + 1}
                            onRemove={() => removePlayer(playerId)}
                            onShowDetails={() => setSelectedPlayer(player)}
                          />
                        );
                      })
                    )}
                  </div>
                </SortableContext>

                {/* Drag Overlay - this is what follows the cursor/finger */}
                <DragOverlay>
                  {activePlayer && (
                    <BattingItemContent
                      player={activePlayer}
                      position={activePosition}
                      isOverlay
                    />
                  )}
                </DragOverlay>
              </DndContext>

              {/* Validation feedback */}
              {battingOrder.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dark-700/50">
                  {/* Role breakdown */}
                  {validation?.breakdown && (
                    <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                      <div className="bg-purple-500/10 rounded px-2 py-1.5">
                        <p className="text-purple-400 font-bold">
                          {validation.breakdown.wicket_keepers}
                        </p>
                        <p className="text-dark-400">WK</p>
                      </div>
                      <div className="bg-blue-500/10 rounded px-2 py-1.5">
                        <p className="text-blue-400 font-bold">
                          {validation.breakdown.batsmen}
                        </p>
                        <p className="text-dark-400">BAT</p>
                      </div>
                      <div className="bg-emerald-500/10 rounded px-2 py-1.5">
                        <p className="text-emerald-400 font-bold">
                          {validation.breakdown.all_rounders}
                        </p>
                        <p className="text-dark-400">AR</p>
                      </div>
                      <div className="bg-amber-500/10 rounded px-2 py-1.5">
                        <p className="text-amber-400 font-bold">
                          {validation.breakdown.bowlers}
                        </p>
                        <p className="text-dark-400">BWL</p>
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {validation && !validation.valid && validation.errors.length > 0 && (
                    <div className="p-3 bg-ball-500/10 border border-ball-500/30 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-ball-400 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          {validation.errors.map((error, i) => (
                            <p key={i} className="text-sm text-ball-400">
                              {error}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Success */}
                  {isValid && (
                    <div className="p-3 bg-pitch-500/10 border border-pitch-500/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-pitch-400" />
                        <p className="text-sm text-pitch-400">
                          Valid playing XI! Ready to confirm.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Squad Selection */}
          <div className="order-2 lg:order-2 space-y-3">
            <h3 className="text-sm font-medium text-dark-400 uppercase tracking-wider px-1">
              Available Squad
            </h3>
            {ROLE_ORDER.map((role) => {
              const players = playersByRole[role] || [];
              if (players.length === 0) return null;
              return (
                <RoleSection
                  key={role}
                  role={role}
                  players={players}
                  selectedIds={battingOrder}
                  onAdd={addPlayer}
                  onShowDetails={setSelectedPlayer}
                />
              );
            })}
          </div>
        </div>

        {/* Fixed bottom confirm button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-950 via-dark-950 to-transparent">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setXIMutation.mutate()}
              disabled={!isValid || setXIMutation.isPending}
              className={clsx(
                'w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all',
                isValid
                  ? 'btn-primary'
                  : 'bg-dark-700 text-dark-400 cursor-not-allowed'
              )}
            >
              {setXIMutation.isPending ? (
                'Saving...'
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  {isPreMatch ? 'Confirm & Start Match' : 'Confirm Playing XI'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Player Detail Modal */}
      <PlayerDetailModal
        player={selectedPlayer}
        isOpen={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
    </>
  );
}
