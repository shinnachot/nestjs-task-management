import { IsEnum, IsNotEmpty } from 'class-validator';
import { TaskStatus } from '../task-status.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsNotEmpty()
  @ApiProperty()
  title: string;
}
