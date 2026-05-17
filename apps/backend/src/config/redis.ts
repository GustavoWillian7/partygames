import Redis from 'ioredis';
import { env } from './env';

const isTls = env.REDIS_URL.startsWith('rediss://');

export const redis = new Redis(env.REDIS_URL, {
  keepAlive: 30000,
  enableReadyCheck: false,
  enableOfflineQueue: true,
  maxRetriesPerRequest: 3,
  tls: isTls ? {} : undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 200, 3000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('[Redis] Connected');
});

redis.on('reconnecting', () => {
  // Silencioso — evita spam de logs
});

redis.on('error', (err) => {
  // Só loga erros críticos que não são de conexão
  if (!err.message.includes('ECONNRESET') && !err.message.includes('ETIMEDOUT')) {
    console.error('[Redis] Error:', err.message);
  }
});
