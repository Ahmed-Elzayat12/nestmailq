import { getQueueToken } from "@nestjs/bullmq";
import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Queue } from "bullmq";
import {
  EMAIL_JOB_SEND_NAME,
  EMAIL_QUEUE_NAME,
} from "../email/email.constants";
import { SendEmailJob } from "./email-queue.types";

@Injectable()
export class EmailQueueService implements OnModuleInit {
  private readonly logger = new Logger(EmailQueueService.name);
  private queue?: Queue<SendEmailJob>;

  constructor(
    private readonly moduleRef: ModuleRef,
    @Inject(EMAIL_QUEUE_NAME) private readonly queueName: string,
    @Inject(EMAIL_JOB_SEND_NAME) private readonly sendJobName: string,
  ) {}

  onModuleInit(): void {
    this.queue = this.moduleRef.get<Queue<SendEmailJob>>(
      getQueueToken(this.queueName),
      { strict: false },
    );

    if (!this.queue) {
      throw new Error(`Queue not found for name: ${this.queueName}`);
    }
  }

  async enqueueEmail(job: SendEmailJob): Promise<string> {
    if (!this.queue) {
      throw new Error('Email queue is not initialized');
    }

    const queued = await this.queue.add(this.sendJobName, job);
    this.logger.log(`Queued email job ${queued.id} for ${job.to}`);
    return String(queued.id);
  }
}
