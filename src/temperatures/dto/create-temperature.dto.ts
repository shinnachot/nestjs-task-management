import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateTemperatureDto {
  @IsNotEmpty()
  @ApiProperty()
  temperature: number;
}
