// src/cache/cache.module.ts
import { Module } from '@nestjs/common';
import { CacheConfigModule } from './cache-config.module'; // Import CacheConfigModule
import { CacheController } from './cache.controller';
import { CacheService } from './cache.service';

@Module({
  imports: [CacheConfigModule], // Ensure CacheConfigModule is included
  providers: [CacheService],
  controllers: [CacheController],
})
export class CacheModule {}
