import { create } from 'zustand';
import type { Room, Player } from '@partygames/shared';

interface RoomState {
  currentRoom: Room | null;
  isLoading: boolean;
  error: string | null;
  setRoom: (room: Room | null) => void;
  updateRoom: (room: Room) => void;
  playerJoined: (player: Player) => void;
  playerLeft: (playerId: string, newHostId?: string) => void;
  playerReconnected: (player: Player) => void;
  clearRoom: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  currentRoom: null,
  isLoading: false,
  error: null,
  setRoom: (room) => set({ currentRoom: room, error: null }),
  updateRoom: (room) => set({ currentRoom: room }),
  playerJoined: (player) =>
    set((state) => {
      if (!state.currentRoom) return state;
      if (state.currentRoom.players.some((p) => p.id === player.id)) return state;
      return {
        currentRoom: {
          ...state.currentRoom,
          players: [...state.currentRoom.players, player],
          updatedAt: new Date(),
        },
      };
    }),
  playerLeft: (playerId, newHostId) =>
    set((state) => {
      if (!state.currentRoom) return state;
      return {
        currentRoom: {
          ...state.currentRoom,
          players: state.currentRoom.players.filter((p) => p.id !== playerId),
          hostId: newHostId ?? state.currentRoom.hostId,
          updatedAt: new Date(),
        },
      };
    }),
  playerReconnected: (player) =>
    set((state) => {
      if (!state.currentRoom) return state;
      return {
        currentRoom: {
          ...state.currentRoom,
          players: state.currentRoom.players.map((p) =>
            p.id === player.id ? { ...p, status: 'online' as const, socketId: player.socketId } : p
          ),
          updatedAt: new Date(),
        },
      };
    }),
  clearRoom: () => set({ currentRoom: null, error: null }),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
}));
