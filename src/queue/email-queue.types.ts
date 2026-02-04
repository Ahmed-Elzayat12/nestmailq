import { EmailTemplateContext } from '../email/interfaces/email-strategy.interface';

export interface QueueEmailAttachment {
  filename: string;
  content: string;
  contentType?: string;
  encoding?: 'base64' | 'utf8';
}

export interface SendEmailJob {
  to: string;
  subject: string;
  template: string;
  context: EmailTemplateContext;
  attachments?: QueueEmailAttachment[];
}
