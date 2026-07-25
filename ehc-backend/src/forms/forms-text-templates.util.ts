import type { PrayerRequestDto } from './dto/prayer-request.dto';
import type { QuestionDto } from './dto/question.dto';
import type { TestimonyDto } from './dto/testimony.dto';

export function buildPrayerAdminText(d: PrayerRequestDto): string {
  const displayName = d.is_anonymous ? 'Anonymous' : d.name?.trim() || 'Anonymous';
  return [
    `Name: ${displayName}`,
    `Email: ${d.email ?? '—'}`,
    `Phone: ${d.phone ?? '—'}`,
    '',
    'Request:',
    d.request,
  ].join('\n');
}

export function buildPrayerVisitorText(d: PrayerRequestDto): string {
  const displayName = d.is_anonymous ? 'Anonymous' : d.name?.trim() || 'Anonymous';
  return [
    `Dear ${displayName},`,
    '',
    'We have received your prayer request and will be praying with you.',
    'Our team will follow up if needed.',
    '',
    'God bless you,',
    'Everlasting Hills Church',
  ].join('\n');
}

export function buildQuestionAdminText(d: QuestionDto): string {
  const displayName = d.is_anonymous ? 'Anonymous' : d.name?.trim() || 'Anonymous';
  return [
    `Name: ${displayName}`,
    `Email: ${d.email ?? '—'}`,
    `Phone: ${d.phone ?? '—'}`,
    '',
    'Question:',
    d.question,
  ].join('\n');
}

export function buildQuestionVisitorText(d: QuestionDto): string {
  const displayName = d.is_anonymous ? 'Anonymous' : d.name?.trim() || 'Anonymous';
  return [
    `Dear ${displayName},`,
    '',
    'We have received your question and our team will get back to you shortly.',
    '',
    'God bless you,',
    'Everlasting Hills Church',
  ].join('\n');
}

export function buildTestimonyAdminText(d: TestimonyDto): string {
  return [
    `Name: ${d.name?.trim() || 'Anonymous'}`,
    `Email: ${d.email ?? '—'}`,
    `Phone: ${d.phone ?? '—'}`,
    '',
    `Title: ${d.title ?? 'N/A'}`,
    '',
    'Testimony:',
    d.testimony ?? 'N/A',
  ].join('\n');
}

export function buildTestimonyVisitorText(d: TestimonyDto): string {
  return [
    `Dear ${d.name?.trim() || 'Beloved'},`,
    '',
    'Thank you for sharing your testimony with Everlasting Hills Church.',
    'We celebrate what God has done in your life.',
    '',
    'God bless you,',
    'Everlasting Hills Church',
  ].join('\n');
}
