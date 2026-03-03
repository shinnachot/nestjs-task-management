import { Injectable, Logger } from '@nestjs/common';
import { Temperatures } from './temperatures.entity';
import { TemperaturesRepository } from './temperatures.repository';
import { CreateTemperatureDto } from './dto/create-temperature.dto';

@Injectable()
export class TemperaturesService {
  private readonly logger = new Logger('TemperaturesService');

  constructor(private readonly temperaturesRepository: TemperaturesRepository) {}

  getTemperatures(): Promise<Temperatures[]> {
    return this.temperaturesRepository.getTemperatures();
  }

  createTemperature(createTemperatureDto: CreateTemperatureDto): Promise<Temperatures> {
    return this.temperaturesRepository.createTemperature(createTemperatureDto);
  }
}
