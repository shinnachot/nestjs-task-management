import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Max, Min } from 'class-validator';

@Entity()
export class Temperatures {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Min(-100)
  @Max(100)
  temperature: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
