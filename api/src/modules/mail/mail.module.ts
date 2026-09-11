// src/mail/mail.module.ts
import { Injectable, Logger, Module, OnModuleInit } from '@nestjs/common';
import { MailService } from './mail.service';

@Injectable()
class MailInit implements OnModuleInit {
  private readonly logger = new Logger(MailInit.name);

  constructor(private readonly mail: MailService) {}

  onModuleInit() {
    const shouldVerify =
      String(process.env.MAIL_VERIFY_ON_BOOT ?? 'false').toLowerCase() ===
      'true';

    if (!shouldVerify) {
      return;
    }

    // Mail availability must not hold the HTTP server startup hostage.
    // Verification is diagnostic only and runs in the background.
    void this.mail
      .verify()
      .then((ok) => {
        if (!ok) {
          this.logger.warn('Mail transport NOT verified (continuing).');
        }
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(`Mail verify threw: ${message}`);
      });
  }
}

@Module({
  providers: [MailService, MailInit],
  exports: [MailService],
})
export class MailModule {}
