import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Menu, X, Home as HomeIcon, Plus, Trophy } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

interface PageHeaderProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  showBrand?: boolean;
}

export function PageHeader({ title, showBack = false, backTo, showBrand = true }: PageHeaderProps) {
  const navigate = useNavigate();
  const { clearGame, career } = useGameStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  const handleGoHome = () => {
    navigate('/');
    setMenuOpen(false);
  };

  const handleNewCareer = () => {
    clearGame();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-dark-950 via-dark-900 to-dark-950 backdrop-blur-lg border-b border-dark-700/50 shadow-lg">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left side - Back button and Brand */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 hover:bg-dark-800/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-dark-300" />
            </button>
          )}

          {showBrand && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pitch-500 to-pitch-600 flex items-center justify-center shadow-md shadow-pitch-500/20">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-bold text-white text-sm tracking-tight">
                  Willow & Leather
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* Center - Page title */}
        {title && (
          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="font-semibold text-white/90 text-sm uppercase tracking-wider">{title}</h1>
          </div>
        )}

        {/* Right side - Team badge and Menu */}
        <div className="flex items-center gap-2">
          {career?.user_team && (
            <div
              className="px-2.5 py-1 rounded-md text-xs font-bold hidden sm:block"
              style={{
                backgroundColor: career.user_team.primary_color + '25',
                color: career.user_team.primary_color,
                border: `1px solid ${career.user_team.primary_color}40`
              }}
            >
              {career.user_team.short_name}
            </div>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-dark-800/50 rounded-lg transition-colors"
          >
            {menuOpen ? (
              <X className="w-5 h-5 text-dark-300" />
            ) : (
              <Menu className="w-5 h-5 text-dark-300" />
            )}
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-dark-700/50 overflow-hidden bg-dark-900/95"
          >
            <div className="max-w-lg mx-auto px-4 py-2">
              <button
                onClick={handleGoHome}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-800/50 rounded-lg transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-dark-800 flex items-center justify-center">
                  <HomeIcon className="w-5 h-5 text-dark-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Main Menu</p>
                  <p className="text-xs text-dark-400">View all careers</p>
                </div>
              </button>

              <button
                onClick={handleNewCareer}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-800/50 rounded-lg transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-pitch-500/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-pitch-500" />
                </div>
                <div>
                  <p className="font-medium text-white">New Career</p>
                  <p className="text-xs text-dark-400">Start fresh</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
