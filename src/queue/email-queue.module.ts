import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';
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
}
