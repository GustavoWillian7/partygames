import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { env } from './config/env';
import { connectMongo } from './config/mongo';
import './config/redis';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import { registerSocketEvents } from './events/socketEvents';

async function main() {
  await connectMongo();

  const app = express();
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use(errorHandler);

  const httpServer = createServer(app);
  const io = new SocketServer(httpServer, {
    cors: { origin: env.CORS_ORIGIN },
  });

  registerSocketEvents(io);

  httpServer.listen(env.PORT, () => {
    console.log(`[Server] Running on http://localhost:${env.PORT}`);
  });
}

main();
