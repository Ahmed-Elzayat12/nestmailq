import { BullModule } from '@nestjs/bullmq';
import {
  DynamicModule,
  FactoryProvider,
  Module,
  ModuleMetadata,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { URL } from 'node:url';
import {
  DEFAULT_EMAIL_JOB_SEND,
  DEFAULT_EMAIL_QUEUE,
  EMAIL_JOB_SEND_NAME,
  EMAIL_QUEUE_NAME,
} from '../email/email.constants';
import { EmailModule } from '../email/email.module';
import { EmailProcessor } from './email.processor';
import { EmailQueueService } from './email-queue.service';

export interface EmailQueueModuleOptions {
  queueName?: string;
  sendJobName?: string;
}

export interface EmailQueueModuleAsyncOptions {
  imports?: ModuleMetadata['imports'];
  inject?: FactoryProvider['inject'];
  useFactory: FactoryProvider['useFactory'];
}

const EMAIL_QUEUE_OPTIONS = 'EMAIL_QUEUE_OPTIONS';

@Module({})
class EmailQueueOptionsModule {}

@Module({})
export class EmailQueueModule {
  static register(options: EmailQueueModuleOptions = {}): DynamicModule {
    const queueName = options.queueName ?? DEFAULT_EMAIL_QUEUE;
    const sendJobName = options.sendJobName ?? DEFAULT_EMAIL_JOB_SEND;

    return {
      module: EmailQueueModule,
      imports: [
        ConfigModule,
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            const redisUrl = new URL(
              config.get<string>('REDIS_URL', 'redis://localhost:6379'),
            );

            return {
              connection: {
                host: redisUrl.hostname,
                port: Number(redisUrl.port || 6379),
                username: redisUrl.username || undefined,
                password: redisUrl.password || undefined,
              },
            };
          },
        }),
        BullModule.registerQueue({
          name: queueName,
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 30000 },
            removeOnComplete: true,
            removeOnFail: false,
          },
        }),
        EmailModule,
      ],
      providers: [
        { provide: EMAIL_QUEUE_NAME, useValue: queueName },
        { provide: EMAIL_JOB_SEND_NAME, useValue: sendJobName },
        EmailQueueService,
        EmailProcessor,
      ],
      exports: [EmailQueueService, EMAIL_QUEUE_NAME, EMAIL_JOB_SEND_NAME],
    };
  }

  static registerAsync(options: EmailQueueModuleAsyncOptions): DynamicModule {
    const optionsModule: DynamicModule = {
      module: EmailQueueOptionsModule,
      imports: options.imports ?? [],
      providers: [
        {
          provide: EMAIL_QUEUE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
      ],
      exports: [EMAIL_QUEUE_OPTIONS],
    };

    return {
      module: EmailQueueModule,
      providers: [
        {
          provide: EMAIL_QUEUE_NAME,
          useFactory: async (resolved: EmailQueueModuleOptions) =>
            resolved.queueName ?? DEFAULT_EMAIL_QUEUE,
          inject: [EMAIL_QUEUE_OPTIONS],
        },
        {
          provide: EMAIL_JOB_SEND_NAME,
          useFactory: async (resolved: EmailQueueModuleOptions) =>
            resolved.sendJobName ?? DEFAULT_EMAIL_JOB_SEND,
          inject: [EMAIL_QUEUE_OPTIONS],
        },
        EmailQueueService,
        EmailProcessor,
      ],
      imports: [
        ConfigModule,
        optionsModule,
        ...(options.imports ?? []),
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            const redisUrl = new URL(
              config.get<string>('REDIS_URL', 'redis://localhost:6379'),
            );

            return {
              connection: {
                host: redisUrl.hostname,
                port: Number(redisUrl.port || 6379),
                username: redisUrl.username || undefined,
                password: redisUrl.password || undefined,
              },
            };
          },
        }),
        BullModule.registerQueueAsync({
          imports: [optionsModule],
          inject: [EMAIL_QUEUE_OPTIONS],
          useFactory: async (resolved: EmailQueueModuleOptions) => ({
            name: resolved.queueName ?? DEFAULT_EMAIL_QUEUE,
            defaultJobOptions: {
              attempts: 3,
              backoff: { type: 'exponential', delay: 30000 },
              removeOnComplete: true,
              removeOnFail: false,
            },
          }),
        }),
        EmailModule,
      ],
      exports: [EmailQueueService, EMAIL_QUEUE_NAME, EMAIL_JOB_SEND_NAME],
    };
  }
}
