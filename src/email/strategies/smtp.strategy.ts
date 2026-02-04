import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailTemplateService } from '../email-template.service';
import {
  EmailAttachment,
  EmailTemplateContext,
  IEmailStrategy,
} from '../interfaces/email-strategy.interface';

@Injectable()
export class SmtpStrategy implements IEmailStrategy {
  private readonly logger = new Logger(SmtpStrategy.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(
    private readonly config: ConfigService,
    private readonly templateService: EmailTemplateService,
  ) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<number>('SMTP_PORT', 587));
    const secure = this.config.get<string>('SMTP_SECURE', 'false') === 'true';
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    this.from = this.config.get<string>('EMAIL_FROM', 'no-reply@example.com');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
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

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      html,
      attachments: attachments.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });

    this.logger.log(`SMTP email sent to ${to}`);
  }
}
