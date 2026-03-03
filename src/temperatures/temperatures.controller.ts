import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TemperaturesService } from './temperatures.service';
import { Temperatures } from './temperatures.entity';
import { CreateTemperatureDto } from './dto/create-temperature.dto';

@Controller('temperatures')
@UseGuards(AuthGuard())
export class TemperaturesController {
  constructor(private temperaturesService: TemperaturesService) {}

  @Get()
  getTemperatures(): Promise<Temperatures[]> {
    return this.temperaturesService.getTemperatures();
  }

  @Post()
  createTask(@Body() createTemperatureDto: CreateTemperatureDto): Promise<Temperatures> {
    return this.temperaturesService.createTemperature(createTemperatureDto);
  }
}

