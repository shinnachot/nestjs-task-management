import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis, { type RedisOptions } from 'ioredis';
import { RedisKeyvStore } from './redis-keyv.store';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('REDIS_URL');
        const host = configService.get<string>('REDIS_HOST') ?? '127.0.0.1';
        const port = Number(configService.get<string>('REDIS_PORT') ?? 6379);
        const password = configService.get<string>('REDIS_PASSWORD');
        const db = configService.get<string>('REDIS_DB');

        const redisOptions: RedisOptions = {};
        if (password) {
          redisOptions.password = password;
        }
        if (db == null) {
          // leave unset
        } else {
          redisOptions.db = Number(db);
        }

        const redis = new Redis(url ?? `redis://${host}:${port}`, redisOptions);

        return {
          // TTL is milliseconds in @nestjs/cache-manager (v3) / cache-manager (v6)
          ttl: 60_000,
          namespace: 'nestjs-task-management',
          stores: new RedisKeyvStore(redis) as any,
        };
      },
    }),
  ],
  exports: [CacheModule], // Make CacheModule available to other modules
})
export class CacheConfigModule {}
