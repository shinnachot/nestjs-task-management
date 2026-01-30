import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { User } from 'src/auth/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { TaskStatus } from './task-status.enum';
import { Task } from './task.entity';
import { TasksRepository } from './tasks.repository';

@Injectable()
export class TasksService {
  private readonly logger = new Logger('TasksService');

  constructor(
    private readonly tasksRepository: TasksRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private buildTaskCacheKey(id: string, userId: string): string {
    return `task_${id}_user_${userId}`;
  }

  async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    return this.tasksRepository.getTasks(filterDto, user);
  }

  async getTaskById(id: string, user: User): Promise<Task> {
    const cacheKey = this.buildTaskCacheKey(id, user.id);
    const ttlMs = 60_000;

    try {
      return await this.cacheManager.wrap(
        cacheKey,
        async () => {
          const found = await this.tasksRepository.findByIdAndUser(id, user);
          if (!found) {
            throw new NotFoundException(`Task with ID "${id}" not found`);
          }
          return found;
        },
        ttlMs,
      );
    } catch (error: unknown) {
      // If Redis/cache is down, still serve from DB.
      this.logger.warn(
        `Cache wrap failed for key "${cacheKey}": ${error instanceof Error ? error.message : String(error)}`,
      );
      const found = await this.tasksRepository.findByIdAndUser(id, user);
      if (!found) {
        throw new NotFoundException(`Task with ID "${id}" not found`);
      }
      return found;
    }
  }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    return await this.tasksRepository.createTask(createTaskDto, user);
  }

  async deleteTask(id: string, user: User): Promise<void> {
    const result = await this.tasksRepository.deleteByIdAndUser(id, user);
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    // prevent stale cache for "getTaskById"
    await this.cacheManager.del(this.buildTaskCacheKey(id, user.id));
  }

  async updateTaskStatus(id: string, status: TaskStatus, title: string, user: User): Promise<Task> {
    const task = await this.getTaskById(id, user);
    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    task.status = status;
    task.title = title;
    await this.tasksRepository.save(task);
    // prevent stale cache for "getTaskById" + list cache
    await this.cacheManager.del(this.buildTaskCacheKey(id, user.id));
    await this.tasksRepository.invalidateTasksListCache(user.id);

    return task;
  }
}
