import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play,
  Trophy,
  Sparkles,
  Gavel,
  Users,
  Target,
  Zap,
  ChevronRight,
  Award,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { careerApi } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { Loading } from '../components/common/Loading';
import clsx from 'clsx';

const features = [
  {
    icon: Gavel,
    title: 'Live Auction',
    description: 'Bid against AI teams in a thrilling auction to build your dream squad with a ₹90 Cr budget.',
    color: 'text-pitch-400',
    bgColor: 'bg-pitch-500/10',
  },
  {
    icon: Users,
    title: 'Squad Management',
    description: 'Select your playing XI, set batting orders, and manage 200+ unique players with special traits.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Target,
    title: 'Match Simulation',
    description: 'Experience ball-by-ball action with realistic commentary. Choose your tactics and watch your strategy unfold.',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
  {
    icon: Trophy,
    title: 'League & Playoffs',
    description: 'Compete in a full league season, qualify for playoffs, and chase championship glory.',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  },
];

const highlights = [
  { value: '200+', label: 'Unique Players' },
  { value: '₹90Cr', label: 'Auction Budget' },
  { value: '8', label: 'Teams' },
  { value: '∞', label: 'Seasons' },
];

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
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-pitch-500/10 to-transparent" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-gradient-radial from-blue-500/5 to-transparent" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-radial from-ball-500/5 to-transparent" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWEyZSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
      </div>

      {/* Content */}
      <div className="relative">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl w-full text-center"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="relative w-24 h-24 mx-auto mb-8"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pitch-500 to-pitch-600 shadow-2xl shadow-pitch-500/30" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pitch-400/20 to-transparent" />
              <Trophy className="absolute inset-0 m-auto w-12 h-12 text-white drop-shadow-lg" />
              {/* Floating sparkles */}
              <motion.div
                animate={{ y: [-2, 2, -2], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl font-display font-bold mb-4"
            >
              <span className="gradient-text">Willow</span>
              <span className="text-white"> & </span>
              <span className="gradient-text">Leather</span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-dark-300 text-lg sm:text-xl mb-8 max-w-md mx-auto"
            >
              Build your cricket empire. Manage your franchise. Win championships.
            </motion.p>

            {/* Highlights Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center gap-4 sm:gap-8 mb-10"
            >
              {highlights.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="text-center"
                >
                  <p className="text-2xl sm:text-3xl font-bold gradient-text">{item.value}</p>
                  <p className="text-xs sm:text-sm text-dark-400">{item.label}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <motion.button
                onClick={() => {
                  clearGame();
                  navigate('/new-career');
                }}
                className="btn-primary w-full sm:w-auto sm:min-w-[280px] flex items-center justify-center gap-2 text-lg py-4 px-8"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Sparkles className="w-5 h-5" />
                Start New Career
                <ChevronRight className="w-5 h-5" />
              </motion.button>

              {/* Continue Career */}
              {careers && careers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="glass-card p-4 max-w-sm mx-auto"
                >
                  <p className="text-sm text-dark-400 mb-3 flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Continue your journey
                  </p>
                  <div className="space-y-2">
                    {careers.slice(0, 2).map((career) => (
                      <button
                        key={career.id}
                        onClick={() => {
                          setCareer(career);
                          navigate('/dashboard');
                        }}
                        className="w-full p-3 bg-dark-800 hover:bg-dark-700 rounded-lg text-left transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white group-hover:text-pitch-400 transition-colors">
                              {career.name}
                            </p>
                            <p className="text-xs text-dark-400">
                              Season {career.current_season_number} • {career.user_team?.short_name || 'Team'}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-dark-500 group-hover:text-pitch-400 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-16"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-dark-500 text-sm flex flex-col items-center gap-2"
              >
                <span>Discover Features</span>
                <ChevronRight className="w-5 h-5 rotate-90" />
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
                The Complete Cricket Management Experience
              </h2>
              <p className="text-dark-400 max-w-xl mx-auto">
                Every decision matters. From auction strategy to match tactics, build your path to glory.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-6 hover:border-dark-600 transition-colors group"
                >
                  <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center mb-4', feature.bgColor)}>
                    <feature.icon className={clsx('w-6 h-6', feature.color)} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-pitch-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-dark-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Game Highlights Section */}
        <section className="py-20 px-4 bg-dark-900/50">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
                What Makes It Special
              </h2>
            </motion.div>

            <div className="grid gap-6">
              {/* Player Traits */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="glass-card p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Unique Player Traits</h3>
                    <p className="text-dark-400 text-sm mb-3">
                      Players have special traits that affect their performance. Find the clutch performers, finishers, and partnership breakers to build your perfect squad.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">Clutch</span>
                      <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">Finisher</span>
                      <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">Partnership Breaker</span>
                      <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Safe Hands</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Realistic Auction */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="glass-card p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pitch-500/10 flex items-center justify-center flex-shrink-0">
                    <Gavel className="w-6 h-6 text-pitch-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Strategic Auction Bidding</h3>
                    <p className="text-dark-400 text-sm">
                      Compete against 7 AI teams in a realistic auction. Manage your ₹90 Cr budget wisely, use auto-bid features, and outsmart rivals to secure star players.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Full Season */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="glass-card p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Full Season Experience</h3>
                    <p className="text-dark-400 text-sm">
                      Play through a complete league season, qualify for playoffs, and chase the championship. Your decisions shape your team's destiny.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-lg mx-auto text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-pitch-500/20 to-pitch-600/20 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-pitch-500" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-4">
              Ready to Build Your Dynasty?
            </h2>
            <p className="text-dark-400 mb-8">
              Start your cricket management journey today. Free to play.
            </p>
            <motion.button
              onClick={() => {
                clearGame();
                navigate('/new-career');
              }}
              className="btn-primary flex items-center justify-center gap-2 text-lg py-4 px-8 mx-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="w-5 h-5" />
              Start Playing Now
            </motion.button>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-dark-800">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-pitch-500" />
              <span className="font-display font-semibold text-white">Willow & Leather</span>
            </div>
            <p className="text-dark-500 text-sm text-center sm:text-right">
              Cricket Management Simulation • v0.1.0
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
