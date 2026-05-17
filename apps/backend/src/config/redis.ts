import Redis from 'ioredis';
import { env } from './env';

const isTls = env.REDIS_URL.startsWith('rediss://');

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  keepAlive: 10000,
  connectTimeout: 10000,
  enableReadyCheck: false,
  enableOfflineQueue: true,
  maxRetriesPerRequest: null,
  tls: isTls ? {} : undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 200, 3000);
    console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${times})`);
    return delay;
  },
  reconnectOnError: (err) => {
    const msg = err.message;
    if (msg.includes('READONLY') || msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT')) {
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

redis.on('reconnecting', () => {
  console.log('[Redis] Reconnecting...');
});

redis.on('end', () => {
  console.log('[Redis] Connection ended');
});

redis.on('error', (err) => {
  const msg = err.message;
  if (msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT')) {
    console.log('[Redis] Connection lost (will retry):', msg);
    return;
  }
  console.error('[Redis] Error:', msg);
});

// Conecta explicitamente e mantém vivo com ping a cada 30s
redis.connect().catch(() => {
  // Falha silenciosa — o retryStrategy vai tentar novamente
});

const PING_INTERVAL_MS = 30_000;
setInterval(() => {
  if (redis.status === 'ready') {
    redis.ping().catch(() => {
      // Ignora erros de ping — o ioredis cuida da reconexão
    });
  }
}, PING_INTERVAL_MS);
