import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailTemplateService } from './email-template.service';
import { EMAIL_STRATEGY } from './email.constants';
import { EmailService } from './email.service';
import { SesStrategy } from './strategies/ses.strategy';
import { SmtpStrategy } from './strategies/smtp.strategy';

@Module({
  imports: [ConfigModule],
  providers: [
    EmailTemplateService,
    SmtpStrategy,
    SesStrategy,
    {
      provide: EMAIL_STRATEGY,
      inject: [ConfigService, SmtpStrategy, SesStrategy],
      useFactory: (
        config: ConfigService,
        smtp: SmtpStrategy,
        ses: SesStrategy,
      ) => {
        const driver = config
          .get<string>('EMAIL_DRIVER', 'smtp')
          .toLowerCase();
        if (driver === 'smtp') {
          return smtp;
        }
        if (driver === 'ses') {
          return ses;
        }
        throw new Error(`Unsupported EMAIL_DRIVER: ${driver}`);
      },
    },
    EmailService,
  ],
  exports: [EmailService, EMAIL_STRATEGY, EmailTemplateService],
})
export class EmailModule {}
