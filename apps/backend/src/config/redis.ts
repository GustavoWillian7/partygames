import Redis from 'ioredis';
import { env } from './env';

const isTls = env.REDIS_URL.startsWith('rediss://');

export const redis = new Redis(env.REDIS_URL, {
  keepAlive: 30000,
  connectTimeout: 15000,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  tls: isTls ? {} : undefined,
  retryStrategy: (times) => {
    if (times > 5) return null;
    return Math.min(times * 100, 2000);
  },
});

redis.on('connect', () => {
  console.log('[Redis] Connected');
});

redis.on('ready', () => {
  console.log('[Redis] Ready');
});

redis.on('error', (err) => {
  const msg = err.message;
  if (msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT')) {
    return;
  }
  console.error('[Redis] Error:', msg);
});
