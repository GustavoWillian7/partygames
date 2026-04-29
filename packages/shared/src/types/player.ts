export type PlayerStatus = 'online' | 'offline' | 'disconnected' | 'spectator';

export interface Player {
  id: string;
  socketId: string;
  name: string;
  avatarUrl?: string;
  status: PlayerStatus;
  isHost: boolean;
  score: number;
  createdAt: Date;
}

export interface PlayerProfile {
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
