import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Job, Queue, Worker } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';
import { EmailService } from '../email/email.service';
import { EMAIL_JOB_SEND_NAME, EMAIL_QUEUE_NAME } from '../email/email.constants';
import { SendEmailJob } from './email-queue.types';

@Injectable()
export class EmailProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailProcessor.name);
  private worker?: Worker<SendEmailJob>;

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly emailService: EmailService,
    @Inject(EMAIL_QUEUE_NAME) private readonly queueName: string,
    @Inject(EMAIL_JOB_SEND_NAME) private readonly sendJobName: string,
  ) {}

  onModuleInit(): void {
    const queue = this.moduleRef.get<Queue<SendEmailJob>>(
      getQueueToken(this.queueName),
      { strict: false },
    );

    if (!queue) {
      throw new Error(`Queue not found for name: ${this.queueName}`);
    }

    const connection = queue.opts.connection;
    this.worker = new Worker<SendEmailJob>(
      this.queueName,
      async (job: Job<SendEmailJob>) => {
        if (job.name !== this.sendJobName) {
          this.logger.warn(`Unsupported job name: ${job.name}`);
          return;
        }

        const { to, subject, template, context, attachments } = job.data;
        this.logger.log(`Processing email job for ${to}`);

        await this.emailService.send(
          to,
          subject,
          template,
          context,
          (attachments ?? []).map((attachment) => ({
            filename: attachment.filename,
            content: Buffer.from(
              attachment.content,
              attachment.encoding ?? 'base64',
            ),
            contentType: attachment.contentType,
          })),
        );

        this.logger.log(`Email job completed for ${to}`);
      },
      { connection },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, error) => {
      const jobId = job?.id ?? 'unknown';
      this.logger.error(`Job ${jobId} failed: ${error.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
