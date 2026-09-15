import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import type { AuthUser } from '../../auth/types/auth-user';
import { localDate } from '../../reading-plan/local-date.util';
import { FormsEmailDispatchService } from './forms-email-dispatch.service';
import type { PledgeDto, PledgeMethod } from '../dto/pledge.dto';

/**
 * Projects members can pledge towards. The key is the URL segment, so a new
 * appeal is one line here rather than a new feature.
 */
export const PLEDGE_CAMPAIGNS = {
  'sound-media': { title: 'Sound & Media Project' },
} as const;
export type PledgeCampaign = keyof typeof PLEDGE_CAMPAIGNS;

const TIMEZONE = 'Africa/Lagos';

const METHOD_LABEL: Record<PledgeMethod, string> = {
  ONE_TIME: 'One-time payment',
  WEEKLY: 'Weekly installments',
  MONTHLY: 'Monthly installments',
  OTHER: 'Other',
};

interface StoredPledge {
  profileId: string;
  memberId: string | null;
  fullName: string;
  phone: string;
  email: string;
  amount: number;
  method: PledgeMethod;
  methodOther: string | null;
  installmentAmount: number | null;
  completeBy: string;
  contactMe: boolean;
  createdAt: string;
  updatedAt: string;
}

const naira = (amount: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);

const longDate = (date: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));

/**
 * Financial pledges from members, stored as form submissions so a new appeal
 * needs no database change.
 *
 * One pledge per member per project: submitting again updates it, because a
 * pledge is a single intention that changes with circumstances, not a stream
 * of entries. The member and the church are both emailed, the same way every
 * other church form confirms itself.
 */
