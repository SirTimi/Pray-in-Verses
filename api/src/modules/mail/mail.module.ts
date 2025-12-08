// src/mail/mail.module.ts
import { Module, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { MailService } from './mail.service';

@Injectable()
class MailInit implements OnModuleInit {
  private readonly logger = new Logger(MailInit.name);
  constructor(private readonly mail: MailService) {}

  async onModuleInit() {
    // Toggle with MAIL_VERIFY_ON_BOOT=false to skip startup verify
    const shouldVerify = String(process.env.MAIL_VERIFY_ON_BOOT ?? 'true') === 'true';
    if (!shouldVerify) return;

    try {
      const ok = await this.mail.verify();
      if (!ok) this.logger.warn('Mail transport NOT verified (continuing).');
    } catch (e: any) {
      this.logger.warn(`Mail verify threw: ${e?.message || e}`);
    }
  }
}

@Module({
  providers: [MailService, MailInit],
  exports: [MailService],
})
export class MailModule {}
