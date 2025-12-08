// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as SendGridNS from '@sendgrid/mail';

// Normalize ESM/CommonJS import shapes for SendGrid
const sgMail: typeof SendGridNS & { default?: any } =
  (SendGridNS as any)?.default ? (SendGridNS as any).default : (SendGridNS as any);

type Address = string | { name?: string; address: string };

interface SendOptions {
  to: Address | Address[];
  subject: string;
  html: string;
  text?: string;
  from?: Address;
  headers?: Record<string, string>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transport: nodemailer.Transporter | null = null;
  private usingSendgrid = false;

  constructor() {
    const sgKey = process.env.SENDGRID_API_KEY;
    if (sgKey) {
      try {
        sgMail.setApiKey(sgKey);
        this.usingSendgrid = true;
        this.logger.log('MailService: using SendGrid Web API');
      } catch (e: any) {
        this.logger.error(`SendGrid init failed: ${e?.message || e}`);
        this.usingSendgrid = false;
      }
    }
  }

  /* ---------------------------- Config ---------------------------- */

  private get fromName(): string {
    return process.env.MAIL_FROM_NAME || 'Pray in Verses';
  }

  private get fromAddress(): string {
    return process.env.MAIL_FROM || 'admin@prayinverses.com';
  }

  private get defaultFrom(): Address {
    return { name: this.fromName, address: this.fromAddress };
  }

  /**
   * Canonical base used to normalize links in emails.
   * - Prefers MAIL_LINK_BASE
   * - Strips any port
   * - Removes trailing slash
   */
  private get linkBase(): string {
    const raw =
      process.env.MAIL_LINK_BASE ||
      process.env.APP_BASE_URL ||
      process.env.WEB_BASE_URL ||
      'https://prayinverses.com';

    try {
      const u = new URL(raw);
      // Force no port in emails
      u.port = '';
      return u.toString().replace(/\/+$/, '');
    } catch {
      return 'https://prayinverses.com';
    }
  }

  /**
   * Ensure a link is absolute, uses the linkBase origin (protocol + hostname),
   * and has NO port (so no :3000 ever leaks).
   */
  private normalizeLink(link: string): string {
    try {
      const base = new URL(this.linkBase);
      const u = new URL(link || '/', base);

      // If incoming host is localhost/127.*, override to canonical domain
      const hostLower = (u.hostname || '').toLowerCase();
      if (
        hostLower === 'localhost' ||
        hostLower === '127.0.0.1' ||
        hostLower.endsWith('.local')
      ) {
        u.protocol = base.protocol;
        u.hostname = base.hostname;
      }

      // Always strip port and enforce protocol/hostname from base
      u.protocol = base.protocol;
      u.hostname = base.hostname;
      u.port = '';

      return u.toString();
    } catch {
      // Fallback: join to base safely
      const base = this.linkBase;
      if (!link) return base;
      return `${base}${link.startsWith('/') ? link : `/${link}`}`;
    }
  }

