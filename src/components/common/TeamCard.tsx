import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { Team, TeamChoice } from '../../api/client';
import clsx from 'clsx';

interface TeamCardProps {
  team: Team | TeamChoice;
  onClick?: () => void;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TeamBadge({ team, size = 'sm' }: { team: Team | TeamChoice; size?: 'sm' | 'md' | 'lg' }) {
  const isFullTeam = 'primary_color' in team;
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
  };

  return (
    <div
      className={clsx(
        'rounded-xl font-display font-bold flex items-center justify-center flex-shrink-0',
        sizeClasses[size]
      )}
      style={{
        backgroundColor: isFullTeam ? team.primary_color : '#1f2937',
        color: 'white',
      }}
    >
      {team.short_name}
    </div>
  );
}

export function TeamCard({ team, onClick, selected = false, size = 'md' }: TeamCardProps) {
  const isFullTeam = 'primary_color' in team;

  return (
    <motion.div
      className={clsx(
        'glass-card p-4 relative overflow-hidden cursor-pointer',
        selected && 'ring-2 ring-pitch-500 border-pitch-500/50'
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Background gradient */}
      {isFullTeam && (
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background: `linear-gradient(135deg, ${team.primary_color} 0%, transparent 60%)`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative flex items-center gap-3">
        <TeamBadge team={team} size={size === 'sm' ? 'sm' : 'md'} />

        <div className="flex-1 min-w-0">
          <h3 className={clsx(
            'font-display font-bold text-white truncate',
            size === 'sm' ? 'text-sm' : 'text-base'
          )}>
            {team.name}
          </h3>
          <p className="text-dark-400 text-xs truncate">{team.city}</p>
        </div>

        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-6 h-6 rounded-full bg-pitch-500 flex items-center justify-center flex-shrink-0"
          >
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
