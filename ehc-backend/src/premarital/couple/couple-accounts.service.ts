import { Injectable, Logger } from '@nestjs/common';
import type { CounsellingApplication, CounsellingParticipantSide } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { User } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { COUPLE_ACCOUNT_MARKER, isCoupleAccount, tempPasswordExpired, tempPasswordExpiry } from '../../auth/couple-account';
import { generateUnusableInitialPassword } from '../../auth/secure-provisioning';
import { createAdminClient } from '../../members/members-supabase-admin.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CaseAccess } from '../case-access';
import { counsellingAudit } from '../counselling-audit';
import { lagosDay, longDate } from '../documents/document-rules';
import { DocumentsConfigService } from '../documents/documents-config';

/**
 * How a person signs in, as their email should explain it:
 *   PHONE     a couple account on its temporary password (their phone number, digits only), still within its days
 *   EXPIRED   a couple account whose temporary password ran out unused; "Forgot password", or the office renews it
 *   EXISTING  a couple account whose owner has chosen a password
 *   MEMBER    their usual church account
 *   FORGOT    a couple account the phone number could not be used for; they set a password with "Forgot password"
 *   FAILED    no account yet (the office can retry with "Resend sign-in details")
 */
export type SignInMode = 'PHONE' | 'EXPIRED' | 'EXISTING' | 'MEMBER' | 'FORGOT' | 'FAILED';

export interface SignInPlan {
  side: CounsellingParticipantSide;
  firstName: string;
  email: string;
  mode: SignInMode;
  /** The last four digits of the phone number, so the email can say which number without printing it. */
  phoneEnding: string;
  /** PHONE only: the day the temporary password stops working, e.g. "28 November 2026". */
  expires: string | null;
}

/** The temporary password: the phone number as typed, digits only ("0803 123 4567" signs in as 08031234567). */
export const phonePassword = (phone: string) => phone.replace(/\D/g, '');

const isDuplicate = (message: string | undefined) => /already.*registered|already.*exists|email_exists/i.test(message ?? '');
const isPasswordRejection = (message: string | undefined) => /password/i.test(message ?? '');

type Person = { side: CounsellingParticipantSide; firstName: string; email: string; phone: string };
type Meta = { needs_password_change?: unknown; temp_password?: unknown };

/** What a couple account's email should say, from its own metadata. */
export function modeOf(user: Pick<User, 'user_metadata'>, now = new Date()): SignInMode {
  const meta = (user.user_metadata ?? {}) as Meta;
  if (meta.needs_password_change !== true) return 'EXISTING';
  if (meta.temp_password !== 'phone') return 'FORGOT';
  return tempPasswordExpired(meta, now) ? 'EXPIRED' : 'PHONE';
}

/**
 * Gives each partner a way into the couple dashboard. A member keeps their
 * usual account. Anyone else gets a sign-in made only for the dashboard: their
 * email, with their phone number (digits only) as a temporary password they
 * must change at first sign-in. The temporary password stops working after a
 * few days (a setting); it is renewed by "Forgot password" on the sign-in
 * page, or by the office's "Resend sign-in details", which restarts it.
 * These accounts have no Profile, so the API refuses them everywhere but the
 * dashboard (RolesGuard).
 *
 * Never throws: a person whose account could not be made comes back as
 * FAILED, and the office can retry from the case.
 */
@Injectable()
export class CoupleAccountsService {
  private readonly logger = new Logger(CoupleAccountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CaseAccess,
    private readonly config: DocumentsConfigService,
  ) {}

  /**
   * After an application is deleted: removes the dashboard sign-ins that were
   * made for it, once nothing else uses them. Only ever a couple sign-in (the
   * marker, and no Profile), never a member's account. Never throws: a sign-in
   * that could not be removed is left, still fenced off and finding no
   * application. Returns how many were removed.
   */
  async removeUnused(authUserIds: string[]): Promise<number> {
    let removed = 0;
    for (const id of new Set(authUserIds)) {
      try {
        if (await this.prisma.counsellingParticipant.count({ where: { authUserId: id } })) continue;
        if (await this.prisma.profile.findUnique({ where: { userId: id }, select: { id: true } })) continue;
        const supabase = createAdminClient();
        const { data, error } = await supabase.auth.admin.getUserById(id);
        if (error || !data.user || !isCoupleAccount(data.user.app_metadata)) continue;
        const gone = await supabase.auth.admin.deleteUser(id);
        if (gone.error) throw new Error(gone.error.message);
        removed++;
      } catch (err) {
        this.logger.warn(`Could not remove a counselling dashboard sign-in after its application was deleted: ${(err as Error).message}`);
      }
    }
    return removed;
  }

