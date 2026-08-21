import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import type { Env } from '../config/env.validation';
import { MailDispatcher } from '../jobs/mail-dispatcher';
import { buildGivingReceiptEmail } from '../notifications/templates/giving-receipt.email';
import { PrismaService } from '../prisma/prisma.service';
import { InitGivingDto } from './dto/init-giving.dto';

const PAYSTACK_BASE = 'https://api.paystack.co';

interface PaystackTransaction {
  status?: string;
  amount?: number;
  currency?: string;
  reference?: string;
}

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

  async initialize(dto: InitGivingDto) {
    const key = this.requireKey();
    const reference = `ehc-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const amountKobo = Math.round(dto.amount * 100);
    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: dto.email,
        amount: amountKobo,
        currency: 'NGN',
        reference,
        callback_url: `${this.frontendUrl}/give/callback`,
        metadata: { donorName: dto.name ?? null, category: dto.category ?? null },
      }),
    });
    const json = (await res.json().catch(() => null)) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string };
    } | null;
    if (!res.ok || !json?.status || !json.data?.authorization_url) {
      this.logger.error(`Paystack initialize failed (${res.status}): ${json?.message ?? 'unknown'}`);
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
    return { authorizationUrl: json.data.authorization_url, reference };
  }

  async verify(reference: string) {
    const key = this.requireKey();
    const res = await fetch(
      `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${key}` } },
    );
    const json = (await res.json().catch(() => null)) as {
      status?: boolean;
      data?: PaystackTransaction;
    } | null;
    if (!res.ok || !json?.status || !json.data) {
      throw new BadGatewayException('Could not verify the payment.');
    }

    await this.confirm(reference, json.data);
    return { reference, status: json.data.status ?? 'failed' };
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    const key = this.requireKey();
    if (!signature || !this.isValidSignature(rawBody, signature, key)) {
      this.logger.warn('Rejected Paystack webhook: bad signature');
      return { ok: false };
    }

    let event: { event?: string; data?: PaystackTransaction };
    try {
      event = JSON.parse(rawBody.toString('utf8')) as typeof event;
    } catch {
      this.logger.warn('Rejected Paystack webhook: invalid JSON');
      return { ok: false };
    }
    const eventName = event.event ?? 'unknown';
    const reference = event.data?.reference;
    if (!reference) return { ok: true };

    // Confirmation is safe to race: only one pending-to-success update wins.
    // Log after successful processing so a transient failure remains retryable.
    if (eventName === 'charge.success') {
      await this.confirm(reference, { ...event.data, status: 'success' });
    }

    try {
      await this.prisma.paystackWebhookLog.create({
        data: {
          id: randomUUID(),
          tenantId: this.tenantId,
          event: eventName,
          reference,
          payload: event as unknown as object,
        },
      });
    } catch (error) {
      if ((error as { code?: string }).code !== 'P2002') throw error;
      this.logger.debug(`Webhook ${eventName} for ${reference} already logged`);
    }
    return { ok: true };
  }

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
    return records.map((record) => ({
      ...record,
      amountNaira: Math.round(record.amount / 100),
    }));
  }

  private isValidSignature(rawBody: Buffer, signature: string, key: string): boolean {
    const expected = createHmac('sha512', key).update(rawBody).digest('hex');
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    return (
      actualBuffer.length === expectedBuffer.length &&
      timingSafeEqual(actualBuffer, expectedBuffer)
    );
  }

  private assertTransactionMatches(
    reference: string,
    record: { reference: string; amount: number; currency: string },
    transaction: PaystackTransaction,
  ): void {
    const matches =
      transaction.reference === reference &&
      transaction.reference === record.reference &&
      Number.isInteger(transaction.amount) &&
      transaction.amount === record.amount &&
      typeof transaction.currency === 'string' &&
      transaction.currency.toUpperCase() === record.currency.toUpperCase();
    if (!matches) {
      this.logger.error(`Rejected mismatched Paystack confirmation for ${reference}`);
      throw new BadGatewayException('Verified payment details did not match the initialized gift.');
    }
  }

  private async confirm(reference: string, transaction: PaystackTransaction): Promise<void> {
    const record = await this.prisma.givingRecord.findUnique({ where: { reference } });
    if (!record || record.tenantId !== this.tenantId) {
      this.logger.warn(`confirm(): no record for reference ${reference}`);
      return;
    }

    const paystackStatus = transaction.status ?? 'failed';
    if (paystackStatus === 'success') {
      this.assertTransactionMatches(reference, record, transaction);
    }

    const verifiedAt = paystackStatus === 'success' ? new Date() : record.verifiedAt;
    const result = await this.prisma.givingRecord.updateMany({
      where: {
        id: record.id,
        tenantId: this.tenantId,
        paystackStatus: { not: 'success' },
      },
      data: { paystackStatus, verifiedAt },
    });

    // Exactly one process wins the transition and therefore queues the receipt.
    if (paystackStatus === 'success' && result.count === 1 && record.donorEmail) {
      await this.mail.dispatch(
        buildGivingReceiptEmail({
          donorName: record.donorName,
          email: record.donorEmail,
          amount: Math.round(record.amount / 100),
          currency: record.currency,
          reference: record.reference,
          category: record.category,
          date: verifiedAt ?? new Date(),
        }),
      );
      this.logger.log(`Giving confirmed + receipt queued for ${reference}`);
    }
  }
}
