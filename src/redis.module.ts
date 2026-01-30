import { RedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('REDIS_URL');
        const host = configService.get<string>('REDIS_HOST') ?? '127.0.0.1';
        const port = Number(configService.get<string>('REDIS_PORT') ?? 6379);
        const password = configService.get<string>('REDIS_PASSWORD');
        const db = configService.get<string>('REDIS_DB');

        const options: Record<string, unknown> = {};
        if (password) {
          options.password = password;
        }
        if (db == null) {
          // leave unset
        } else {
          options.db = Number(db);
        }

        return {
          type: 'single',
          url: url ?? `redis://${host}:${port}`,
          options,
        };
      },
    }),
  ],
  exports: [RedisModule],
})
export class AppRedisModule {}
