// src/cache/cache.controller.ts
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CacheService } from './cache.service';

@Controller('cache')
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  @Post('set')
  async setCache(@Body() body: { key: string; value: string }) {
    console.log(body.key, body.value);
    await this.cacheService.setCache(body.key, body.value);
    return { message: 'Cache set successfully' };
  }

  @Get('get/:key')
  async getCache(@Param('key') key: string) {
    const value = await this.cacheService.getCache(key);
    return value ? { key, value } : { message: 'Cache not found' };
  }

  @Delete('delete/:key')
  async deleteCache(@Param('key') key: string) {
    await this.cacheService.delCache(key);
    return { message: 'Cache deleted successfully' };
  }
}
