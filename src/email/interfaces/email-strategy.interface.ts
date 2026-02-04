export type EmailTemplateContext = Record<string, unknown>;

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface IEmailStrategy {
  send(
    to: string,
    subject: string,
    template: string,
    context: EmailTemplateContext,
    attachments?: EmailAttachment[],
  ): Promise<void>;
}
