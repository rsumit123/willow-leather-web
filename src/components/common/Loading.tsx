import { motion } from 'framer-motion';
import clsx from 'clsx';

interface LoadingProps {
  fullScreen?: boolean;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Loading({ fullScreen = false, text, size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        className={clsx(
          'rounded-full border-pitch-500/30 border-t-pitch-500',
          sizeClasses[size]
        )}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-dark-400 text-sm"
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
