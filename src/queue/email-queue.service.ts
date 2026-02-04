import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";
import { EMAIL_JOB_SEND, EMAIL_QUEUE } from "../email/email.constants";
import { SendEmailJob } from "./email-queue.types";

@Injectable()
export class EmailQueueService {
	private readonly logger = new Logger(EmailQueueService.name);

	constructor(
		@InjectQueue(EMAIL_QUEUE) private readonly queue: Queue<SendEmailJob>,
	) {}

	async enqueueEmail(job: SendEmailJob): Promise<string> {
		const queued = await this.queue.add(EMAIL_JOB_SEND, job);
		this.logger.log(`Queued email job ${queued.id} for ${job.to}`);
		return String(queued.id);
	}
}
