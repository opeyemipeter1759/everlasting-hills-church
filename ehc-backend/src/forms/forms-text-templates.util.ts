import type { PrayerRequestDto } from './dto/prayer-request.dto';
import type { QuestionDto } from './dto/question.dto';
import type { TestimonyDto } from './dto/testimony.dto';
import type { WelfareRequestDto } from './dto/welfare-request.dto';
import { escapeHtml, renderEmailLayout } from '../notifications/templates/layout';

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
  const displayName = d.is_anonymous ? 'friend' : d.name?.trim() || 'friend';
  return [
    `Dear ${displayName},`,
    '',
    'Thank you for sending in your question.',
    '',
    'We’ve received it, and we’ll be addressing questions like yours during the next Question and Answer service. We’re looking forward to being part of the conversation and trusting God for wisdom and clarity as we explore these questions together.',
    '',
    'We’ll see you in service today!',
    '',
    'God bless you!',
    'Everlasting Hills Church',
  ].join('\n');
}

export function buildQuestionVisitorHtml(d: QuestionDto): string {
  const displayName = d.is_anonymous ? 'friend' : d.name?.trim() || 'friend';
  const bodyHtml = `
    <p style="margin:0 0 16px;font-family:Arial, Helvetica, sans-serif;color:#111827;font-size:11pt;line-height:1.7"><strong>Dear ${escapeHtml(displayName)},</strong></p>
    <p style="margin:0 0 16px;font-family:Arial, Helvetica, sans-serif;color:#111827;font-size:11pt;line-height:1.7">Thank you for sending in your question.</p>
    <p style="margin:0 0 16px;font-family:Arial, Helvetica, sans-serif;color:#111827;font-size:11pt;line-height:1.7">We’ve received it, and we’ll be addressing questions like yours during the next Question and Answer service. We’re looking forward to being part of the conversation and trusting God for wisdom and clarity as we explore these questions together.</p>
    <p style="margin:0 0 16px;font-family:Arial, Helvetica, sans-serif;color:#111827;font-size:11pt;line-height:1.7">We’ll see you in service today!</p>
    <p style="margin:0 0 4px;font-family:Arial, Helvetica, sans-serif;color:#111827;font-size:11pt;line-height:1.7">God bless you!<br/>Everlasting Hills Church</p>
  `;

  return renderEmailLayout({
    heading: 'Question received',
    bodyHtml,
  });
}

export function buildTestimonyAdminText(d: TestimonyDto): string {
  const displayName = d.is_anonymous ? 'Anonymous' : d.name?.trim() || 'Anonymous';
  return [
    `Name: ${displayName}`,
    `Email: ${d.email ?? '—'}`,
    `Phone: ${d.phone ?? '—'}`,
    `Wants to stay anonymous: ${d.is_anonymous ? 'Yes' : 'No'}`,
    `Willing to share physically: ${d.share_physically === undefined ? 'Not answered' : d.share_physically ? 'Yes' : 'No'}`,
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

export function buildWelfareAdminText(d: WelfareRequestDto, referenceCode: string): string {
  return [
    `Reference: ${referenceCode}`,
    `Name: ${d.fullName}`,
    `Phone: ${d.phone}`,
    `Email: ${d.email}`,
    `Worker in church: ${d.isWorkerInChurch ? 'Yes' : 'No'}`,
    `Address: ${d.address}`,
    `Attending for: ${d.attendanceLength}`,
    `Occupation: ${d.occupation}`,
    `Needs help with: ${d.category}`,
    `Urgency: ${d.urgency}`,
    '',
    'Description:',
    d.description,
  ].join('\n');
}

export function buildWelfareVisitorText(d: WelfareRequestDto, referenceCode: string): string {
  const firstName = d.fullName.trim().split(/\s+/)[0] || 'Friend';
  return [
    `Dear ${firstName},`,
    '',
    'We have received your request and someone from our welfare team will reach out to you soon.',
    'This conversation stays between you and the team handling it.',
    '',
    `Your reference code is ${referenceCode}. Please keep it in case you need to follow up.`,
    '',
    'With love,',
    'Everlasting Hills Church',
  ].join('\n');
}
