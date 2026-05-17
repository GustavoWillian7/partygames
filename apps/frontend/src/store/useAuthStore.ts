import { create } from 'zustand';

interface PlayerProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  totalGames: number;
  totalWins: number;
  favoriteGame?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthState {
  token: string | null;
  player: PlayerProfile | null;
  isLoading: boolean;
  error: string | null;
  setToken: (token: string) => void;
  setPlayer: (player: PlayerProfile) => void;
  setAuth: (token: string, player: PlayerProfile) => void;
  clearAuth: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

function getStoredPlayer(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem('player');
    if (!raw) return null;
    return JSON.parse(raw) as PlayerProfile;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  player: getStoredPlayer(),
  isLoading: false,
  error: null,
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  setPlayer: (player) => {
    localStorage.setItem('player', JSON.stringify(player));
    set({ player });
  },
  setAuth: (token, player) => {
    localStorage.setItem('token', token);
    localStorage.setItem('player', JSON.stringify(player));
    set({ token, player, error: null });
  },
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('player');
    set({ token: null, player: null, error: null });
  },
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
}));
