import { HttpException, HttpStatus, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { CounsellingApplication, CounsellingTokenScope, Prisma } from '@prisma/client';
import { createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CaseAccess } from '../case-access';
import { buildDocumentCodeEmail } from '../../notifications/templates/counselling-documents.email';
import { DocumentCrypto, DocumentStorageNotReady } from './document-crypto';
import { DocumentMailer } from './document-mailer';
import { DocumentsConfigService } from './documents-config';

/**
 * The couple's way in, with no account:
 *
 *   1. The email link carries a random token after "#", so no server log ever
 *      sees it. The page posts it here; only its sha256 is stored.
 *   2. A valid token gives a signed, httpOnly session cookie at the "link"
 *      stage. A six-digit code emailed to the address the link went to moves
 *      it to the "verified" stage (unless the pastors switch codes off).
 *   3. Every request re-checks that the link is still live.
 *
 * Every bad link (unknown, expired, revoked, closed case) gets the same answer.
 */
export const SESSION_COOKIE = 'ehc_pmc_docs';
export const SESSION_PATH = '/api/backend/public/premarital/documents';
const LINK_STAGE_SECONDS = 20 * 60;
const VERIFIED_SECONDS = 60 * 60;
const CODE_MINUTES = 10;
const CODE_ATTEMPTS = 5;
const CODES_PER_HOUR = 3;

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export class LinkNotWorking extends NotFoundException {
  constructor() {
    super("This link isn't working. Please ask the church office for a new one.");
  }
}
const tooMany = (message: string) => new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);

type Stage = 'L' | 'V';
interface SessionClaims {
  t: string; // token id
  s: Stage;
  e: number; // expiry, epoch seconds
}

export interface CoupleSession {
  tokenId: string;
  scope: CounsellingTokenScope;
  app: CounsellingApplication;
}