  /** Both people on the application. The partner is left out only on applications from before partner details were required. */
  people(app: CounsellingApplication): Person[] {
    const out: Person[] = [
      { side: 'APPLICANT', firstName: app.applicantFirstName, email: app.applicantEmail, phone: app.applicantPhone },
    ];
    if (app.partnerEmail && app.partnerPhone)
      out.push({ side: 'PARTNER', firstName: app.partnerFirstName, email: app.partnerEmail, phone: app.partnerPhone });
    return out;
  }

  /**
   * Makes or links any account that is missing, then says how each person
   * signs in now. With `renew`, a couple account nobody has chosen a password
   * for starts again on the phone number for a fresh few days. A password
   * someone chose is never touched.
   */
  async provision(app: CounsellingApplication, o: { renew?: boolean } = {}): Promise<SignInPlan[]> {
    const rows = await this.participants(app);
    const days = (await this.config.values()).tempPasswordValidDays;
    const plans: SignInPlan[] = [];
    for (const person of this.people(app)) {
      const row = rows.find((p) => p.side === person.side);
      let user: Pick<User, 'user_metadata'> | null = null;
      let mode: SignInMode;
      try {
        if (!row) ({ mode, user } = await this.provideOne(app, person, days));
        else if (row.accountKind === 'MEMBER') mode = 'MEMBER';
        else ({ mode, user } = await this.current(row.authUserId, person, o.renew ? days : null));
      } catch (err) {
        this.logger.error(`Could not set up the ${person.side.toLowerCase()} sign-in for counselling application ${app.id}: ${(err as Error).message}`);
        mode = 'FAILED';
      }
      const expiry = mode === 'PHONE' && user ? tempPasswordExpiry(user.user_metadata) : null;
      plans.push({
        side: person.side,
        firstName: person.firstName,
        email: person.email,
        phoneEnding: phonePassword(person.phone).slice(-4),
        mode,
        expires: expiry ? longDate(lagosDay(expiry)) : null,
      });
    }
    return plans;
  }

  /** Who has an account, for the office's view of the case. */
  participants(app: Pick<CounsellingApplication, 'id' | 'tenantId'>) {
    return this.prisma.counsellingParticipant.findMany({
      where: { tenantId: app.tenantId, applicationId: app.id },
      select: { side: true, accountKind: true, authUserId: true, signInSentAt: true },
    });
  }

  async markSent(app: Pick<CounsellingApplication, 'id' | 'tenantId'>, sides: CounsellingParticipantSide[]) {
    if (!sides.length) return;
    await this.prisma.counsellingParticipant.updateMany({
      where: { tenantId: app.tenantId, applicationId: app.id, side: { in: sides } },
      data: { signInSentAt: new Date() },
    });
  }

  /** The temporary-password part of an account's metadata, valid for `days` from now. */
  private temporary(meta: Record<string, unknown> | undefined, days: number) {
    return {
      ...(meta ?? {}),
      needs_password_change: true,
      temp_password: 'phone',
      temp_password_expires_at: new Date(Date.now() + days * 86_400_000).toISOString(),
    };
  }

