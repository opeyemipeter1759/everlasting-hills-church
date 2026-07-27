import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { NotificationEvents } from '../../notifications/notification-events';
import { buildMemberWelcomeEmail } from '../../notifications/member-welcome-email';
import { createAdminClient } from '../members-supabase-admin.util';
import { MemberHouseholdService } from './member-household.service';
import type { ImportRowDto } from '../dto/bulk-import.dto';

/**
 * Bulk-import members from parsed CSV rows. Each row provisions a full account
 * (Supabase auth user with phone as the initial password, Profile, Member),
 * mirroring single-visitor conversion. Rows whose email already has a member
 * are skipped. Per-row outcomes are returned so the admin sees exactly what
 * happened. Welcome emails are opt-in to avoid surprise blasts.
 */
@Injectable()
export class MemberBulkImportService {
  private readonly logger = new Logger(MemberBulkImportService.name);
  private readonly tenantId: string;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly household: MemberHouseholdService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
    this.appUrl =
      (config.get('FRONTEND_URL', { infer: true }) as string | undefined) ??
      process.env.NEXT_PUBLIC_APP_URL ??
      'http://localhost:3000';
  }

  async bulkImport(rows: ImportRowDto[], sendWelcome = false) {
    const supabase = createAdminClient();
    const householdCache = new Map<string, string>();
    const results: { email: string; status: 'created' | 'skipped' | 'error'; reason?: string }[] =
      [];
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

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: phone,
          email_confirm: true,
          user_metadata: { needs_password_change: true },
        } as any);
        if (authError || !authData?.user) {
          const dup = /already.*registered|already.*exists/i.test(authError?.message ?? '');
          results.push({
            email,
            status: dup ? 'skipped' : 'error',
            reason: dup ? 'auth account already exists' : authError?.message ?? 'auth error',
          });
          continue;
        }

        const householdId = await this.household.resolveHousehold(row.household, householdCache);

        const profile = await this.prisma.profile.create({
          data: {
            id: randomUUID(),
            userId: authData.user.id,
            tenantId: this.tenantId,
          },
        });
        await this.prisma.roleAssignment.create({
          data: {
            id: randomUUID(),
            tenantId: this.tenantId,
            profileId: profile.id,
            role: 'MEMBER',
          },
        });
        await this.prisma.member.create({
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

        if (sendWelcome) {
          this.events.emit(
            NotificationEvents.SendEmail,
            buildMemberWelcomeEmail({
              firstName: row.firstName.trim(),
              email,
              phone,
              appUrl: this.appUrl,
              source: 'admin-created',
            }),
          );
        }

        created += 1;
        results.push({ email, status: 'created' });
      } catch (err) {
        results.push({ email, status: 'error', reason: (err as Error).message });
      }
    }

    const skipped = results.filter((r) => r.status === 'skipped').length;
    const errors = results.filter((r) => r.status === 'error').length;
    this.logger.log(`Bulk import: ${created} created, ${skipped} skipped, ${errors} errors`);
    return { created, skipped, errors, results };
  }
}
