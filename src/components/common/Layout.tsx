import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Trophy,
  Swords,
  Home,
  Menu,
  X,
  Plus,
  LogOut,
  User,
  Bell,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../../api/client';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';
import clsx from 'clsx';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Hub' },
  { path: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { path: '/squad', icon: Users, label: 'Squad' },
  { path: '/fixtures', icon: Swords, label: 'Matches' },
  { path: '/standings', icon: Trophy, label: 'Table' },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { career, careerId, clearGame } = useGameStore();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  // Unread notification count
  const { data: unreadData } = useQuery({
    queryKey: ['unread-count', careerId],
    queryFn: () => notificationApi.unreadCount(careerId!).then((r) => r.data),
    enabled: !!careerId,
    refetchInterval: 30000,
  });
  const unreadCount = unreadData?.count || 0;

  // Bell shake — triggers when unread count increases
  const [bellShaking, setBellShaking] = useState(false);
  const prevUnreadRef = useRef(0);
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current && prevUnreadRef.current >= 0) {
      setBellShaking(true);
      const timer = setTimeout(() => setBellShaking(false), 2000);
      return () => clearTimeout(timer);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  // Tier color helpers
  const tierColor = career?.tier === 'district' ? 'amber' : career?.tier === 'state' ? 'blue' : 'pitch';

  // Hide nav on certain pages
  const hideNav =
    location.pathname === '/' ||
    location.pathname.startsWith('/new-career') ||
    location.pathname.startsWith('/auction');

  const handleNewCareer = () => {
    clearGame();
    navigate('/');
    setMenuOpen(false);
  };

  const handleGoHome = () => {
    navigate('/');
    setMenuOpen(false);
  };

  const handleLogout = () => {
    clearGame();
    logout();
    navigate('/login');
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
              {career.tier && (
                <span className={clsx(
                  'text-xs px-2 py-0.5 rounded-full font-medium capitalize',
                  tierColor === 'amber' && 'bg-amber-500/20 text-amber-400',
                  tierColor === 'blue' && 'bg-blue-500/20 text-blue-400',
                  tierColor === 'pitch' && 'bg-pitch-500/20 text-pitch-400',
                )}>
                  {career.tier}
                </span>
              )}
              <span className="text-sm text-dark-400">
                S{career.current_season_number}
              </span>

              {/* Inbox Bell */}
              <Link
                to="/inbox"
                className={clsx(
                  "relative p-2 hover:bg-dark-800 rounded-lg transition-colors",
                  bellShaking && "animate-[bell-shake_0.5s_ease-in-out_3]"
                )}
              >
                <Bell className="w-5 h-5 text-dark-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-ball-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Avatar */}
              {user && (
                <div className="hidden sm:block">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border border-dark-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-pitch-500/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-pitch-400" />
                    </div>
                  )}
                </div>
              )}

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
                  {/* User info in menu */}
                  {user && (
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-700/50 mb-2">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-10 h-10 rounded-full border border-dark-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-pitch-500/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-pitch-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="text-xs text-dark-400">{user.email}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleGoHome}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-800 rounded-lg transition-colors text-left"
                  >
                    <Home className="w-5 h-5 text-dark-400" />
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

                  <div className="border-t border-dark-700/50 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-800 rounded-lg transition-colors text-left"
                    >
                      <LogOut className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="font-medium text-red-400">Sign Out</p>
                        <p className="text-xs text-dark-400">Log out of your account</p>
                      </div>
                    </button>
                  </div>
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
