# nestmailq

A NestJS email module with BullMQ queue support. Includes SMTP and SES strategies, Handlebars templating, and a built-in worker processor.

## Install

```bash
npm install nestmailq
```

## Peer Dependencies

Make sure these are installed in your NestJS app:

- `@nestjs/common`
- `@nestjs/core`
- `@nestjs/config`
- `@nestjs/bullmq`
- `bullmq`

## Usage

```ts
import { Module } from "@nestjs/common";
import { EmailModule, EmailQueueModule } from "nestmailq";

@Module({
	imports: [EmailModule, EmailQueueModule],
})
export class AppModule {}
```

Queue a message:

```ts
import { Injectable } from "@nestjs/common";
import { EmailQueueService } from "nestmailq";

@Injectable()
export class NotificationsService {
	constructor(private readonly emailQueue: EmailQueueService) {}

	async sendWelcomeEmail(email: string) {
		await this.emailQueue.enqueueEmail({
			to: email,
			subject: "Welcome!",
			template: "basic",
			context: { name: "My-Project" },
			attachments: [
				{
					filename: "welcome.txt",
					content: Buffer.from("Hello!").toString("base64"),
					contentType: "text/plain",
					encoding: "base64",
				},
			],
		});
	}
}
```

## Templates

Place Handlebars templates under `templates/` (shipped with the package). The default template path is resolved relative to the package root.

## Environment Variables

- `EMAIL_DRIVER` (`smtp` or `ses`)
- `EMAIL_FROM`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- `SES_REGION`, `SES_ACCESS_KEY_ID`, `SES_SECRET_ACCESS_KEY`
- `REDIS_URL`

## License

MIT
