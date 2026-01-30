import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { User } from 'src/auth/user.entity';
import { DataSource, DeleteResult, Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { TaskStatus } from './task-status.enum';
import { Task } from './task.entity';

@Injectable()
export class TasksRepository {
  private readonly logger = new Logger(TasksRepository.name);
  private readonly taskRepo: Repository<Task>;

  constructor(@InjectDataSource() dataSource: DataSource) {
    this.taskRepo = dataSource.getRepository(Task);
  }

  async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    const { status, search } = filterDto;

    const query = this.taskRepo.createQueryBuilder('task');
    query.where('task.userId = :userId', { userId: user.id });

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    try {
      return await query.getMany();
    } catch (error: any) {
      this.logger.error(
        `Failed to get tasks for user "${user.username}". Filters: ${JSON.stringify(filterDto)}`,
        (error as { stack?: string } | undefined)?.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async findByIdAndUser(id: string, user: User): Promise<Task | null> {
    return await this.taskRepo.findOne({
      where: { id, user: { id: user.id } },
    });
  }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const task = this.taskRepo.create({
      ...createTaskDto,
      status: TaskStatus.OPEN,
      user,
    });
    return await this.taskRepo.save(task);
  }

  async deleteByIdAndUser(id: string, user: User): Promise<DeleteResult> {
    return await this.taskRepo.delete({ id, user: { id: user.id } });
  }

  async save(task: Task): Promise<Task> {
    return await this.taskRepo.save(task);
  }
}
