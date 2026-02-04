import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import Handlebars from 'handlebars';
import { EmailTemplateContext } from './interfaces/email-strategy.interface';

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);
  private readonly cache = new Map<string, Handlebars.TemplateDelegate>();

  async render(template: string, context: EmailTemplateContext): Promise<string> {
    const compiled = await this.loadTemplate(template);
    return compiled(context);
  }

  private async loadTemplate(
    template: string,
  ): Promise<Handlebars.TemplateDelegate> {
    const cached = this.cache.get(template);
    if (cached) {
      return cached;
    }

    const templatePath = join(__dirname, '..', '..', 'templates', `${template}.hbs`);
    try {
      const content = await fs.readFile(templatePath, 'utf8');
      const compiled = Handlebars.compile(content, { strict: true });
      this.cache.set(template, compiled);
      return compiled;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to load template "${template}": ${message}`);
      throw error;
    }
  }
}
