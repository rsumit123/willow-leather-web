import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  ChevronDown,
  Star,
  Globe,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Gavel,
  TrendingUp,
} from 'lucide-react';
import clsx from 'clsx';
import type { PlayerBrief, SkipCategoryPlayerResult, SoldPlayerBrief } from '../../api/client';
import { formatPrice as formatPriceUtil, getPlayerType as getPlayerTypeUtil } from '../../utils/format';

interface PlayerListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Record<string, PlayerBrief[]>;
  counts: Record<string, number>;
  sold: Record<string, SoldPlayerBrief[]>;
  soldCounts: Record<string, number>;
  currentCategory: string | null;
  currentPlayerId: number | null;
  onSkipCategory: (category: string) => void;
  isSkipping: boolean;
  skipResults: SkipCategoryPlayerResult[] | null;
  onClearResults: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  marquee: 'Marquee',
  batsmen: 'Batsmen',
  bowlers: 'Bowlers',
  all_rounders: 'All-Rounders',
  wicket_keepers: 'Wicket-Keepers',
};

const CATEGORY_ORDER = ['marquee', 'batsmen', 'bowlers', 'all_rounders', 'wicket_keepers'];

export function PlayerListDrawer({
  isOpen,
  onClose,
  categories,
  counts,
  sold,
  soldCounts,
  currentCategory,
  currentPlayerId,
  onSkipCategory,
  isSkipping,
  skipResults,
  onClearResults,
}: PlayerListDrawerProps) {
  const [activeTab, setActiveTab] = useState<string>(currentCategory || 'marquee');
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [showAllResults, setShowAllResults] = useState(false);

  // Update active tab when current category changes
  useEffect(() => {
    if (currentCategory && isOpen) {
      setActiveTab(currentCategory);
    }
  }, [currentCategory, isOpen]);

  const formatPrice = (amount: number) => formatPriceUtil(amount, { prefix: false });
  const getPlayerType = (role: string, bowlingType?: string) => getPlayerTypeUtil(role, bowlingType, { short: true });

  const handleSkipClick = (category: string) => {
    setShowConfirm(category);
  };

  const handleConfirmSkip = () => {
    if (showConfirm) {
      onSkipCategory(showConfirm);
      setShowConfirm(null);
    }
  };

  // Get category status
  const getCategoryStatus = (cat: string) => {
    const remaining = counts[cat] || 0;
    const soldCount = soldCounts[cat] || 0;
    if (remaining === 0 && soldCount > 0) return 'completed';
    if (cat === currentCategory) return 'active';
    if (remaining > 0) return 'pending';
    return 'empty';
  };

  // All categories that have any players (remaining or sold)
  const allCategories = CATEGORY_ORDER.filter(
    cat => (counts[cat] || 0) > 0 || (soldCounts[cat] || 0) > 0
  );

  const remainingPlayers = categories[activeTab] || [];
  const soldPlayers = sold[activeTab] || [];
  const isActiveCategory = activeTab === currentCategory;
  const categoryStatus = getCategoryStatus(activeTab);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-dark-900 shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-pitch-500" />
                <h2 className="text-lg font-semibold text-white">Auction Players</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Category Indicator */}
            {currentCategory && (
              <div className="px-4 py-2 bg-pitch-500/10 border-b border-pitch-500/20">
                <div className="flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-pitch-400" />
                  <span className="text-sm text-pitch-400">
                    Currently auctioning: <span className="font-semibold text-pitch-300">{CATEGORY_LABELS[currentCategory]}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Skip Results Modal */}
            <AnimatePresence>
              {skipResults && (() => {
                const soldResults = skipResults.filter(r => r.is_sold);
                const unsoldResults = skipResults.filter(r => !r.is_sold);
                const totalSpend = soldResults.reduce((sum, r) => sum + r.sold_price, 0);
                const topBuys = [...soldResults].sort((a, b) => b.sold_price - a.sold_price).slice(0, 3);
                const shouldCollapse = skipResults.length > 6;

                return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 bg-dark-900/95 flex flex-col"
                >
                  <div className="flex items-center justify-between p-4 border-b border-dark-800">
                    <h3 className="text-lg font-semibold text-white">Category Completed</h3>
                    <button
                      onClick={onClearResults}
                      className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* S2: Summary stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-pitch-500/10 border border-pitch-500/20 text-center">
                        <p className="text-2xl font-bold text-pitch-400">{soldResults.length}</p>
                        <p className="text-xs text-dark-400">Sold</p>
                        {totalSpend > 0 && (
                          <p className="text-xs text-pitch-500 font-medium mt-1">{formatPrice(totalSpend)}</p>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-ball-500/10 border border-ball-500/20 text-center">
                        <p className="text-2xl font-bold text-ball-400">{unsoldResults.length}</p>
                        <p className="text-xs text-dark-400">Unsold</p>
                      </div>
                    </div>

                    {/* Top buys */}
                    {topBuys.length > 0 && (
                      <div className="p-3 bg-dark-800/50 rounded-lg">
                        <div className="flex items-center gap-1.5 mb-2">
                          <TrendingUp className="w-3.5 h-3.5 text-pitch-400" />
                          <p className="text-xs text-dark-400 font-medium">Top Buys</p>
                        </div>
                        <div className="space-y-1.5">
                          {topBuys.map((r) => (
                            <div key={r.player_id} className="flex items-center justify-between">
                              <span className="text-sm text-white">{r.player_name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-dark-500">{r.sold_to_team_name}</span>
                                <span className="text-xs text-pitch-400 font-semibold">{formatPrice(r.sold_price)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* S3: Expandable full results */}
                    {shouldCollapse && (
                      <button
                        onClick={() => setShowAllResults(!showAllResults)}
                        className="flex items-center gap-1.5 text-xs text-dark-400 hover:text-dark-300 transition-colors w-full justify-center"
                      >
                        <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform', showAllResults && 'rotate-180')} />
                        {showAllResults ? 'Hide details' : `Show all ${skipResults.length} results`}
                      </button>
                    )}

                    {(!shouldCollapse || showAllResults) && (
                      <div className="space-y-4">
                        {/* Sold section */}
                        {soldResults.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                              Sold ({soldResults.length})
                            </h4>
                            <div className="space-y-1.5">
                              {soldResults.map((result) => (
                                <div
                                  key={result.player_id}
                                  className="flex items-center justify-between p-2.5 rounded-lg bg-pitch-500/10"
                                >
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-3.5 h-3.5 text-pitch-500" />
                                    <span className="text-sm text-white">{result.player_name}</span>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-pitch-400 font-medium">{formatPrice(result.sold_price)}</p>
                                    <p className="text-[10px] text-dark-500">{result.sold_to_team_name}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Unsold section */}
                        {unsoldResults.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                              Unsold ({unsoldResults.length})
                            </h4>
                            <div className="space-y-1.5">
                              {unsoldResults.map((result) => (
                                <div
                                  key={result.player_id}
                                  className="flex items-center justify-between p-2.5 rounded-lg bg-ball-500/10"
                                >
                                  <div className="flex items-center gap-2">
                                    <XCircle className="w-3.5 h-3.5 text-ball-500" />
                                    <span className="text-sm text-dark-300">{result.player_name}</span>
                                  </div>
                                  <p className="text-xs text-ball-400">Unsold</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-dark-800">
                    <button
                      onClick={() => {
                        setShowAllResults(false);
                        onClearResults();
                      }}
                      className="btn-primary w-full"
                    >
                      Continue Auction
                    </button>
                  </div>
                </motion.div>
                );
              })()}
            </AnimatePresence>

            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-dark-800 px-2">
              {allCategories.map((cat) => {
                const status = getCategoryStatus(cat);
                const remaining = counts[cat] || 0;
                const soldCount = soldCounts[cat] || 0;

                return (
                  <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={clsx(
                      'flex-shrink-0 px-3 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-1.5',
                      activeTab === cat
                        ? 'border-pitch-500 text-pitch-400'
                        : 'border-transparent text-dark-400 hover:text-white'
                    )}
                  >
                    {status === 'active' && (
                      <span className="w-2 h-2 bg-pitch-500 rounded-full animate-pulse" />
                    )}
                    {status === 'completed' && (
                      <CheckCircle className="w-3 h-3 text-pitch-500" />
                    )}
                    <span>{CATEGORY_LABELS[cat]}</span>
                    <span className="text-xs opacity-60">
                      ({remaining}{soldCount > 0 ? `/${remaining + soldCount}` : ''})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Player List */}
            <div className="flex-1 overflow-y-auto p-4">
              {isSkipping ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-12 h-12 border-4 border-pitch-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-dark-400">Auctioning players...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Remaining Players */}
                  {remainingPlayers.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                        Remaining ({remainingPlayers.length})
                      </h4>
                      <div className="space-y-2">
                        {remainingPlayers.map((player) => {
                          const isCurrentPlayer = player.id === currentPlayerId;
                          return (
                            <div
                              key={player.id}
                              className={clsx(
                                'flex items-center justify-between p-3 rounded-lg transition-colors',
                                isCurrentPlayer
                                  ? 'bg-pitch-500/20 ring-2 ring-pitch-500/50'
                                  : 'bg-dark-800/50 hover:bg-dark-800'
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {isCurrentPlayer && (
                                    <Gavel className="w-4 h-4 text-pitch-400 flex-shrink-0" />
                                  )}
                                  <p className={clsx(
                                    'font-medium truncate',
                                    isCurrentPlayer ? 'text-pitch-300' : 'text-white'
                                  )}>
                                    {player.name}
                                  </p>
                                  {player.is_overseas && (
                                    <Globe className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-dark-400">
                                  {getPlayerType(player.role, player.bowling_type)}
                                  {isCurrentPlayer && <span className="text-pitch-400 ml-2">• Now Bidding</span>}
                                </p>
                              </div>
                              <div className="flex items-center gap-4 flex-shrink-0">
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                  <span className="text-sm font-bold">{player.overall_rating}</span>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-dark-400">
                                    {formatPrice(player.base_price)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sold Players */}
                  {soldPlayers.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                        Completed ({soldPlayers.length})
                      </h4>
                      <div className="space-y-2">
                        {soldPlayers.map((player) => {
                          const isUnsold = player.sold_to_team_name === 'Unsold';
                          return (
                            <div
                              key={player.id}
                              className={clsx(
                                'flex items-center justify-between p-3 rounded-lg',
                                isUnsold ? 'bg-ball-500/10' : 'bg-dark-800/30'
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {isUnsold ? (
                                    <XCircle className="w-4 h-4 text-ball-500 flex-shrink-0" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4 text-pitch-500/60 flex-shrink-0" />
                                  )}
                                  <p className="font-medium text-dark-300 truncate">
                                    {player.name}
                                  </p>
                                  {player.is_overseas && (
                                    <Globe className="w-3 h-3 text-blue-400/50 flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-dark-500">
                                  {getPlayerType(player.role)}
                                </p>
                              </div>
                              <div className="flex items-center gap-4 flex-shrink-0">
                                <div className="flex items-center gap-1 opacity-60">
                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                  <span className="text-sm font-bold">{player.overall_rating}</span>
                                </div>
                                <div className="text-right">
                                  {isUnsold ? (
                                    <p className="text-sm text-ball-400">Unsold</p>
                                  ) : (
                                    <>
                                      <p className="text-sm text-pitch-400/80">
                                        {formatPrice(player.sold_price)}
                                      </p>
                                      <p className="text-xs text-dark-500">
                                        {player.sold_to_team_name}
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {remainingPlayers.length === 0 && soldPlayers.length === 0 && (
                    <div className="text-center py-12 text-dark-400">
                      No players in this category
                    </div>
                  )}

                  {remainingPlayers.length === 0 && soldPlayers.length > 0 && (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-pitch-500/10 rounded-full">
                        <CheckCircle className="w-4 h-4 text-pitch-500" />
                        <span className="text-sm text-pitch-400">Category completed</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Skip Category Button - Only show for current active category */}
            {isActiveCategory && remainingPlayers.length > 0 && !isSkipping && (
              <div className="p-4 border-t border-dark-800">
                <button
                  onClick={() => handleSkipClick(activeTab)}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <ChevronRight className="w-5 h-5" />
                  Skip {CATEGORY_LABELS[activeTab]} Category
                </button>
                <p className="text-xs text-dark-500 text-center mt-2">
                  AI teams will compete for all {counts[activeTab] || 0} remaining players
                </p>
              </div>
            )}

            {/* Info for non-active categories */}
            {!isActiveCategory && remainingPlayers.length > 0 && !isSkipping && (
              <div className="p-4 border-t border-dark-800">
                <p className="text-xs text-dark-500 text-center">
                  {categoryStatus === 'pending'
                    ? `This category will be auctioned after ${CATEGORY_LABELS[currentCategory || '']}`
                    : 'This category has been completed'}
                </p>
              </div>
            )}

            {/* Confirmation Dialog */}
            <AnimatePresence>
              {showConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center p-4"
                  onClick={() => setShowConfirm(null)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="glass-card p-6 max-w-sm w-full"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Skip Category?</h3>
                        <p className="text-sm text-dark-400">This cannot be undone</p>
                      </div>
                    </div>

                    <p className="text-dark-300 text-sm mb-4">
                      All {counts[showConfirm] || 0} remaining{' '}
                      <span className="text-white font-medium">
                        {CATEGORY_LABELS[showConfirm]}
                      </span>{' '}
                      players will be auctioned instantly with AI teams competing.
                      You won't be able to bid on these players.
                    </p>

                    {/* S6: Top players preview */}
                    {(() => {
                      const topPlayers = [...(categories[showConfirm] || [])]
                        .sort((a, b) => b.overall_rating - a.overall_rating)
                        .slice(0, 3);
                      return topPlayers.length > 0 ? (
                        <div className="mb-4 p-3 bg-dark-800/50 rounded-lg">
                          <p className="text-xs text-dark-500 font-medium mb-2">Notable players you'll miss:</p>
                          <div className="space-y-1.5">
                            {topPlayers.map((p) => (
                              <div key={p.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    <span className="text-xs font-bold text-white">{p.overall_rating}</span>
                                  </div>
                                  <span className="text-xs text-dark-300">{p.name}</span>
                                  {p.is_overseas && <Globe className="w-3 h-3 text-blue-400" />}
                                </div>
                                <span className="text-xs text-dark-500">{formatPrice(p.base_price)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setShowConfirm(null)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmSkip}
                        className="btn-primary bg-amber-600 hover:bg-amber-700"
                      >
                        Skip Category
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
