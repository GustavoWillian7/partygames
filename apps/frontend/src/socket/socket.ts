import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: {
    token: localStorage.getItem('token'),
  },
});

socket.on('connect', () => {
  console.log('[Socket] Connected');
});

socket.on('disconnect', () => {
  console.log('[Socket] Disconnected');
});