  /** An existing couple account, renewed onto the phone number first when asked and nobody has chosen a password. */
  private async current(authUserId: string, person: Person, renewDays: number | null) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.getUserById(authUserId);
    if (error || !data.user) throw new Error(error?.message ?? 'the account could not be found');
    const mode = modeOf(data.user);
    if (renewDays === null || mode === 'EXISTING') return { mode, user: data.user };
    const { data: renewed, error: renewError } = await supabase.auth.admin.updateUserById(authUserId, {
      password: phonePassword(person.phone),
      user_metadata: this.temporary(data.user.user_metadata, renewDays),
    });
    if (renewError || !renewed.user) throw new Error(renewError?.message ?? 'the account could not be renewed');
    return { mode: modeOf(renewed.user), user: renewed.user };
  }

  private async provideOne(app: CounsellingApplication, person: Person, days: number): Promise<{ mode: SignInMode; user: Pick<User, 'user_metadata'> | null }> {
    const member = await this.prisma.member.findFirst({
      where: { tenantId: app.tenantId, email: { equals: person.email, mode: 'insensitive' }, status: 'ACTIVE' },
      select: { Profile: { select: { userId: true } } },
    });
    if (member) {
      await this.link(app, person, member.Profile.userId, 'MEMBER');
      return { mode: 'MEMBER', user: null };
    }

    const supabase = createAdminClient();
    const create = (password: string, meta: Record<string, unknown>) =>
      supabase.auth.admin.createUser({
        email: person.email,
        password,
        email_confirm: true,
        app_metadata: { account: COUPLE_ACCOUNT_MARKER },
        user_metadata: { provisioned_by: 'premarital-couple', full_name: person.firstName, ...meta },
      });

    let { data, error } = await create(phonePassword(person.phone), this.temporary(undefined, days));
    if (error && isPasswordRejection(error.message) && !isDuplicate(error.message)) {
      // The project's password rules can refuse an all-digit password. The
      // account is still made, and the email asks them to use "Forgot password".
      this.logger.warn(`The phone-number password was refused for counselling application ${app.id} (${person.side}); using Forgot password instead`);
      ({ data, error } = await create(generateUnusableInitialPassword(), { needs_password_change: true, temp_password: 'none' }));
    }
    if (!error && data.user) {
      await this.link(app, person, data.user.id, 'COUPLE');
      return { mode: modeOf(data.user), user: data.user };
    }
    if (!isDuplicate(error?.message)) throw new Error(error?.message ?? 'no user returned');

    // An account with this email exists already: a church account (link it as
    // a member), or a couple account from an earlier application (reuse it).
    const found = await this.findAuthUser(person.email);
    if (!found) throw new Error('the account was reported as existing but could not be found');
    const profile = await this.prisma.profile.findUnique({ where: { userId: found.id }, select: { id: true } });
    if (profile) {
      await this.link(app, person, found.id, 'MEMBER');
      return { mode: 'MEMBER', user: null };
    }
    const unused = (found.user_metadata as Meta | undefined)?.needs_password_change === true;
    if (!isCoupleAccount(found.app_metadata) || unused) {
      // Nobody has chosen a password for it yet, so it starts again on the
      // phone number like a new account. A password someone chose is kept.
      const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(found.id, {
        app_metadata: { ...(found.app_metadata ?? {}), account: COUPLE_ACCOUNT_MARKER },
        ...(unused ? { password: phonePassword(person.phone), user_metadata: this.temporary(found.user_metadata, days) } : {}),
      });
      if (updateError || !updated.user) throw new Error(updateError?.message ?? 'the account could not be updated');
      await this.link(app, person, found.id, 'COUPLE');
      return { mode: modeOf(updated.user), user: updated.user };
    }
    await this.link(app, person, found.id, 'COUPLE');
    return { mode: modeOf(found), user: found };
  }

  private async findAuthUser(email: string) {
    const supabase = createAdminClient();
    const wanted = email.toLowerCase();
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(error.message);
      const hit = data.users.find((u) => u.email?.toLowerCase() === wanted);
      if (hit) return hit;
      if (data.users.length < 1000) return null;
    }
    return null;
  }

  private async link(app: CounsellingApplication, person: Person, authUserId: string, kind: 'MEMBER' | 'COUPLE') {
    try {
      await this.prisma.$transaction(async (tx) => {
        const row = await tx.counsellingParticipant.create({
          data: { id: randomUUID(), tenantId: app.tenantId, applicationId: app.id, side: person.side, authUserId, accountKind: kind },
        });
        await counsellingAudit(tx, {
          tenantId: this.access.tenantId,
          actor: null,
          action: kind === 'MEMBER' ? 'COUNSELLING_ACCOUNT_LINKED' : 'COUNSELLING_ACCOUNT_CREATED',
          entity: 'CounsellingParticipant',
          entityId: row.id,
        });
      });
    } catch (err) {
      // Two requests raced: the other one linked this person first.
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) throw err;
    }
  }
}
