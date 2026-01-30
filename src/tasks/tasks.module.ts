import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AppRedisModule } from 'src/redis.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';

@Module({
  imports: [AppRedisModule, ConfigModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [TasksController],
  providers: [TasksService, TasksRepository],
})
export class TasksModule {}
