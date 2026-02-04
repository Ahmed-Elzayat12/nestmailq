import { Inject, Injectable } from '@nestjs/common';
import { EMAIL_STRATEGY } from './email.constants';
import {
  EmailAttachment,
  EmailTemplateContext,
  IEmailStrategy,
} from './interfaces/email-strategy.interface';

@Injectable()
export class EmailService {
  constructor(
    @Inject(EMAIL_STRATEGY) private readonly strategy: IEmailStrategy,
  ) {}

  async send(
    to: string,
    subject: string,
    template: string,
    context: EmailTemplateContext,
    attachments?: EmailAttachment[],
  ): Promise<void> {
    await this.strategy.send(to, subject, template, context, attachments);
  }
}
