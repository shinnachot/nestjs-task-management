// src/cache/cache.service.ts
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async setCache(key: string, value: string): Promise<void> {
    console.log(`Setting cache with key: ${key}, value: ${value}`);
    // TTL is milliseconds in @nestjs/cache-manager (v3) / cache-manager (v6)
    await this.cache.set(key, value, 60_000);
  }

  async getCache(key: string): Promise<string | undefined> {
    console.log(`Fetching cache for key: ${key}`);
    const result = await this.cache.get<string>(key);
    return result ?? undefined;
  }

  async delCache(key: string): Promise<void> {
    await this.cache.del(key);
  }
}
