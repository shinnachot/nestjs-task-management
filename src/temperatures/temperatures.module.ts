import { Module } from '@nestjs/common';
import { TemperaturesController } from './temperatures.controller';
import { TemperaturesService } from './temperatures.service';
import { TemperaturesRepository } from './temperatures.repository';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { AppRedisModule } from 'src/redis.module';

@Module({
  imports: [AppRedisModule, ConfigModule, AuthModule],
  controllers: [TemperaturesController],
  providers: [TemperaturesService, TemperaturesRepository],
})
export class TemperaturesModule {}
