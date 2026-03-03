import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/user.entity';
import { CacheModule } from './cache/cache.module'; // Import CacheModule
import { configValidationSchema } from './config.schema';
import { Product } from './product/product.entity';
import { ProductModule } from './product/product.module';
import { Task } from './tasks/task.entity';
import { TasksModule } from './tasks/tasks.module';
import { Temperatures } from './temperatures/temperatures.entity';
import { TemperaturesModule } from './temperatures/temperatures.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.TCP,
        options: { port: 4001 },
      },
      {
        name: 'ORDER_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'order_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
    ConfigModule.forRoot({
      envFilePath: [`.env.stage.${process.env.STAGE}`],
      validationSchema: configValidationSchema,
    }),
    CacheModule,
    TasksModule,
    ProductModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [User, Task, Product, Temperatures],
        synchronize: true,
      }),
    }),
    AuthModule,
    TemperaturesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
