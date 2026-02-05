import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/tasks/dto/jwt-payload.interface';
import { UsersRepository } from './users.repository';
import { Cache } from 'cache-manager';

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
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedHash = await this.getRefreshTokenHash(user.id);
    if (!storedHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await bcrypt.compare(refreshToken, storedHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newAccessToken = await this.signAccessToken({ username: user.username });
    const newRefreshToken = await this.signRefreshToken({ username: user.username });
    await this.setRefreshTokenHash(user.id, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string): Promise<void> {
    await this.deleteRefreshTokenHash(userId);
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
    return this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '60s';
  }

  private getRefreshExpiresIn(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
  }

  private buildRefreshTokenCacheKey(userId: string): string {
    return `auth:rt_hash:user:${userId}`;
  }

  private parseExpiresInToMs(expiresIn: string): number | undefined {
    const raw = expiresIn.trim();
    const re = /^(\d+)\s*(ms|s|m|h|d)?$/i;
    const match = re.exec(raw);
    if (!match) return undefined;

    const amount = Number(match[1]);
    const unit = (match[2] ?? 's').toLowerCase();
    if (!Number.isFinite(amount)) return undefined;

    switch (unit) {
      case 'ms':
        return amount;
      case 's':
        return amount * 1000;
      case 'm':
        return amount * 60 * 1000;
      case 'h':
        return amount * 60 * 60 * 1000;
      case 'd':
        return amount * 24 * 60 * 60 * 1000;
      default:
        return undefined;
    }
  }

  private async getRefreshTokenHash(userId: string): Promise<string | null> {
    const key = this.buildRefreshTokenCacheKey(userId);
    const value = await this.cacheManager.get<string>(key);
    return value ?? null;
  }

  private async deleteRefreshTokenHash(userId: string): Promise<void> {
    const key = this.buildRefreshTokenCacheKey(userId);
    await this.cacheManager.del(key);
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
    const key = this.buildRefreshTokenCacheKey(userId);
    const ttlMs = this.parseExpiresInToMs(this.getRefreshExpiresIn());
    if (ttlMs) {
      await this.cacheManager.set(key, hash, ttlMs);
    } else {
      await this.cacheManager.set(key, hash);
    }
  }
}
