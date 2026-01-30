import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import Redis from 'ioredis';
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
  private static readonly tasksListCachePrefix = 'tasks|user:';

  constructor(
    @InjectDataSource() dataSource: DataSource,
    @InjectRedis() private readonly redis: Redis,
  ) {
    this.taskRepo = dataSource.getRepository(Task);
  }

  private formatUnknownError(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  async invalidateTasksListCache(userId: string): Promise<void> {
    const matchPattern = `${TasksRepository.tasksListCachePrefix}${userId}|*`;
    console.log('matchPattern', matchPattern);
    try {
      const stream = this.redis.scanStream({ match: matchPattern, count: 100 });
      stream.on('data', (keys: string[]) => {
        if (keys.length === 0) return;
        void this.redis.del(...keys);
      });
      await new Promise<void>((resolve, reject) => {
        stream.on('end', () => resolve());
        stream.on('error', reject);
      });
    } catch (error: unknown) {
      this.logger.warn(
        `Redis cache invalidation failed (pattern="${matchPattern}"): ${this.formatUnknownError(error)}`,
      );
    }
  }

  async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    const { status, search } = filterDto;

    const cacheTtlSeconds = 300;
    const cacheKey = [
      'tasks',
      `user:${user.id}`,
      `status:${status ?? 'all'}`,
      `search:${(search ?? '').trim().toLowerCase()}`,
    ].join('|');

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as Task[];
      }
    } catch (error: unknown) {
      this.logger.warn(
        `Redis cache read failed (key="${cacheKey}"): ${this.formatUnknownError(error)}`,
      );
    }

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
      const tasks = await query.getMany();
      try {
        await this.redis.set(cacheKey, JSON.stringify(tasks), 'EX', cacheTtlSeconds);
      } catch (error: unknown) {
        this.logger.warn(
          `Redis cache write failed (key="${cacheKey}"): ${this.formatUnknownError(error)}`,
        );
      }
      return tasks;
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
    const saved = await this.taskRepo.save(task);
    await this.invalidateTasksListCache(user.id);
    return saved;
  }

  async deleteByIdAndUser(id: string, user: User): Promise<DeleteResult> {
    const result = await this.taskRepo.delete({ id, user: { id: user.id } });
    if (result.affected && result.affected > 0) {
      await this.invalidateTasksListCache(user.id);
    }
    return result;
  }

  async save(task: Task): Promise<Task> {
    return await this.taskRepo.save(task);
  }
}
