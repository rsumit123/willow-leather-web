import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Users,
  Calendar,
  Trophy,
  Menu,
  X,
  Plus,
  LogOut,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import clsx from 'clsx';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/squad', icon: Users, label: 'Squad' },
  { path: '/fixtures', icon: Calendar, label: 'Fixtures' },
  { path: '/standings', icon: Trophy, label: 'Table' },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { career, clearGame } = useGameStore();
  const [menuOpen, setMenuOpen] = useState(false);

  // Hide nav on certain pages
  const hideNav = ['/', '/new-career', '/auction'].some((p) =>
    location.pathname.startsWith(p)
  );

  const handleNewCareer = () => {
    clearGame();
    navigate('/');
    setMenuOpen(false);
  };

  const handleGoHome = () => {
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* Header */}
      {career && !hideNav && (
        <header className="sticky top-0 z-40 bg-dark-950/80 backdrop-blur-lg border-b border-dark-800">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pitch-500 to-pitch-600 flex items-center justify-center">
                <span className="font-display font-bold text-sm">WL</span>
              </div>
              <span className="font-display font-semibold hidden sm:block">
                Willow & Leather
              </span>
            </Link>

            <div className="flex items-center gap-2">
              {career.user_team && (
                <div
                  className="px-3 py-1.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: career.user_team.primary_color + '20' }}
                >
                  <span style={{ color: career.user_team.primary_color }}>
                    {career.user_team.short_name}
                  </span>
                </div>
              )}
              <span className="text-sm text-dark-400">
                Season {career.current_season_number}
              </span>

              {/* Menu Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
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
                className="border-t border-dark-800 overflow-hidden"
              >
                <div className="max-w-lg mx-auto px-4 py-2">
                  <button
                    onClick={handleGoHome}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-800 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="w-5 h-5 text-dark-400" />
                    <div>
                      <p className="font-medium text-white">Main Menu</p>
                      <p className="text-xs text-dark-400">View all careers</p>
                    </div>
                  </button>

                  <button
                    onClick={handleNewCareer}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-800 rounded-lg transition-colors text-left"
                  >
                    <Plus className="w-5 h-5 text-pitch-500" />
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
      )}

      {/* Main content */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      {career && !hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-900/90 backdrop-blur-lg border-t border-dark-800 safe-bottom">
          <div className="max-w-lg mx-auto px-4">
            <div className="flex items-center justify-around h-16">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative flex flex-col items-center gap-1 px-3 py-2"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -top-px left-0 right-0 h-0.5 bg-pitch-500"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <item.icon
                      className={clsx(
                        'w-5 h-5 transition-colors',
                        isActive ? 'text-pitch-500' : 'text-dark-400'
                      )}
                    />
                    <span
                      className={clsx(
                        'text-xs transition-colors',
                        isActive ? 'text-white' : 'text-dark-400'
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
