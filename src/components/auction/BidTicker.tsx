import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { formatPrice } from '../../utils/format';
import clsx from 'clsx';

interface BidTickerProps {
  bids: { team_name: string; amount: number }[];
  userTeamName?: string;
}

export function BidTicker({ bids, userTeamName }: BidTickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new bids arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [bids.length]);

  return (
    <div className="w-full">
      <div className="text-[10px] text-dark-500 mb-1">Bid War</div>
      <div
        ref={scrollRef}
        className="max-h-[120px] overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-dark-700"
      >
        {bids.map((bid, i) => {
          const isUser = userTeamName && bid.team_name === userTeamName;
          const isLatest = i === bids.length - 1;

          return (
            <motion.div
              key={`${bid.team_name}-${bid.amount}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: isLatest ? 0.05 : 0 }}
              className={clsx(
                'flex items-center justify-between px-2 py-0.5 rounded text-xs',
                isUser
                  ? 'border-l-2 border-pitch-400 bg-pitch-500/10'
                  : 'border-l-2 border-transparent',
                isLatest && 'bg-dark-700/50'
              )}
            >
              <span className={clsx(
                'font-medium',
                isUser ? 'text-pitch-400' : 'text-dark-300'
              )}>
                {bid.team_name}
                {isUser && <span className="text-dark-500 ml-1">(You)</span>}
              </span>
              <span className={clsx(
                'tabular-nums',
                isLatest ? 'text-white font-semibold' : 'text-dark-400'
              )}>
                {formatPrice(bid.amount)}
              </span>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
