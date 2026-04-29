import { Server as SocketServer, Socket } from 'socket.io';

export function roomHandler(io: SocketServer, socket: Socket) {
  socket.on('room:create', (payload) => {
    // TODO: implement room creation logic
    socket.emit('room:error', { message: 'Not implemented yet' });
  });

  socket.on('room:join', (payload) => {
    // TODO: implement room join logic
    socket.emit('room:error', { message: 'Not implemented yet' });
  });

  socket.on('room:leave', () => {
    // TODO: implement room leave logic
  });

  socket.on('room:kick', (payload) => {
    // TODO: implement kick logic
  });

  socket.on('room:update-settings', (payload) => {
    // TODO: implement settings update
  });

  socket.on('room:start-game', (payload) => {
    // TODO: implement game start
  });

  socket.on('disconnect', () => {
    // TODO: handle disconnection, reconnection window, host transfer
  });
}
