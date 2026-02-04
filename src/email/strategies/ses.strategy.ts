import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendRawEmailCommand, SESClient } from '@aws-sdk/client-ses';
import MailComposer from 'nodemailer/lib/mail-composer';
import { EmailTemplateService } from '../email-template.service';
import {
  EmailAttachment,
  EmailTemplateContext,
  IEmailStrategy,
} from '../interfaces/email-strategy.interface';

@Injectable()
export class SesStrategy implements IEmailStrategy {
  private readonly logger = new Logger(SesStrategy.name);
  private readonly client: SESClient;
  private readonly from: string;

  constructor(
    private readonly config: ConfigService,
    private readonly templateService: EmailTemplateService,
  ) {
    const region = this.config.get<string>('SES_REGION', 'us-east-1');
    const accessKeyId = this.config.get<string>('SES_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('SES_SECRET_ACCESS_KEY');

    this.from = this.config.get<string>('EMAIL_FROM', 'no-reply@example.com');

    this.client = new SESClient({
      region,
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey }
          : undefined,
    });
  }

  async send(
    to: string,
    subject: string,
    template: string,
    context: EmailTemplateContext,
    attachments: EmailAttachment[] = [],
  ): Promise<void> {
    const html = await this.templateService.render(template, context);
    const raw = await this.buildRawEmail({
      from: this.from,
      to,
      subject,
      html,
      attachments,
    });

    await this.client.send(
      new SendRawEmailCommand({
        RawMessage: { Data: raw },
      }),
    );

    this.logger.log(`SES email sent to ${to}`);
  }

  private async buildRawEmail({
    from,
    to,
    subject,
    html,
    attachments,
  }: {
    from: string;
    to: string;
    subject: string;
    html: string;
    attachments: EmailAttachment[];
  }): Promise<Buffer> {
    const composer = new MailComposer({
      from,
      to,
      subject,
      html,
      attachments: attachments.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });

    return new Promise((resolve, reject) => {
      composer.compile().build((error: Error | null, message: Buffer | string) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(message as Buffer);
      });
    });
  }
}
