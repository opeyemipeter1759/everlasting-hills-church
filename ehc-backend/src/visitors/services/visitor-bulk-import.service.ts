import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { AttendanceSessionWindowService } from '../../attendance/services/attendance-session-window.service';
import { NotificationEvents } from '../../notifications/notification-events';
import { buildFirstTimerWelcomeEmail } from '../../notifications/templates/first-timer-welcome.email';
import type { VisitorImportRowDto } from '../dto/bulk-import-visitor.dto';

/**
 * Bulk-import Visitor (first-timer) records from parsed CSV rows — e.g. backfilling
 * historical form responses collected outside the live /forms/register flow (Google
 * Forms exports, paper forms, etc.). Mirrors MemberBulkImportService's per-row outcome
 * shape so the admin UI can reuse the same results pattern.
 *
 * Dedupes against existing Visitors by email/phone (skip, not error) — the same two
 * fields FirstTimerFormService already guards against on live submission, just as a
 * skip here instead of a hard reject, since a batch import shouldn't die on one repeat.
 */
@Injectable()
export class VisitorBulkImportService {
  private readonly logger = new Logger(VisitorBulkImportService.name);
  private readonly tenantId: string;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly sessionWindow: AttendanceSessionWindowService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.appUrl =
      (config.get('FRONTEND_URL', { infer: true }) as string | undefined) ?? 'http://localhost:3000';
  }

  async bulkImport(
    rows: VisitorImportRowDto[],
    opts: { sendWelcome?: boolean; alsoWelcomeExisting?: boolean } = {},
  ) {
    const sendWelcome = opts.sendWelcome ?? true;
    const alsoWelcomeExisting = opts.alsoWelcomeExisting ?? false;
    const results: { name: string; status: 'created' | 'skipped' | 'error'; reason?: string }[] = [];
    let created = 0;

    for (const row of rows) {
      const firstName = row.firstName.trim();
      const lastName = row.lastName.trim();
      const name = `${firstName} ${lastName}`.trim();
      const email = row.email?.trim().toLowerCase() || null;
      const phone = row.phone?.trim() || null;

      try {
        if (email || phone) {
          const existing = await this.prisma.visitor.findFirst({
            where: {
              tenantId: this.tenantId,
              OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
            },
            select: { id: true },
          });
          if (existing) {
            results.push({ name, status: 'skipped', reason: 'visitor already exists' });
            if (sendWelcome && alsoWelcomeExisting && email) {
              this.dispatchWelcome(firstName, email);
            }
            continue;
          }
        }

        const dateOfBirth =
          row.birthDay && row.birthMonth
            ? new Date(Date.UTC(2000, row.birthMonth - 1, row.birthDay)).toISOString()
            : null;

        const service = await this.sessionWindow.getServiceForDate(
          row.submittedAt ? new Date(row.submittedAt) : new Date(),
        );

        await this.prisma.visitor.create({
          data: {
            id: randomUUID(),
            tenantId: this.tenantId,
            firstName,
            lastName,
            email,
            phone,
            gender: row.gender ?? null,
            dateOfBirth,
            howDidYouLearn: row.howDidYouLearn ?? null,
            invitedBy: row.invitedBy ?? null,
            locatedInIbadan: row.locatedInIbadan ?? null,
            membershipInterest: row.membershipInterest ?? null,
            address: row.address ?? null,
            occupation: row.occupation ?? null,
            bornAgain: row.bornAgain ?? null,
            serviceExperience: row.serviceExperience ?? null,
            prayerPoint: row.prayerPoint ?? null,
            whatsappInterest: row.whatsappInterest ?? null,
            ...(row.submittedAt && { submittedAt: new Date(row.submittedAt) }),
            serviceId: service?.id ?? null,
          },
        });

        created += 1;
        results.push({ name, status: 'created' });
        if (sendWelcome && email) {
          this.dispatchWelcome(firstName, email);
        }
      } catch (err) {
        results.push({ name, status: 'error', reason: (err as Error).message });
      }
    }

    const skipped = results.filter((r) => r.status === 'skipped').length;
    const errors = results.filter((r) => r.status === 'error').length;
    this.logger.log(`Visitor bulk import: ${created} created, ${skipped} skipped, ${errors} errors`);
    return { created, skipped, errors, results };
  }

  /** Fire-and-forget, matching FormsEmailDispatchService's pattern for public form intake. */
  private dispatchWelcome(firstName: string, email: string) {
    this.events.emit(
      NotificationEvents.SendEmail,
      buildFirstTimerWelcomeEmail({ firstName, email, appUrl: this.appUrl }),
    );
  }
}
