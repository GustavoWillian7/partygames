import { io, Socket } from 'socket.io-client';
import type { ServerEvents, ClientEvents } from '@partygames/shared';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socket: Socket<ServerEvents, ClientEvents> | null = null;

export function getSocket(): Socket<ServerEvents, ClientEvents> {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(token: string | null): Socket<ServerEvents, ClientEvents> {
  const s = getSocket();
  if (s.auth && typeof s.auth === 'object') {
    (s.auth as any).token = token;
  } else {
    (s as any).auth = { token };
  }
  if (!s.connected) {
    s.connect();
  }

  // Listener único para shutdown do servidor
  s.off('server:shutdown');
  s.on('server:shutdown', (payload: { message: string }) => {
    alert(payload.message || 'Servidor foi reiniciado. Você será desconectado.');
    localStorage.removeItem('token');
    localStorage.removeItem('player');
    disconnectSocket();
    window.location.href = '/';
  });

  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
