import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Star, Trophy, Crown } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { careerApi } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { UserMenu } from '../components/common/UserMenu';

const TIERS = [
  {
    name: 'District',
    stars: 1,
    color: 'amber',
    teams: '6 teams',
    detail: 'Fixed squad · Win the cup to get noticed',
    bgClass: 'from-amber-500/20 to-amber-600/5',
    borderClass: 'border-amber-500/40',
    textClass: 'text-amber-400',
    icon: Star,
  },
  {
    name: 'State / Ranji',
    stars: 2,
    color: 'blue',
    teams: '8 teams',
    detail: 'Build your squad · Reach the final',
    bgClass: 'from-blue-500/20 to-blue-600/5',
    borderClass: 'border-blue-500/30',
    textClass: 'text-blue-400',
    icon: Trophy,
    locked: true,
  },
  {
    name: 'IPL',
    stars: 3,
    color: 'green',
    teams: 'Auction · Full control',
    detail: 'The ultimate stage',
    bgClass: 'from-pitch-500/20 to-pitch-600/5',
    borderClass: 'border-pitch-500/30',
    textClass: 'text-pitch-400',
    icon: Crown,
    locked: true,
  },
];

export function NewCareerPage() {
  const navigate = useNavigate();
  const { setCareer, clearGame } = useGameStore();

  useEffect(() => {
    clearGame();
  }, []);

  const [careerName, setCareerName] = useState('');

  const createMutation = useMutation({
    mutationFn: () => careerApi.create(careerName),
    onSuccess: (response) => {
      setCareer(response.data);
      navigate('/dashboard');
    },
  });

  return (
    <div className="min-h-screen bg-dark-950 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-radial from-amber-500/5 to-transparent" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-dark-950/80 backdrop-blur-lg border-b border-dark-800">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="ml-2 font-semibold">New Career</h1>
          <div className="ml-auto">
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Career Name Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Career Name
          </label>
          <input
            type="text"
            value={careerName}
            onChange={(e) => setCareerName(e.target.value)}
            placeholder="My Championship Run"
            className="input-field"
            autoFocus
          />
        </motion.div>

        {/* Tier Journey */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-display font-bold text-white mb-1">
            Your Journey
          </h2>
          <p className="text-sm text-dark-400 mb-4">
            Rise through the ranks of Indian cricket
          </p>

          <div className="space-y-3">
            {TIERS.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.1 }}
              >
                <div
                  className={`glass-card p-4 border ${tier.borderClass} bg-gradient-to-r ${tier.bgClass} ${
                    tier.locked ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-dark-800/50 flex items-center justify-center flex-shrink-0`}>
                      <tier.icon className={`w-5 h-5 ${tier.textClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-display font-bold ${tier.textClass}`}>
                          {tier.name}
                        </span>
                        {tier.locked && (
                          <span className="text-xs bg-dark-700/60 text-dark-400 px-2 py-0.5 rounded-full">
                            LOCKED
                          </span>
                        )}
                        {!tier.locked && (
                          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                            START HERE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-dark-300 mt-0.5">
                        {tier.teams}
                      </p>
                      <p className="text-xs text-dark-400 mt-0.5">
                        {tier.detail}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Connector line */}
                {i < TIERS.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="w-px h-4 bg-dark-700" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-4 border-amber-500/20"
        >
          <p className="text-sm text-dark-300">
            You start at <span className="text-amber-400 font-medium">District</span> level.
            Your team will be assigned randomly. Win the District Cup to earn
            a promotion to State cricket.
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-dark-950/90 backdrop-blur-lg border-t border-dark-800 safe-bottom">
        <div className="max-w-lg mx-auto px-4 py-4">
          <button
            onClick={() => createMutation.mutate()}
            disabled={!careerName.trim() || createMutation.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {createMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating career...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Start Career
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
