import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import type { Env } from '../../config/env.validation';
import { NotificationEvents } from '../../notifications/notification-events';
import { buildMemberWelcomeEmail } from '../../notifications/member-welcome-email';
import { PrismaService } from '../../prisma/prisma.service';
import type { ImportRowDto } from '../dto/bulk-import.dto';
import { MemberAuthProvisioningService } from './member-auth-provisioning.service';
import { MemberHouseholdService } from './member-household.service';

/** Bulk member import with per-row compensation and transactional DB writes. */
@Injectable()
export class MemberBulkImportService {
  private readonly logger = new Logger(MemberBulkImportService.name);
  private readonly tenantId: string;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly household: MemberHouseholdService,
    private readonly authProvisioning: MemberAuthProvisioningService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.appUrl = config.get('FRONTEND_URL', { infer: true }) ?? 'http://localhost:3000';
  }

  async bulkImport(rows: ImportRowDto[], sendWelcome = false) {
    const householdCache = new Map<string, string>();
    const results: { email: string; status: 'created' | 'skipped' | 'error'; reason?: string }[] = [];
    let created = 0;

    for (const row of rows) {
      const email = row.email.trim().toLowerCase();
      const phone = row.phone.trim();
      try {
        const existing = await this.prisma.member.findFirst({
          where: { tenantId: this.tenantId, email },
          select: { id: true },
        });
        if (existing) {
          results.push({ email, status: 'skipped', reason: 'member already exists' });
          continue;
        }

        const provisioned = await this.authProvisioning.createOrReuseAuthUser(email);
        try {
          const householdId = await this.household.resolveHousehold(row.household, householdCache);
          await this.prisma.$transaction(async (tx) => {
            const profile = await tx.profile.create({
              data: { id: randomUUID(), userId: provisioned.userId, tenantId: this.tenantId },
            });
            await tx.roleAssignment.create({
              data: {
                id: randomUUID(),
                tenantId: this.tenantId,
                profileId: profile.id,
                role: 'MEMBER',
              },
            });
            await tx.member.create({
              data: {
                id: randomUUID(),
                tenantId: this.tenantId,
                profileId: profile.id,
                firstName: row.firstName.trim(),
                lastName: row.lastName.trim(),
                email,
                phone,
                tags: row.tags ?? [],
                householdId,
              },
            });
          });
        } catch (dbError) {
          if (provisioned.created) {
            await this.authProvisioning.rollbackCreatedAuthUser(provisioned.userId);
          }
          throw dbError;
        }

        const setupSent = await this.authProvisioning.sendPasswordSetupEmail(email);
        if (sendWelcome) {
          this.events.emit(
            NotificationEvents.SendEmail,
            buildMemberWelcomeEmail({
              firstName: row.firstName.trim(),
              email,
              appUrl: this.appUrl,
              source: 'admin-created',
            }),
          );
        }

        created += 1;
        results.push({
          email,
          status: 'created',
          ...(!setupSent ? { reason: 'created, but password setup email could not be sent' } : {}),
        });
      } catch (error) {
        const reason = (error as Error).message;
        const duplicate = /already has an account|already exists/i.test(reason);
        results.push({ email, status: duplicate ? 'skipped' : 'error', reason });
      }
    }

    const skipped = results.filter((result) => result.status === 'skipped').length;
    const errors = results.filter((result) => result.status === 'error').length;
    this.logger.log(`Bulk import: ${created} created, ${skipped} skipped, ${errors} errors`);
    return { created, skipped, errors, results };
  }
}
