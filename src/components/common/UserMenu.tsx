import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Home } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useGameStore } from '../../store/gameStore';

export function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { clearGame } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    clearGame();
    logout();
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors"
      >
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
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-dark-800 border border-dark-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* User info */}
          <div className="p-4 border-b border-dark-700">
            <div className="flex items-center gap-3">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-pitch-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-pitch-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-dark-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={handleGoHome}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-dark-700 rounded-lg transition-colors"
            >
              <Home className="w-4 h-4 text-dark-400" />
              <span className="text-sm text-white">Main Menu</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-dark-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
