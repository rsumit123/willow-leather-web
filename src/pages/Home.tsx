import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Trophy, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { careerApi } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';

export function HomePage() {
  const navigate = useNavigate();
  const { careerId, setCareer, clearGame } = useGameStore();

  // Load saved careers
  const { data: careers, isLoading } = useQuery({
    queryKey: ['careers'],
    queryFn: () => careerApi.list().then((r) => r.data),
  });

  // Auto-load if we have a saved career ID
  useEffect(() => {
    if (careerId && careers) {
      const career = careers.find((c) => c.id === careerId);
      if (career) {
        setCareer(career);
        navigate('/dashboard');
      }
    }
  }, [careerId, careers]);

  if (isLoading) {
    return <Loading fullScreen text="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-pitch-500/10 to-transparent" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-radial from-ball-500/5 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-pitch-500 to-pitch-600 flex items-center justify-center shadow-2xl shadow-pitch-500/25"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>

          {/* Title */}
          <h1 className="text-5xl font-display font-bold mb-3">
            <span className="gradient-text">Willow</span>
            <span className="text-white"> & </span>
            <span className="gradient-text">Leather</span>
          </h1>

          <p className="text-dark-400 text-lg mb-12">
            Build your cricket empire. Manage your team. Win championships.
          </p>

          {/* Actions */}
          <div className="space-y-4">
            <motion.button
              onClick={() => {
                clearGame();
                navigate('/new-career');
              }}
              className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="w-5 h-5" />
              New Career
            </motion.button>

            {careers && careers.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-4"
              >
                <p className="text-sm text-dark-400 mb-3">Continue from:</p>
                <div className="space-y-2">
                  {careers.slice(0, 3).map((career) => (
                    <button
                      key={career.id}
                      onClick={() => {
                        setCareer(career);
                        navigate('/dashboard');
                      }}
                      className="w-full p-3 bg-dark-800 hover:bg-dark-700 rounded-lg text-left transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{career.name}</p>
                          <p className="text-xs text-dark-400">
                            Season {career.current_season_number}
                          </p>
                        </div>
                        <Play className="w-4 h-4 text-pitch-500" />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-dark-500 text-sm"
          >
            Cricket Management Simulation • v0.1.0
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
