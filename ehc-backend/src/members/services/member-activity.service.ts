import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { earnedBadges, type BadgeTrackKey } from '../badges';

const dates = <T>(rows: T[], pick: (row: T) => Date | null | undefined): Date[] =>
  rows.map(pick).filter((d): d is Date => d instanceof Date);

/**
 * What a member has done in the church family, for their profile: the figures
 * along the top, every badge they have earned, and the articles they have
 * written. Counts and titles only; never who they reached or what they said.
 */
@Injectable()
export class MemberActivityService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async activity(memberId: string) {
    const tenantId = this.tenantId;
    const member = await this.prisma.member.findUnique({ where: { id: memberId }, select: { profileId: true } });
    const profileId = member?.profileId ?? '';
    const [
      attendance,
      bibleDays,
      plans,
      contacts,
      salvation,
      books,
      birthdays,
      likesGiven,
      profileComments,
      sermonComments,
      bookComments,
      articles,
      courses,
      likesReceived,
      commentsReceived,
    ] = await Promise.all([
      this.prisma.attendanceRecord.findMany({ where: { memberId, present: true }, select: { checkedInAt: true } }),
      this.prisma.memberPlanProgress.findMany({ where: { profileId }, select: { completedAt: true } }),
      this.prisma.memberPlanSubscription.findMany({
        where: { profileId, status: 'COMPLETED' },
        select: { completedAt: true, updatedAt: true },
      }),
      this.prisma.evangelismContact.findMany({
        where: { tenantId, workerMemberId: memberId },
        select: { contactDate: true, savedStatus: true },
      }),
      this.prisma.salvationDecision.findMany({ where: { memberId }, select: { createdAt: true } }),
      this.prisma.memberBookRead.findMany({ where: { memberId }, select: { readAt: true } }),
      this.prisma.birthdayGreeting.findMany({ where: { authorMemberId: memberId }, select: { createdAt: true } }),
      this.prisma.profileLike.findMany({ where: { likerMemberId: memberId }, select: { createdAt: true } }),
      this.prisma.profileComment.findMany({ where: { authorMemberId: memberId }, select: { createdAt: true } }),
      this.prisma.sermonComment.findMany({ where: { memberId }, select: { createdAt: true } }),
      this.prisma.bookComment.findMany({ where: { memberId }, select: { createdAt: true } }),
      this.prisma.memberArticle.findMany({
        where: { tenantId, authorId: profileId, status: 'PUBLISHED' },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImageUrl: true,
          readingMinutes: true,
          likeCount: true,
          publishedAt: true,
        },
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.courseEnrollment.findMany({ where: { memberId, completed: true }, select: { completedAt: true, enrolledAt: true } }),
      this.prisma.profileLike.count({ where: { memberId } }),
      this.prisma.profileComment.count({ where: { memberId } }),
    ]);

    const activity: Record<BadgeTrackKey, Date[]> = {
      attendance: dates(attendance, (r) => r.checkedInAt),
      bibleDays: dates(bibleDays, (r) => r.completedAt),
      plansFinished: dates(plans, (r) => r.completedAt ?? r.updatedAt),
      reached: dates(contacts, (r) => r.contactDate),
      saved: dates(contacts.filter((c) => c.savedStatus === 'YES'), (r) => r.contactDate),
      salvation: dates(salvation, (r) => r.createdAt),
      books: dates(books, (r) => r.readAt),
      birthdays: dates(birthdays, (r) => r.createdAt),
      likes: dates(likesGiven, (r) => r.createdAt),
      comments: [
        ...dates(profileComments, (r) => r.createdAt),
        ...dates(sermonComments, (r) => r.createdAt),
        ...dates(bookComments, (r) => r.createdAt),
      ],
      articles: dates(articles, (r) => r.publishedAt),
      courses: dates(courses, (r) => r.completedAt ?? r.enrolledAt),
    };
    const { badges, progress } = earnedBadges(activity);

    return {
      stats: {
        servicesAttended: activity.attendance.length,
        daysInTheWord: activity.bibleDays.length,
        plansFinished: activity.plansFinished.length,
        peopleReached: activity.reached.length,
        soulsWon: activity.saved.length,
        booksRead: activity.books.length,
        articlesPublished: articles.length,
        coursesCompleted: activity.courses.length,
        badges: badges.length,
        likesReceived,
        commentsReceived,
      },
      badges,
      progress,
      articles,
    };
  }
}
