import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadGatewayException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailDispatcher } from '../jobs/mail-dispatcher';
import { buildGivingReceiptEmail } from '../notifications/templates/giving-receipt.email';
import { InitGivingDto } from './dto/init-giving.dto';
import type { Env } from '../config/env.validation';

const PAYSTACK_BASE = 'https://api.paystack.co';

/**
 * Online giving via Paystack.
 *
 * Money is stored in kobo on GivingRecord.amount (matching the analytics module,
 * which divides by 100 for naira). paystackStatus mirrors Paystack's own status
 * string: 'pending' on initialise, 'success' once confirmed.
 *
 * Confirmation is idempotent: verify() and the webhook both call confirm(),
 * which only sends a receipt the first time a record flips to success.
 */
@Injectable()
export class GivingService {
  private readonly logger = new Logger(GivingService.name);
  private readonly tenantId: string;
  private readonly secretKey?: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailDispatcher,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.secretKey = config.get('PAYSTACK_SECRET_KEY', { infer: true });
    this.frontendUrl =
      config.get('FRONTEND_URL', { infer: true })?.replace(/\/$/, '') ??
      'http://localhost:3000';
  }

  private requireKey(): string {
    if (!this.secretKey) {
      throw new ServiceUnavailableException(
        'Online giving is not configured. Please use bank transfer or try again later.',
      );
    }
    return this.secretKey;
  }

  /** Start a transaction: create a pending record and hand back Paystack's checkout URL. */
  async initialize(dto: InitGivingDto) {
    const key = this.requireKey();
    const reference = `ehc-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const amountKobo = Math.round(dto.amount * 100);

    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: dto.email,
        amount: amountKobo,
        reference,
        callback_url: `${this.frontendUrl}/give/callback`,
        metadata: {
          donorName: dto.name ?? null,
          category: dto.category ?? null,
        },
      }),
    });

    const json = (await res.json().catch(() => null)) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string; access_code?: string };
    } | null;

    if (!res.ok || !json?.status || !json.data?.authorization_url) {
      this.logger.error(
        `Paystack initialize failed (${res.status}): ${json?.message ?? 'unknown'}`,
      );
      throw new BadGatewayException('Could not start the payment. Please try again.');
    }

    await this.prisma.givingRecord.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        reference,
        amount: amountKobo,
        currency: 'NGN',
        donorName: dto.name ?? null,
        donorEmail: dto.email,
        category: dto.category ?? null,
        paystackStatus: 'pending',
      },
    });

    return {
      authorizationUrl: json.data.authorization_url,
      reference,
    };
  }

  /** Verify a transaction with Paystack and confirm the record. Used by the callback page. */
  async verify(reference: string) {
    const key = this.requireKey();
    const res = await fetch(
      `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${key}` } },
    );
    const json = (await res.json().catch(() => null)) as {
      status?: boolean;
      data?: { status?: string; amount?: number };
    } | null;

    if (!res.ok || !json?.status || !json.data) {
      throw new BadGatewayException('Could not verify the payment.');
    }

    const paystackStatus = json.data.status ?? 'failed';
    await this.confirm(reference, paystackStatus);

    return { reference, status: paystackStatus };
  }

  /**
   * Handle a Paystack webhook. Verifies the HMAC SHA512 signature over the raw
   * body, logs the event for idempotency/audit, and confirms the record on
   * charge.success.
   */
  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    const key = this.requireKey();

    if (!signature || !this.isValidSignature(rawBody, signature, key)) {
      this.logger.warn('Rejected Paystack webhook: bad signature');
      return { ok: false };
    }

    const event = JSON.parse(rawBody.toString('utf8')) as {
      event?: string;
      data?: { reference?: string; status?: string };
    };
    const reference = event.data?.reference;
    if (!reference) return { ok: true };

    // Idempotency + audit: skip if we already logged this exact event+reference.
    const already = await this.prisma.paystackWebhookLog.findFirst({
      where: { reference, event: event.event ?? 'unknown' },
      select: { id: true },
    });
    if (already) {
      this.logger.debug(`Webhook ${event.event} for ${reference} already processed`);
      return { ok: true };
    }

    await this.prisma.paystackWebhookLog.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        event: event.event ?? 'unknown',
        reference,
        payload: event as unknown as object,
      },
    });

    if (event.event === 'charge.success') {
      await this.confirm(reference, event.data?.status ?? 'success');
    }

    return { ok: true };
  }

  /** Member-facing giving history, matched by the member's email. */
  async listForEmail(email: string | null) {
    if (!email) return [];
    const records = await this.prisma.givingRecord.findMany({
      where: { tenantId: this.tenantId, donorEmail: email },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        reference: true,
        amount: true,
        currency: true,
        category: true,
        paystackStatus: true,
        createdAt: true,
        verifiedAt: true,
      },
    });
    return records.map((r) => ({ ...r, amountNaira: Math.round(r.amount / 100) }));
  }

  // ── internals ──────────────────────────────────────────────────────────────

  private isValidSignature(rawBody: Buffer, signature: string, key: string): boolean {
    const expected = createHmac('sha512', key).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  /**
   * Flip a record to its final status. Sends a receipt only on the first
   * transition into 'success', so verify() and the webhook can both call this
   * without double-emailing.
   */
  private async confirm(reference: string, paystackStatus: string): Promise<void> {
    const record = await this.prisma.givingRecord.findUnique({
      where: { reference },
    });
    if (!record) {
      this.logger.warn(`confirm(): no record for reference ${reference}`);
      return;
    }

    const alreadySucceeded = record.paystackStatus === 'success';
    await this.prisma.givingRecord.update({
      where: { reference },
      data: {
        paystackStatus,
        verifiedAt: paystackStatus === 'success' ? new Date() : record.verifiedAt,
      },
    });

    if (paystackStatus === 'success' && !alreadySucceeded && record.donorEmail) {
      await this.mail.dispatch(
        buildGivingReceiptEmail({
          donorName: record.donorName,
          email: record.donorEmail,
          amount: Math.round(record.amount / 100),
          currency: record.currency,
          reference: record.reference,
          category: record.category,
          date: new Date(),
        }),
      );
      this.logger.log(`Giving confirmed + receipt queued for ${reference}`);
    }
  }
}