@Injectable()
export class PledgeService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emails: FormsEmailDispatchService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private campaignOrThrow(campaign: string): PledgeCampaign {
    if (!Object.prototype.hasOwnProperty.call(PLEDGE_CAMPAIGNS, campaign)) {
      throw new NotFoundException('There is no pledge appeal with that name');
    }
    return campaign as PledgeCampaign;
  }

  private type(campaign: PledgeCampaign) {
    return `pledge:${campaign}`;
  }

  private profileOrThrow(actor: AuthUser): string {
    if (!actor.profileId) throw new ForbiddenException('No profile linked to this account');
    return actor.profileId;
  }

  private find(campaign: PledgeCampaign, profileId: string) {
    return this.prisma.formSubmission.findFirst({
      where: {
        tenantId: this.tenantId,
        type: this.type(campaign),
        data: { path: ['profileId'], equals: profileId },
      },
    });
  }

  /** The member's own pledge, or null when they have not pledged yet. */
  async mine(actor: AuthUser, campaignKey: string) {
    const campaign = this.campaignOrThrow(campaignKey);
    const row = await this.find(campaign, this.profileOrThrow(actor));
    return row ? this.present(row) : null;
  }

  async submit(actor: AuthUser, campaignKey: string, input: PledgeDto) {
    const campaign = this.campaignOrThrow(campaignKey);
    const profileId = this.profileOrThrow(actor);
    this.assertCoherent(input);

    const existing = await this.find(campaign, profileId);
    const now = new Date().toISOString();
    const inInstallments = input.method === 'WEEKLY' || input.method === 'MONTHLY';
    const stored: StoredPledge = {
      profileId,
      memberId: actor.memberId ?? null,
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      email: input.email.trim().toLowerCase(),
      amount: input.amount,
      method: input.method,
      methodOther: input.method === 'OTHER' ? (input.methodOther ?? '').trim() : null,
      installmentAmount: inInstallments ? (input.installmentAmount ?? null) : null,
      completeBy: input.completeBy.slice(0, 10),
      contactMe: input.contactMe,
      // Updating a pledge keeps the day it was first made.
      createdAt:
        (existing?.data as Partial<StoredPledge> | undefined)?.createdAt ??
        existing?.submittedAt.toISOString() ??
        now,
      updatedAt: now,
    };

    const row = existing
      ? await this.prisma.formSubmission.update({
          where: { id: existing.id },
          data: { data: stored as unknown as Prisma.InputJsonValue },
        })
      : await this.prisma.formSubmission.create({
          data: {
            id: randomUUID(),
            tenantId: this.tenantId,
            type: this.type(campaign),
            data: stored as unknown as Prisma.InputJsonValue,
          },
        });

    this.notify(campaign, stored, Boolean(existing));
    return this.present(row);
  }

  /** Every pledge to the project, newest first, with the totals leaders ask for. */
  async list(campaignKey: string) {
    const campaign = this.campaignOrThrow(campaignKey);
    const rows = await this.prisma.formSubmission.findMany({
      where: { tenantId: this.tenantId, type: this.type(campaign) },
      orderBy: { submittedAt: 'desc' },
    });
    const pledges = rows.map((row) => this.present(row));
    return {
      campaign: { key: campaign, title: PLEDGE_CAMPAIGNS[campaign].title },
      totals: {
        pledges: pledges.length,
        amount: pledges.reduce((sum, pledge) => sum + pledge.amount, 0),
        wantContact: pledges.filter((pledge) => pledge.contactMe).length,
      },
      pledges,
    };
  }

  /** Rules that span fields, which decorators on single fields cannot say. */
  private assertCoherent(input: PledgeDto) {
    const inInstallments = input.method === 'WEEKLY' || input.method === 'MONTHLY';
    if (inInstallments && !input.installmentAmount) {
      throw new BadRequestException('Tell us how much you expect to give per installment');
    }
    if (inInstallments && input.installmentAmount! > input.amount) {
      throw new BadRequestException('An installment cannot be more than the whole pledge');
    }
    if (input.method === 'OTHER' && !input.methodOther?.trim()) {
      throw new BadRequestException('Tell us how you intend to redeem your pledge');
    }
    if (input.completeBy.slice(0, 10) < localDate(TIMEZONE)) {
      throw new BadRequestException('Choose a completion date from today onwards');
    }
  }

  private present(row: { id: string; data: Prisma.JsonValue; submittedAt: Date }) {
    const { profileId: _profileId, ...pledge } = row.data as unknown as StoredPledge;
    return { id: row.id, ...pledge };
  }

  private notify(campaign: PledgeCampaign, pledge: StoredPledge, updated: boolean) {
    const title = PLEDGE_CAMPAIGNS[campaign].title;
    const plan =
      pledge.method === 'OTHER'
        ? `Other: ${pledge.methodOther}`
        : pledge.installmentAmount
          ? `${METHOD_LABEL[pledge.method]} of ${naira(pledge.installmentAmount)}`
          : METHOD_LABEL[pledge.method];
    const details = [
      `Name: ${pledge.fullName}`,
      `Phone (WhatsApp): ${pledge.phone}`,
      `Email: ${pledge.email}`,
      `Pledge: ${naira(pledge.amount)}`,
      `How: ${plan}`,
      `Complete by: ${longDate(pledge.completeBy)}`,
      `Contact about this pledge: ${pledge.contactMe ? 'Yes' : 'No'}`,
    ];

    this.emails.dispatch({
      to: this.emails.adminEmail,
      subject: `${updated ? 'Updated pledge' : 'New pledge'}: ${pledge.fullName} · ${naira(pledge.amount)} · ${title}`,
      text: details.join('\n'),
      tag: 'pledge-admin',
    });

    this.emails.dispatch({
      to: pledge.email,
      subject: `Your pledge to the ${title} — Everlasting Hills Church`,
      text: [
        `Dear ${pledge.fullName.split(/\s+/)[0]},`,
        '',
        `Thank you for pledging towards the ${title}. Your support strengthens our sound, media, recording, streaming and technical work for worship and ministry.`,
        '',
        ...details.slice(3),
        '',
        'If your circumstances change, you can update your pledge from your dashboard or let the project team know.',
        '',
        'God bless you,',
        'Everlasting Hills Church',
      ].join('\n'),
      tag: 'pledge-member',
    });
  }
}
