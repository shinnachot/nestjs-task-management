import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import * as MemcachedStore from 'cache-manager-memcached-store';

@Module({
  imports: [
    CacheModule.register({
      store: MemcachedStore,
      host: 'localhost', // Memcache server
      port: 11211, // Default Memcache port
    }),
  ],
  exports: [CacheModule], // Make CacheModule available to other modules
})
export class CacheConfigModule {}
