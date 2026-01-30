import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import * as memcachedStore from 'cache-manager-memcached-store';
import * as Memcache from 'memcache-pp';
import { AppRedisModule } from 'src/redis.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';

@Module({
  imports: [
    AppRedisModule,
    CacheModule.register({
      isGlobal: true,
      driver: Memcache,
      store: memcachedStore,
      options: {
        hosts: ['127.0.0.1:11211'],
        ttl: 3600,
      },
    }),
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksRepository],
})
export class TasksModule {}
