import { Socket } from 'socket.io';

const playerSockets = new Map<string, Socket>();

export function registerSocket(playerId: string, socket: Socket): void {
  playerSockets.set(playerId, socket);
}

export function unregisterSocket(playerId: string): void {
  playerSockets.delete(playerId);
}

export function getSocket(playerId: string): Socket | undefined {
  return playerSockets.get(playerId);
}
