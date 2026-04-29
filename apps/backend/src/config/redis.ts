import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect', () => {
  console.log('[Redis] Connected');
});

redis.on('error', (err) => {
  console.error('[Redis] Error:', err.message);
});
