import { motion } from 'framer-motion';

interface CricketBallProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

const sizes = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
};

export function CricketBall({ size = 'md', animate = false, className = '' }: CricketBallProps) {
  const ball = (
    <div
      className={`
        ${sizes[size]} rounded-full
        bg-gradient-to-br from-ball-400 via-ball-500 to-ball-700
        shadow-lg shadow-ball-500/30
        relative overflow-hidden
        ${className}
      `}
    >
      {/* Seam pattern */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[80%] h-0.5 bg-white/40 rounded-full" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center rotate-90">
        <div className="w-[60%] h-0.5 bg-white/20 rounded-full" />
      </div>

      {/* Shine */}
      <div className="absolute top-1 left-1 w-2 h-2 bg-white/30 rounded-full blur-[2px]" />
    </div>
  );

  if (animate) {
    return (
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {ball}
      </motion.div>
    );
  }

  return ball;
}