@Injectable()
export class CoupleAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CaseAccess,
    private readonly crypto: DocumentCrypto,
    private readonly mailer: DocumentMailer,
    private readonly config: DocumentsConfigService,
  ) {}

  /** A new link for one person, inside the caller's transaction. Answers with the raw token, which is never stored. */
  async createToken(
    tx: Prisma.TransactionClient,
    o: { applicationId: string; scope: CounsellingTokenScope; validDays: number; createdById: string | null },
  ): Promise<string> {
    const raw = randomBytes(32).toString('base64url');
    await tx.counsellingAccessToken.create({
      data: {
        id: randomUUID(),
        tenantId: this.access.tenantId,
        applicationId: o.applicationId,
        tokenHash: sha256(raw),
        scope: o.scope,
        expiresAt: new Date(Date.now() + o.validDays * 86_400_000),
        createdById: o.createdById,
      },
    });
    return raw;
  }

  /** Swaps a link token for a session cookie value. */
  async exchange(rawToken: string): Promise<{ cookie: string; maxAge: number; stage: 'CODE' | 'READY' }> {
    if (!this.crypto.configured) throw new DocumentStorageNotReady();
    const token = await this.live({ tokenHash: sha256(rawToken) });
    await this.prisma.counsellingAccessToken.update({ where: { id: token.id }, data: { lastUsedAt: new Date() } });
    const { documentPageOtp } = await this.config.values();
    if (!documentPageOtp) return { ...this.sign(token.id, 'V', VERIFIED_SECONDS), stage: 'READY' };
    return { ...this.sign(token.id, 'L', LINK_STAGE_SECONDS), stage: 'CODE' };
  }

  /** Emails a code to the address the link was sent to. */
  async sendCode(cookie: string | undefined): Promise<void> {
    const { tokenId, scope, app } = await this.session(cookie, 'L');
    const recent = await this.prisma.counsellingOtp.count({
      where: { tenantId: this.access.tenantId, tokenId, createdAt: { gt: new Date(Date.now() - 3_600_000) } },
    });
    if (recent >= CODES_PER_HOUR) throw tooMany('We have sent three codes in the last hour. Please wait a little, then try again.');
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.prisma.counsellingOtp.create({
      data: {
        id: randomUUID(),
        tenantId: this.access.tenantId,
        tokenId,
        codeHash: this.codeHash(tokenId, code),
        expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000),
      },
    });
    const to = this.recipient(app, scope);
    const sent = await this.mailer.send(
      app,
      'DOCUMENT_CODE',
      buildDocumentCodeEmail({ firstName: to.firstName, email: to.email, contactUrl: this.mailer.contactUrl, code }),
    );
    if (sent.status !== 'SENT')
      throw new ServiceUnavailableException('We could not send a code just now. Please try again later, or bring your documents to the church office.');
  }

  async verifyCode(cookie: string | undefined, code: string): Promise<{ cookie: string; maxAge: number }> {
    const { tokenId } = await this.session(cookie, 'L');
    const otp = await this.prisma.counsellingOtp.findFirst({
      where: { tenantId: this.access.tenantId, tokenId, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.attempts >= CODE_ATTEMPTS)
      throw new HttpException('That code has expired or been tried too many times. Ask for a new one.', HttpStatus.UNPROCESSABLE_ENTITY);
    const expected = Buffer.from(otp.codeHash, 'hex');
    const given = Buffer.from(this.codeHash(tokenId, code.trim()), 'hex');
    if (!timingSafeEqual(expected, given)) {
      // Counted before answering, and only while under the limit, so racing guesses cannot exceed it.
      await this.prisma.counsellingOtp.updateMany({ where: { id: otp.id, attempts: { lt: CODE_ATTEMPTS } }, data: { attempts: { increment: 1 } } });
      throw new HttpException('That code is not right. Check the email and try again.', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    const { count } = await this.prisma.counsellingOtp.updateMany({ where: { id: otp.id, consumedAt: null }, data: { consumedAt: new Date() } });
    if (count === 0) throw new HttpException('That code has already been used. Ask for a new one.', HttpStatus.UNPROCESSABLE_ENTITY);
    return this.sign(tokenId, 'V', VERIFIED_SECONDS);
  }

  /** The verified session behind a request, or the generic "link isn't working" 404. */
  requireVerified(cookie: string | undefined): Promise<CoupleSession> {
    return this.session(cookie, 'V');
  }

  /** Who a link belongs to: the applicant, or (with partner links) the partner. */
  recipient(app: CounsellingApplication, scope: CounsellingTokenScope): { firstName: string; email: string } {
    const applicantIsScope = scope === 'ALL' || (scope === 'GROOM') === (app.applicantRole === 'GROOM');
    if (applicantIsScope || !app.partnerEmail) return { firstName: app.applicantFirstName, email: app.applicantEmail };
    return { firstName: app.partnerFirstName, email: app.partnerEmail };
  }

  private async session(cookie: string | undefined, need: Stage): Promise<CoupleSession> {
    if (!this.crypto.configured) throw new DocumentStorageNotReady();
    const claims = this.verify(cookie);
    if (!claims || (need === 'V' && claims.s !== 'V')) throw new LinkNotWorking();
    const token = await this.live({ id: claims.t });
    return { tokenId: token.id, scope: token.scope, app: token.Application };
  }

  private async live(where: { id: string } | { tokenHash: string }) {
    const token = await this.prisma.counsellingAccessToken.findFirst({
      where: { ...where, tenantId: this.access.tenantId },
      include: { Application: true },
    });
    const app = token?.Application;
    if (
      !token ||
      !app ||
      token.revokedAt ||
      token.expiresAt <= new Date() ||
      app.archivedAt ||
      app.status === 'CLOSED' ||
      app.status === 'COMPLETED'
    )
      throw new LinkNotWorking();
    return token;
  }

  private codeHash(tokenId: string, code: string) {
    return createHmac('sha256', this.crypto.derive('otp-pepper')).update(`${tokenId}:${code}`).digest('hex');
  }

  private sign(tokenId: string, stage: Stage, seconds: number): { cookie: string; maxAge: number } {
    const claims: SessionClaims = { t: tokenId, s: stage, e: Math.floor(Date.now() / 1000) + seconds };
    const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
    const mac = createHmac('sha256', this.crypto.derive('couple-session')).update(body).digest('base64url');
    return { cookie: `v1.${body}.${mac}`, maxAge: seconds };
  }

  private verify(cookie: string | undefined): SessionClaims | null {
    if (!cookie) return null;
    const [v, body, mac] = cookie.split('.');
    if (v !== 'v1' || !body || !mac) return null;
    const expected = createHmac('sha256', this.crypto.derive('couple-session')).update(body).digest();
    const given = Buffer.from(mac, 'base64url');
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
    try {
      const claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionClaims;
      if (typeof claims.t !== 'string' || (claims.s !== 'L' && claims.s !== 'V') || claims.e < Date.now() / 1000) return null;
      return claims;
    } catch {
      return null;
    }
  }
}

/** Reads our one cookie out of a Cookie header. */
export function cookieFrom(header: string | undefined): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) return rest.join('=');
  }
  return undefined;
}

export function setCookieHeader(value: string, maxAge: number): string {
  return `${SESSION_COOKIE}=${value}; Path=${SESSION_PATH}; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}
export const clearCookieHeader = () => `${SESSION_COOKIE}=; Path=${SESSION_PATH}; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
