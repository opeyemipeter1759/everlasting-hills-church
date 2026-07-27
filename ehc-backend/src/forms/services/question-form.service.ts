import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { QuestionDto } from '../dto/question.dto';
import { buildQuestionAdminText, buildQuestionVisitorText } from '../forms-text-templates.util';
import { FormsEmailDispatchService } from './forms-email-dispatch.service';

@Injectable()
export class QuestionFormService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailDispatch: FormsEmailDispatchService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  /** Same shape/semantics as submitPrayerRequest — memberId is populated only when
   * the submitter is signed in (optional auth), kept even when is_anonymous. */
  async submitQuestion(data: QuestionDto, memberId: string | null = null) {
    const normalizedEmail = data.email?.trim();
    const normalizedPhone = data.phone?.trim();
    const displayName = data.is_anonymous ? 'Anonymous' : data.name?.trim() || 'Anonymous';

    const record = await this.prisma.question.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        question: data.question.trim(),
        name: data.name ? data.name.trim() : null,
        email: normalizedEmail ?? null,
        phone: normalizedPhone ?? null,
        isAnonymous: data.is_anonymous ?? false,
        memberId,
      },
    });

    this.emailDispatch.dispatch({
      to: this.emailDispatch.adminEmail,
      subject: `New Question from ${displayName}`,
      text: buildQuestionAdminText(data),
      tag: 'question-admin',
    });
    if (normalizedEmail) {
      this.emailDispatch.dispatch({
        to: normalizedEmail,
        subject: 'We received your question',
        text: buildQuestionVisitorText(data),
        tag: 'question-visitor',
      });
    }

    return {
      success: true,
      message: 'Question submitted successfully',
      data: record,
    };
  }

  /** Admin list, newest first. The linked member (if the submitter was signed
   * in) is always included regardless of isAnonymous — see submitQuestion. */
  async listQuestions() {
    const rows = await this.prisma.question.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { submittedAt: 'desc' },
      include: {
        Member: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, photoUrl: true },
        },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      question: r.question,
      name: r.name,
      email: r.email,
      phone: r.phone,
      isAnonymous: r.isAnonymous,
      submittedAt: r.submittedAt.toISOString(),
      status: r.status,
      member: r.Member,
    }));
  }

  async deleteQuestion(id: string) {
    const result = await this.prisma.question.deleteMany({ where: { id, tenantId: this.tenantId } });
    if (result.count === 0) throw new NotFoundException('Question not found');
    return { id, deleted: true };
  }

  async updateQuestionStatus(id: string, status: 'PENDING' | 'ANSWERED') {
    const result = await this.prisma.question.updateMany({
      where: { id, tenantId: this.tenantId },
      data: { status },
    });
    if (result.count === 0) throw new NotFoundException('Question not found');
    return { id, status };
  }
}
