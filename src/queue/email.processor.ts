import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from '../email/email.service';
import { EMAIL_JOB_SEND, EMAIL_QUEUE } from '../email/email.constants';
import { SendEmailJob } from './email-queue.types';

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<SendEmailJob>): Promise<void> {
    if (job.name !== EMAIL_JOB_SEND) {
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
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    const jobId = job?.id ?? 'unknown';
    this.logger.error(`Job ${jobId} failed: ${error.message}`);
  }
}
