import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Temperatures } from './temperatures.entity';
import { CreateTemperatureDto } from './dto/create-temperature.dto';

@Injectable()
export class TemperaturesRepository {
  private readonly temperaturesRepo: Repository<Temperatures>;

  constructor(@InjectDataSource() dataSource: DataSource) {
    this.temperaturesRepo = dataSource.getRepository(Temperatures);
  }

  async getTemperatures(): Promise<Temperatures[]> {
    return await this.temperaturesRepo.find({ order: { created_at: 'DESC' } });
  }

  async createTemperature(createTemperatureDto: CreateTemperatureDto): Promise<Temperatures> {
    const temperature = this.temperaturesRepo.create({
      ...createTemperatureDto,
    });
    const saved = await this.temperaturesRepo.save(temperature);
    return saved;
  }
}