  /** Build & cache a Nodemailer transporter from env (cPanel-friendly). */
  private getTransporter(): nodemailer.Transporter {
    if (this.transport) return this.transport;

    const url = process.env.SMTP_URL;
    if (url) {
      this.transport = nodemailer.createTransport(url, {
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        connectionTimeout: 20_000,
        greetingTimeout: 15_000,
        socketTimeout: 30_000,
      } as any);
      this.logger.log('MailService: using SMTP via SMTP_URL (pooled)');
      return this.transport;
    }

    const host = process.env.SMTP_HOST || '';
    const port = Number(process.env.SMTP_PORT || 465);
    const secure = String(process.env.SMTP_SECURE ?? (port === 465 ? 'true' : 'false')) === 'true';
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    if (!host) throw new Error('SMTP_HOST is not set');

    this.transport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 20_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
    });

    this.logger.log(
      `MailService: using SMTP host=${host} port=${port} secure=${secure ? 'true' : 'false'} (pooled)`,
    );
    return this.transport;
  }

  async verify(): Promise<boolean> {
    if (this.usingSendgrid) return true;
    try {
      await this.getTransporter().verify();
      this.logger.log('MailService: SMTP transport verified');
      return true;
    } catch (e: any) {
      this.logger.error(`SMTP verify failed: ${e?.message || e}`);
      return false;
    }
  }

  /* ----------------------------- Send ----------------------------- */

  private toPlainAddress(a: Address): { name?: string; email: string } {
    if (typeof a === 'string') return { email: a };
    return { name: a.name, email: a.address };
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<\/(p|div|h\d|li)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  async send(opts: SendOptions): Promise<void> {
    const from = opts.from || this.defaultFrom;
    const text = opts.text ?? this.htmlToText(opts.html);

    if (this.usingSendgrid) {
      try {
        const toArray = Array.isArray(opts.to) ? opts.to : [opts.to];
        await sgMail.send({
          to: toArray.map((x) => this.toPlainAddress(x)),
          from: this.toPlainAddress(from),
          subject: opts.subject,
          html: opts.html,
          text,
          headers: opts.headers,
        } as any);
        this.logger.log(`SendGrid: sent → subject="${opts.subject}" to=${toArray.length}`);
        return;
      } catch (e: any) {
        this.logger.error(`SendGrid send failed: ${e?.message || e}`);
        if (e?.response?.body) this.logger.error(`SendGrid response: ${JSON.stringify(e.response.body)}`);
        // fall through to SMTP
      }
    }

    try {
      const tx = this.getTransporter();
      const info = await tx.sendMail({
        from,
        to: opts.to as any,
        subject: opts.subject,
        html: opts.html,
        text,
        headers: opts.headers,
      });
      this.logger.log(`SMTP: sent → subject="${opts.subject}" messageId=${info.messageId}`);
    } catch (e: any) {
      this.logger.error(`SMTP send failed: ${e?.message || e}`);
      throw e;
    }
  }

  /* ------------------------- Templated mail ------------------------ */

  async sendInvite(to: string, link: string, role: string) {
    const safeLink = this.normalizeLink(link);
    const subject = 'Your Pray in Verses invite';
    const html = this.frame(`
      <p>You’ve been invited to join <b>Pray in Verses</b> as <b>${this.escape(role)}</b>.</p>
      <p>Click to accept your invite:</p>
      <p><a href="${this.escape(safeLink)}">${this.escape(safeLink)}</a></p>
      <p>This link will expire soon.</p>
    `);
    await this.send({ to, subject, html, text: `Accept your invite:\n${safeLink}\n` });
  }

  async sendPasswordReset(to: string, link: string) {
    const safeLink = this.normalizeLink(link);
    const subject = 'Reset your Pray in Verses password';
    const html = this.frame(`
      <p>Hello,</p>
      <p>We received a request to reset your password. Click the button below to set a new one:</p>
      <p><a href="${this.escape(
        safeLink,
      )}" style="display:inline-block;background:#0C2E8A;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Reset Password</a></p>
      <p>If you didn’t request this, you can safely ignore this email.</p>
    `);
    await this.send({ to, subject, html, text: `Reset your password:\n${safeLink}\n` });
  }

  async sendVerification(to: string, link: string) {
    const safeLink = this.normalizeLink(link);
    const subject = 'Verify your email';
    const html = this.frame(`
      <p>Welcome to <b>Pray in Verses</b>!</p>
      <p>Please verify your email to finish setting up your account.</p>
      <p><a href="${this.escape(
        safeLink,
      )}" style="display:inline-block;background:#0C2E8A;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Verify Email</a></p>
    `);
    await this.send({ to, subject, html, text: `Verify your email:\n${safeLink}\n` });
  }

  async notifyCommentOwner(ownerEmail: string, commenterName: string, prayerTitle: string, link: string) {
    const safeLink = this.normalizeLink(link);
    const subject = 'New comment on your prayer request';
    const html = this.frame(`
      <p><b>${this.escape(commenterName || 'Someone')}</b> commented on your prayer request:</p>
      <p style="margin:8px 0;padding:10px;background:#F8FAFC;border-radius:6px;color:#0C2E8A;"><b>${this.escape(
        prayerTitle || 'Your prayer',
      )}</b></p>
      <p><a href="${this.escape(
        safeLink,
      )}" style="display:inline-block;background:#0C2E8A;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">View comment</a></p>
    `);
    await this.send({ to: ownerEmail, subject, html, text: `View comment:\n${safeLink}\n` });
  }

  /* --------------------------- Helpers ---------------------------- */

  private escape(s: string): string {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private frame(inner: string): string {
    const brand = this.fromName;
    return `
      <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6;color:#0F172A;">
        <div style="max-width:640px;margin:24px auto;padding:20px;border:1px solid #E5E7EB;border-radius:12px;background:#ffffff;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
            <div style="width:10px;height:10px;border-radius:50%;background:#0C2E8A;"></div>
            <div style="font-weight:600;color:#0C2E8A;">${this.escape(brand)}</div>
          </div>
          ${inner}
          <hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0;" />
          <p style="font-size:12px;color:#64748B;margin:0;">
            Sent from ${this.escape(brand)} • Please do not reply to this automated message.
          </p>
        </div>
      </div>
    `.trim();
  }
}
