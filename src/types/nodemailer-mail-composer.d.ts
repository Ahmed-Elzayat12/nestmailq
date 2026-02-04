declare module 'nodemailer/lib/mail-composer' {
  interface MailComposerOptions {
    from?: string;
    to?: string | string[];
    subject?: string;
    html?: string;
    attachments?: Array<{
      filename?: string;
      content?: Buffer | string;
      contentType?: string;
    }>;
  }

  export default class MailComposer {
    constructor(options: MailComposerOptions);
    compile(): {
      build(
        callback: (error: Error | null, message: Buffer | string) => void,
      ): void;
    };
  }
}
