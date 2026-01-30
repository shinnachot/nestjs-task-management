import type { KeyvStoreAdapter } from 'keyv';
import Redis from 'ioredis';

/**
 * Minimal Keyv store adapter backed by ioredis.
 *
 * Nest's CacheModule (@nestjs/cache-manager) wraps KeyvStoreAdapter into Keyv and
 * handles serialization/deserialization + default TTL (ms). This adapter only
 * needs to persist the payload and apply the per-key TTL when provided.
 */
export class RedisKeyvStore implements KeyvStoreAdapter {
  opts: Record<string, unknown> = {};
  namespace?: string;

  constructor(private readonly redis: Redis) {}

  on(_event: string, _listener: (...arguments_: any[]) => void) {
    // KeyvStoreAdapter requires an event emitter-like `on()`.
    // This adapter doesn't emit events, but returning `this` satisfies the interface.
    return this;
  }

  async get<Value>(key: string): Promise<Value | undefined> {
    const value = await this.redis.get(key);
    return value === null ? undefined : (value as Value);
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    const payload = typeof value === 'string' ? value : JSON.stringify(value);
    // TTL is in milliseconds (Keyv contract).
    if (typeof ttl === 'number') {
      await this.redis.set(key, payload, 'PX', ttl);
    } else {
      await this.redis.set(key, payload);
    }
    return true;
  }

  async delete(key: string): Promise<boolean> {
    const deleted = await this.redis.del(key);
    return deleted > 0;
  }

  async clear(): Promise<void> {
    // Note: this clears the whole selected Redis DB. Use a dedicated DB for cache.
    await this.redis.flushdb();
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}

