import Redis from 'ioredis';
import { env } from './env';

const isTls = env.REDIS_URL.startsWith('rediss://');

export const redis = new Redis(env.REDIS_URL, {
  keepAlive: 30000,
  connectTimeout: 15000,
  enableReadyCheck: false,
  enableOfflineQueue: true,
  maxRetriesPerRequest: null,
  tls: isTls ? {} : undefined,
  retryStrategy: (times) => {
    if (times > 10) return null;
    return Math.min(times * 200, 3000);
  },
});

redis.on('connect', () => {
  console.log('[Redis] Connected');
});

redis.on('ready', () => {
  console.log('[Redis] Ready');
});

redis.on('close', () => {
  console.log('[Redis] Connection closed');
});

redis.on('error', (err) => {
  if (err.message.includes('ECONNRESET') || err.message.includes('ETIMEDOUT')) {
    return;
  }
  console.error('[Redis] Error:', err.message);
});
