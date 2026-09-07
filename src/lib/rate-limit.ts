import Redis from "ioredis";

type MemoryEntry = { count: number; expiresAt: number };
const memory = new Map<string, MemoryEntry>();
let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 })
    : null;
  return redis;
}

export async function consumeRateLimit(key: string, limit = 20, windowSeconds = 60) {
  const client = getRedis();
  if (client) {
    try {
      if (client.status === "wait") await client.connect();
      const redisKey = `rate-limit:${key}`;
      const count = await client.incr(redisKey);
      if (count === 1) await client.expire(redisKey, windowSeconds);
      return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
    } catch (error) {
      console.warn("rate_limit.redis_fallback", { message: String(error) });
    }
  }

  const now = Date.now();
  const current = memory.get(key);
  const entry =
    !current || current.expiresAt <= now
      ? { count: 1, expiresAt: now + windowSeconds * 1000 }
      : { ...current, count: current.count + 1 };
  memory.set(key, entry);
  return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count) };
}
