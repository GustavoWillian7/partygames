import Redis from 'ioredis';
import { env } from './env';

const isTls = env.REDIS_URL.startsWith('rediss://');

export const redis = new Redis(env.REDIS_URL, {
  keepAlive: 30000,
  connectTimeout: 30000,
  enableReadyCheck: false,
  enableOfflineQueue: true,
  maxRetriesPerRequest: null,
  tls: isTls ? {} : undefined,
  retryStrategy: (times) => {
    return Math.min(times * 500, 5000);
  },
  reconnectOnError: (err) => {
    const retryErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EPIPE'];
    if (retryErrors.some((e) => err.message.includes(e))) {
      return true;
    }
    return false;
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

redis.on('reconnecting', () => {
  console.log('[Redis] Reconnecting...');
});
