import { io, Socket } from 'socket.io-client';
import type { ServerEvents, ClientEvents } from '@partygames/shared';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socket: Socket<ServerEvents, ClientEvents> | null = null;

export function getSocket(): Socket<ServerEvents, ClientEvents> {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });

    // Log de estado para debug
    socket.on('connect', () => {
      console.log('[Socket] Connected');
    });
    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });
    socket.on('connect_error', (err) => {
      console.error('[Socket] Connect error:', err.message);
    });
  }
  return socket;
}

export function connectSocket(token: string | null): Socket<ServerEvents, ClientEvents> {
  const s = getSocket();
  // Sempre atualizar auth antes de conectar/reconectar
  if (token) {
    if (s.auth && typeof s.auth === 'object') {
      (s.auth as any).token = token;
    } else {
      (s as any).auth = { token };
    }
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

export function leaveRoomAndWait(): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    const onLeft = (payload: { success: boolean; message?: string }) => {
      s.off('room:left', onLeft);
      if (payload.success) {
        resolve();
      } else {
        reject(new Error(payload.message || 'Falha ao sair da sala'));
      }
    };
    s.once('room:left', onLeft);
    s.emit('room:leave');
    // Timeout de segurança
    setTimeout(() => {
      s.off('room:left', onLeft);
      resolve();
    }, 3000);
  });
}
