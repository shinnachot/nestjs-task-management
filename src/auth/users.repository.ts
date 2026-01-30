import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { User } from 'src/auth/user.entity';
import { DataSource, Repository } from 'typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);
  private readonly userRepo: Repository<User>;

  constructor(@InjectDataSource() dataSource: DataSource) {
    this.userRepo = dataSource.getRepository(User);
  }

  async createUser(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const { username, password } = authCredentialsDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepo.create({ username, password: hashedPassword });

    try {
      await this.userRepo.save(user);
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === '23505') {
        // duplicate username
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
}
