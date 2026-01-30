import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/tasks/dto/jwt-payload.interface';
import { UsersRepository } from './users.repository';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userRepo: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    return this.userRepo.createUser(authCredentialsDto);
  }

  async signIn(authCredentialsDto: AuthCredentialsDto): Promise<AuthTokens> {
    const { username, password } = authCredentialsDto;
    const user = await this.userRepository.findOneBy({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      const payload: JwtPayload = { username };
      const accessToken = await this.signAccessToken(payload);
      const refreshToken = await this.signRefreshToken(payload);
      await this.setRefreshTokenHash(user.id, refreshToken);
      return { accessToken, refreshToken };
    } else {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const refreshSecret = this.getRefreshSecret();
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepository.findOneBy({ username: payload.username });
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newAccessToken = await this.signAccessToken({ username: user.username });
    const newRefreshToken = await this.signRefreshToken({ username: user.username });
    await this.setRefreshTokenHash(user.id, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.update({ id: userId }, { refreshTokenHash: null });
  }

  private getAccessSecret(): string {
    return (
      this.configService.get<string>('JWT_ACCESS_SECRET') ??
      this.configService.get<string>('JWT_SECRET') ??
      'defaultSecret'
    );
  }

  private getRefreshSecret(): string {
    return this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'defaultRefreshSecret';
  }

  private getAccessExpiresIn(): string {
    return this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '3600s';
  }

  private getRefreshExpiresIn(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
  }

  private async signAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.getAccessSecret(),
      expiresIn: this.getAccessExpiresIn(),
    });
  }

  private async signRefreshToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.getRefreshSecret(),
      expiresIn: this.getRefreshExpiresIn(),
    });
  }

  private async setRefreshTokenHash(userId: string, refreshToken: string): Promise<void> {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(refreshToken, salt);
    await this.userRepository.update({ id: userId }, { refreshTokenHash: hash });
  }
}
