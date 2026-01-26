import { motion } from 'framer-motion';
import { Award, Star } from 'lucide-react';
import type { ManOfTheMatch } from '../../api/client';

interface ManOfTheMatchRevealProps {
  mom: ManOfTheMatch;
}

export function ManOfTheMatchReveal({ mom }: ManOfTheMatchRevealProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.5 }}
      className="relative overflow-hidden"
    >
      {/* Spotlight gradient background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute inset-0 bg-gradient-to-b from-yellow-500/20 via-transparent to-transparent pointer-events-none"
      />

      {/* Radial glow */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.5 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="absolute inset-0 bg-radial-glow pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(234, 179, 8, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* Main card */}
      <div className="relative glass-card p-6 border border-yellow-500/30">
        {/* Award icon */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 1.0 }}
          className="flex justify-center mb-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
            <Award className="w-6 h-6 text-yellow-500" />
          </div>
        </motion.div>

        {/* Label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-center mb-4"
        >
          <span className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">
            Man of the Match
          </span>
        </motion.div>

        {/* Player name */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 1.2 }}
          className="text-center mb-1"
        >
          <h3 className="text-2xl font-display font-bold text-white">
            {mom.player_name}
          </h3>
        </motion.div>

        {/* Team name */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="text-center mb-4"
        >
          <span className="text-sm text-dark-400">{mom.team_name}</span>
        </motion.div>

        {/* Performance badge */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 1.4 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-lg font-bold text-yellow-400">
              {mom.performance_summary}
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
