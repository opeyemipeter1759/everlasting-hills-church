import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Env } from '../../config/env.validation';
import { ContactDto } from '../dto/contact.dto';
import { FormsEmailDispatchService } from './forms-email-dispatch.service';

@Injectable()
export class ContactFormService {
  private readonly tenantId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailDispatch: FormsEmailDispatchService,
    config: ConfigService<Env, true>,
  ) {
    this.tenantId = config.get('DEFAULT_TENANT_ID', { infer: true });
  }

  async submitContact(data: ContactDto) {
    const normalizedEmail = data.email.trim();
    const normalizedName = data.name.trim();

    const record = await this.prisma.contactMessage.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        name: normalizedName,
        email: normalizedEmail,
        message: data.message.trim(),
      },
    });

    const subjectLine = data.subject?.trim()
      ? `[Contact] ${data.subject.trim()}`
      : `New contact message from ${normalizedName}`;

    this.emailDispatch.dispatch({
      to: this.emailDispatch.adminEmail,
      subject: subjectLine,
      text: [
        `Name: ${normalizedName}`,
        `Email: ${normalizedEmail}`,
        `Phone: ${data.phone?.trim() ?? '—'}`,
        '',
        'Message:',
        data.message.trim(),
      ].join('\n'),
      tag: 'contact-admin',
    });

    this.emailDispatch.dispatch({
      to: normalizedEmail,
      subject: 'We received your message',
      text: [
        `Dear ${normalizedName.split(/\s+/)[0]},`,
        '',
        'Thanks for reaching out to Everlasting Hills Church. Our team will get back to you shortly.',
        '',
        'God bless you,',
        'Everlasting Hills Church',
      ].join('\n'),
      tag: 'contact-visitor',
    });

    return {
      success: true,
      message: 'Contact message submitted successfully',
      data: record,
    };
  }
}
