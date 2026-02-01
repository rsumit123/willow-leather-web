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
  TrendingUp,
  Shield,
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
    description: 'Bid against AI teams to build your dream squad with a ₹90 Cr budget.',
    color: 'text-pitch-400',
    bgColor: 'bg-pitch-500/10',
    borderColor: 'group-hover:border-pitch-500/30',
  },
  {
    icon: Users,
    title: 'Squad Management',
    description: 'Select your playing XI and manage 200+ unique players with special traits.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'group-hover:border-blue-500/30',
  },
  {
    icon: Target,
    title: 'Match Simulation',
    description: 'Ball-by-ball action with realistic commentary. Choose tactics wisely.',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'group-hover:border-orange-500/30',
  },
  {
    icon: Trophy,
    title: 'League & Playoffs',
    description: 'Compete in a full season, qualify for playoffs, chase championship glory.',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'group-hover:border-yellow-500/30',
  },
];

const highlights = [
  { value: '200+', label: 'Unique Players', icon: Users },
  { value: '₹90Cr', label: 'Auction Budget', icon: TrendingUp },
  { value: '8', label: 'Franchise Teams', icon: Shield },
  { value: '∞', label: 'Seasons', icon: Trophy },
];

const traits = [
  { name: 'Clutch', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { name: 'Finisher', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { name: 'Death Specialist', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { name: 'Safe Hands', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { name: 'Partnership Breaker', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { name: 'Powerplay Expert', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
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
      {/* Background Effects - Enhanced for desktop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] lg:w-[1000px] lg:h-[1000px] bg-gradient-radial from-pitch-500/15 to-transparent blur-3xl" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] lg:w-[800px] lg:h-[800px] bg-gradient-radial from-blue-500/10 to-transparent blur-2xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] lg:w-[600px] lg:h-[600px] bg-gradient-radial from-ball-500/10 to-transparent blur-2xl" />

        {/* Animated floating orbs for desktop */}
        <motion.div
          animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="hidden lg:block absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-gradient-to-br from-pitch-500/20 to-transparent blur-2xl"
        />
        <motion.div
          animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="hidden lg:block absolute bottom-1/3 left-1/3 w-48 h-48 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-2xl"
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWEyZSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
      </div>

      {/* Content */}
      <div className="relative">
        {/* Hero Section - Responsive layout */}
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl w-full">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left side - Text content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center lg:text-left"
              >
                {/* Logo - Mobile only inline, desktop side */}
                <motion.div
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                  className="lg:hidden relative w-20 h-20 mx-auto mb-6"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pitch-500 to-pitch-600 shadow-2xl shadow-pitch-500/30" />
                  <Trophy className="absolute inset-0 m-auto w-10 h-10 text-white drop-shadow-lg" />
                  <motion.div
                    animate={{ y: [-2, 2, -2], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </motion.div>
                </motion.div>

                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pitch-500/10 border border-pitch-500/20 mb-6"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pitch-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-pitch-500"></span>
                  </span>
                  <span className="text-sm text-pitch-400 font-medium">Cricket Management Simulation</span>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-bold mb-6 leading-tight"
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
                  className="text-dark-300 text-lg sm:text-xl lg:text-2xl mb-8 max-w-xl mx-auto lg:mx-0"
                >
                  Build your cricket empire. Manage your franchise. Win championships.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                >
                  <motion.button
                    onClick={() => {
                      clearGame();
                      navigate('/new-career');
                    }}
                    className="btn-primary flex items-center justify-center gap-2 text-lg py-4 px-8"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Sparkles className="w-5 h-5" />
                    Start New Career
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>

                  {careers && careers.length > 0 && (
                    <motion.button
                      onClick={() => {
                        const latestCareer = careers[0];
                        setCareer(latestCareer);
                        navigate('/dashboard');
                      }}
                      className="btn-secondary flex items-center justify-center gap-2 text-lg py-4 px-8"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Play className="w-5 h-5" />
                      Continue Career
                    </motion.button>
                  )}
                </motion.div>

                {/* Saved careers - inline on desktop */}
                {careers && careers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 hidden lg:block"
                  >
                    <p className="text-sm text-dark-500 mb-3">Saved careers:</p>
                    <div className="flex gap-3">
                      {careers.slice(0, 3).map((career) => (
                        <button
                          key={career.id}
                          onClick={() => {
                            setCareer(career);
                            navigate('/dashboard');
                          }}
                          className="px-4 py-2 bg-dark-800/50 hover:bg-dark-700 rounded-lg text-left transition-all hover:scale-105 border border-dark-700/50 hover:border-pitch-500/30"
                        >
                          <p className="font-medium text-white text-sm">{career.name}</p>
                          <p className="text-xs text-dark-400">
                            S{career.current_season_number} • {career.user_team?.short_name || 'Team'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Right side - Visual element (desktop) */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="hidden lg:block relative"
              >
                {/* Main card */}
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-pitch-500/20 via-transparent to-blue-500/20 rounded-3xl blur-3xl" />

                  {/* Stats card */}
                  <div className="relative glass-card p-8 rounded-3xl border border-dark-700/50">
                    {/* Trophy icon */}
                    <div className="absolute -top-8 -right-8 w-24 h-24 rounded-2xl bg-gradient-to-br from-pitch-500 to-pitch-600 shadow-2xl shadow-pitch-500/30 flex items-center justify-center rotate-12">
                      <Trophy className="w-12 h-12 text-white" />
                    </div>

                    {/* Highlights grid */}
                    <div className="grid grid-cols-2 gap-6 mb-8">
                      {highlights.map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className="text-center p-4 rounded-xl bg-dark-800/50 border border-dark-700/50"
                        >
                          <item.icon className="w-6 h-6 text-pitch-400 mx-auto mb-2" />
                          <p className="text-3xl font-bold gradient-text">{item.value}</p>
                          <p className="text-sm text-dark-400">{item.label}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Trait badges preview */}
                    <div>
                      <p className="text-sm text-dark-400 mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-400" />
                        Player Traits System
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {traits.map((trait, index) => (
                          <motion.span
                            key={trait.name}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8 + index * 0.05 }}
                            className={clsx('text-xs px-3 py-1.5 rounded-full border', trait.color)}
                          >
                            {trait.name}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Floating decorative cards */}
                  <motion.div
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -left-12 top-1/4 glass-card p-4 rounded-xl border border-dark-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Ball-by-Ball</p>
                        <p className="text-xs text-dark-400">Live Action</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [5, -5, 5] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -right-8 bottom-1/4 glass-card p-4 rounded-xl border border-dark-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-pitch-500/20 flex items-center justify-center">
                        <Gavel className="w-5 h-5 text-pitch-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Live Auction</p>
                        <p className="text-xs text-dark-400">₹90 Cr Budget</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Highlights - Mobile only */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:hidden mt-12 grid grid-cols-4 gap-2"
            >
              {highlights.map((item) => (
                <div key={item.label} className="text-center p-3 rounded-xl bg-dark-800/30">
                  <p className="text-xl sm:text-2xl font-bold gradient-text">{item.value}</p>
                  <p className="text-[10px] sm:text-xs text-dark-400">{item.label}</p>
                </div>
              ))}
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:block"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-dark-500 text-sm flex flex-col items-center gap-2"
              >
                <span>Explore Features</span>
                <ChevronRight className="w-5 h-5 rotate-90" />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section - 4 columns on large screens */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 lg:mb-16"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
                The Complete Experience
              </h2>
              <p className="text-dark-400 max-w-2xl mx-auto text-lg">
                Every decision matters. From auction strategy to match tactics, build your path to glory.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={clsx(
                    "group glass-card p-6 lg:p-8 transition-all duration-300 hover:-translate-y-1",
                    feature.borderColor
                  )}
                >
                  <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110', feature.bgColor)}>
                    <feature.icon className={clsx('w-7 h-7', feature.color)} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-pitch-400 transition-colors">
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

        {/* Game Highlights Section - Asymmetric on desktop */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-dark-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left - Text */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
                  What Makes It <span className="gradient-text">Special</span>
                </h2>
                <p className="text-dark-400 text-lg mb-8">
                  Experience cricket management like never before with deep mechanics and strategic gameplay.
                </p>

                <div className="space-y-6">
                  {/* Feature items */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Unique Player Traits</h3>
                      <p className="text-dark-400 text-sm">
                        Discover clutch performers, finishers, and partnership breakers to build your perfect squad.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-pitch-500/10 flex items-center justify-center flex-shrink-0">
                      <Gavel className="w-6 h-6 text-pitch-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Strategic Auction</h3>
                      <p className="text-dark-400 text-sm">
                        Compete against 7 AI teams. Manage your budget wisely and outsmart rivals.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Full Season Mode</h3>
                      <p className="text-dark-400 text-sm">
                        League matches, playoffs, and championship glory await your franchise.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right - Visual */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="glass-card p-6 lg:p-8 rounded-2xl">
                  <p className="text-sm text-dark-400 mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    Player Traits Preview
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {traits.map((trait) => (
                      <span
                        key={trait.name}
                        className={clsx('text-sm px-3 py-1.5 rounded-full border', trait.color)}
                      >
                        {trait.name}
                      </span>
                    ))}
                  </div>
                  <div className="border-t border-dark-700/50 pt-6">
                    <p className="text-sm text-dark-400 mb-4">Match simulation features:</p>
                    <ul className="space-y-3">
                      {['Ball-by-ball commentary', 'Tactical aggression control', 'Real-time pitch conditions', 'Player form & momentum'].map((item) => (
                        <li key={item} className="flex items-center gap-3 text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-pitch-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-pitch-500/30 to-pitch-600/30 rounded-3xl blur-2xl" />
              <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-pitch-500 to-pitch-600 flex items-center justify-center shadow-2xl shadow-pitch-500/30">
                <Trophy className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
              Ready to Build Your Dynasty?
            </h2>
            <p className="text-dark-400 text-lg mb-8 max-w-xl mx-auto">
              Start your cricket management journey today. Free to play, endless possibilities.
            </p>
            <motion.button
              onClick={() => {
                clearGame();
                navigate('/new-career');
              }}
              className="btn-primary flex items-center justify-center gap-2 text-lg py-4 px-10 mx-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="w-5 h-5" />
              Start Playing Now
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-dark-800">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pitch-500 to-pitch-600 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
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
