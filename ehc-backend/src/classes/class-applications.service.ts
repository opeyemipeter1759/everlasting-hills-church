import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnrollmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InboxService } from '../inbox/inbox.service';
import type { Env } from '../config/env.validation';
import type { AuthUser } from '../auth/types/auth-user';
import { CLASS_APPROVER_ROLES, hasAnyRole } from '../auth/policy/staff';
import { eligibility } from './class-rules';
import { ClassesLearnerService } from './classes-learner.service';

export type ApplicationFilter = 'PENDING' | 'APPROVED' | 'DECLINED';

/**
 * Applications to join a class. A member applies; a Super Admin, Pastor or Admin
 * Head approves or declines. Approval admits them (or holds them until they are
 * eligible), and either way the member is told in their inbox.
 */
@Injectable()
export class ClassApplicationsService {
  private readonly logger = new Logger(ClassApplicationsService.name);
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inbox: InboxService,
    private readonly learner: ClassesLearnerService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  private assertApprover(actor: AuthUser) {
    if (!hasAnyRole(actor, CLASS_APPROVER_ROLES)) {
      throw new ForbiddenException('Only a Super Admin, Pastor or Admin Head can approve applications to join a class');
    }
  }

  async list(actor: AuthUser, filter: ApplicationFilter = 'PENDING') {
    this.assertApprover(actor);
    const where =
      filter === 'PENDING'
        ? { status: EnrollmentStatus.PENDING }
        : filter === 'DECLINED'
          ? { status: EnrollmentStatus.DECLINED }
          : { decidedAt: { not: null }, status: { in: [EnrollmentStatus.WAITING, EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] } };
    const rows = await this.prisma.courseEnrollment.findMany({
      where: { tenantId: this.tenantId, Course: { isClass: true }, ...where },
      orderBy: filter === 'PENDING' ? { enrolledAt: 'asc' } : { decidedAt: 'desc' },
      take: 200,
      select: {
        id: true,
        status: true,
        enrolledAt: true,
        decidedAt: true,
        decisionNote: true,
        applicationAnswers: true,
        Course: { select: { title: true, slug: true, eligibilitySundays: true } },
        Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true, email: true, membershipStatus: true, creditedSundays: true } },
      },
    });
    return Promise.all(
      rows.map(async ({ Member, Course, ...row }) => {
        const sundays = await this.learner.sundayCheckins(Member.id);
        const { creditedSundays, ...member } = Member;
        return {
          ...row,
          Course: { title: Course.title, slug: Course.slug },
          Member: member,
          eligibility: eligibility(Course.eligibilitySundays, sundays, creditedSundays),
        };
      }),
    );
  }

  async pendingCount(actor: AuthUser) {
    this.assertApprover(actor);
    return this.prisma.courseEnrollment.count({
      where: { tenantId: this.tenantId, status: EnrollmentStatus.PENDING, Course: { isClass: true } },
    });
  }

  async decide(actor: AuthUser, enrollmentId: string, approve: boolean, note?: string) {
    this.assertApprover(actor);
    const application = await this.prisma.courseEnrollment.findFirst({
      where: { id: enrollmentId, tenantId: this.tenantId, Course: { isClass: true } },
      select: {
        id: true,
        status: true,
        Course: { select: { title: true, slug: true } },
        Member: { select: { profileId: true } },
      },
    });
    if (!application) throw new NotFoundException('That application is gone');
    if (application.status !== EnrollmentStatus.PENDING) throw new BadRequestException('That application has already been decided');

    const clean = note?.trim() || null;
    await this.prisma.courseEnrollment.update({
      where: { id: application.id },
      data: {
        status: approve ? EnrollmentStatus.WAITING : EnrollmentStatus.DECLINED,
        decidedAt: new Date(),
        decidedById: actor.profileId,
        decisionNote: clean,
        ...(approve ? { lastActivityAt: new Date() } : {}),
      },
    });

    // Approved: let them in now if they already meet the class's attendance rule.
    const opened = approve ? await this.learner.admit(application.id) : false;

    const title = application.Course.title;
    await this.inbox
      .createMany([
        {
          tenantId: this.tenantId,
          profileId: application.Member.profileId,
          type: 'class-application',
          title: approve ? `You are approved for ${title}` : `About your application to ${title}`,
          body: approve
            ? opened
              ? `Your application was approved. ${title} is open, so you can start now.`
              : `Your application was approved. ${title} opens once you have met its attendance requirement.`
            : clean || 'Your application was not approved this time. The church office will be in touch.',
          link: `/dashboard/classes/${application.Course.slug}`,
        },
      ])
      .catch((err: Error) => this.logger.warn(`Application notification failed: ${err.message}`));

    return { id: application.id, status: approve ? (opened ? 'ACTIVE' : 'WAITING') : 'DECLINED' };
  }
}
