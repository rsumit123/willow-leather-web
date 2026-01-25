import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Career, Team } from '../api/client';

interface GameState {
  // Current career
  careerId: number | null;
  career: Career | null;
  userTeam: Team | null;

  // Actions
  setCareer: (career: Career) => void;
  setUserTeam: (team: Team) => void;
  clearGame: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      careerId: null,
      career: null,
      userTeam: null,

      setCareer: (career) => set({
        careerId: career.id,
        career,
        userTeam: career.user_team || null,
      }),

      setUserTeam: (team) => set({ userTeam: team }),

      clearGame: () => set({
        careerId: null,
        career: null,
        userTeam: null,
      }),
    }),
    {
      name: 'willow-leather-game',
      partialize: (state) => ({
        careerId: state.careerId,
      }),
    }
  )
);
