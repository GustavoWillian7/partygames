import { Socket } from 'socket.io';

const playerSockets = new Map<string, Set<Socket>>();

export function registerSocket(playerId: string, socket: Socket): void {
  let set = playerSockets.get(playerId);
  if (!set) {
    set = new Set();
    playerSockets.set(playerId, set);
  }
  set.add(socket);
}

export function unregisterSocket(playerId: string, socket: Socket): void {
  const set = playerSockets.get(playerId);
  if (!set) return;
  set.delete(socket);
  if (set.size === 0) {
    playerSockets.delete(playerId);
  }
}

export function getSocket(playerId: string): Socket | undefined {
  const set = playerSockets.get(playerId);
  if (!set || set.size === 0) return undefined;
  // Retorna o primeiro socket ativo (conectado)
  for (const s of set) {
    if (s.connected) return s;
  }
  return undefined;
}

export function getAllSockets(playerId: string): Socket[] {
  const set = playerSockets.get(playerId);
  return set ? Array.from(set).filter((s) => s.connected) : [];
}

export function hasActiveSocket(playerId: string): boolean {
  const set = playerSockets.get(playerId);
  if (!set) return false;
  for (const s of set) {
    if (s.connected) return true;
  }
  return false;
}
