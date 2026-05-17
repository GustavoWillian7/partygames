import Redis from 'ioredis';
import { env } from './env';

const isTls = env.REDIS_URL.startsWith('rediss://');

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  connectTimeout: 10000,
  enableReadyCheck: false,
  enableOfflineQueue: true,
  maxRetriesPerRequest: null,
  family: 0,
  tls: isTls
    ? {
        rejectUnauthorized: false,
      }
    : undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 500, 5000);
    console.log(`[Redis] Retry attempt ${times}, next delay ${delay}ms`);
    return delay;
  },
  reconnectOnError: (err) => {
    const retryErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EPIPE', 'CONNECTION_CLOSED'];
    if (retryErrors.some((e) => err.message.includes(e))) {
      console.log('[Redis] Reconnecting due to:', err.message);
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
  if (err.message.includes('ECONNRESET') || err.message.includes('ETIMEDOUT') || err.message.includes('EPIPE')) {
    return;
  }
  console.error('[Redis] Error:', err.message);
});

redis.on('reconnecting', (delay: number) => {
  console.log(`[Redis] Reconnecting in ${delay}ms...`);
});

// Heartbeat manual: ping a cada 25s para manter conexão viva no Upstash
const HEARTBEAT_INTERVAL = 25_000;

function startHeartbeat() {
  setInterval(() => {
    if (redis.status === 'ready') {
      redis.ping().catch(() => {
        // ignorar erro de ping, o reconnectOnError já lida
      });
    }
  }, HEARTBEAT_INTERVAL);
}

export async function connectRedis(): Promise<void> {
  if (redis.status === 'ready' || redis.status === 'connecting') {
    return;
  }
  try {
    await redis.connect();
    startHeartbeat();
    console.log('[Redis] Manual connect succeeded');
  } catch (err) {
    console.error('[Redis] Manual connect failed:', err instanceof Error ? err.message : err);
    throw err;
  }
}
