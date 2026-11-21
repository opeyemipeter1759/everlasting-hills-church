import type { CounsellingApplicantRole, CounsellingParticipantSide, CounsellingRequirementKind } from '@prisma/client';
import type { CaseTier } from '../case-access';
import { lagosToday } from '../lagos-time';
import type { LetterVars } from './letter-blocks';

/**
 * Who may do what with counselling documents (decided 2026-11-20):
 *
 *   Medical certificates  open, verify, ask again: Pastor only. Not Super
 *                         Admin, not Marriage Ministry, not counsellors.
 *                         Anyone else gets 404 for the file.
 *   Consent letters       open: Pastor, Super Admin, Marriage Ministry, and a
 *                         counsellor on the case. Verify, ask again: Pastor,
 *                         Super Admin, Marriage Ministry.
 *   Reopen an accepted document, delete a closed case's stored files: Pastor.
 *
 * Each partner has two documents (2026-11-21): their own consent letter,
 * signed by one of their parents or a recognised guardian, and their own
 * medical certificate. Everything is submitted on the website.
 *
 * CaseAccess.open runs first, so a case the person cannot see is 404 already.
 */
export const REQUIREMENT_KINDS: readonly CounsellingRequirementKind[] = [
  'PARENTAL_CONSENT_GROOM',
  'MEDICAL_CERT_GROOM',
  'PARENTAL_CONSENT_BRIDE',
  'MEDICAL_CERT_BRIDE',
];

export const isMedical = (k: CounsellingRequirementKind) => k === 'MEDICAL_CERT_GROOM' || k === 'MEDICAL_CERT_BRIDE';

/** Whose document this is. */
export const ownerOf = (k: CounsellingRequirementKind): CounsellingApplicantRole =>
  k === 'PARENTAL_CONSENT_GROOM' || k === 'MEDICAL_CERT_GROOM' ? 'GROOM' : 'BRIDE';

/** One partner's two documents: consent letter first, then certificate. */
export const kindsOf = (role: CounsellingApplicantRole): CounsellingRequirementKind[] =>
  role === 'GROOM' ? ['PARENTAL_CONSENT_GROOM', 'MEDICAL_CERT_GROOM'] : ['PARENTAL_CONSENT_BRIDE', 'MEDICAL_CERT_BRIDE'];

const STAFF: readonly CaseTier[] = ['PASTOR', 'SUPER_ADMIN', 'MINISTRY'];

export function mayOpen(tier: CaseTier, kind: CounsellingRequirementKind): boolean {
  if (isMedical(kind)) return tier === 'PASTOR';
  return STAFF.includes(tier) || tier === 'COUNSELLOR';
}

export function mayReview(tier: CaseTier, kind: CounsellingRequirementKind): boolean {
  return isMedical(kind) ? tier === 'PASTOR' : STAFF.includes(tier);
}

/** Whether this person sees the requirement row at all (status only, never content). */
export function maySeeRow(tier: CaseTier, kind: CounsellingRequirementKind): boolean {
  return tier !== 'COUNSELLOR' || !isMedical(kind);
}

/** What a partner may upload on their dashboard: their own consent letter and their own medical certificate, nothing of the other's. */
export function mayUpload(role: CounsellingApplicantRole | null, kind: CounsellingRequirementKind): boolean {
  return role !== null && ownerOf(kind) === role;
}

type Names = {
  applicantRole: CounsellingApplicantRole | null;
  applicantFirstName: string;
  applicantLastName: string;
  partnerFirstName: string;
  partnerLastName: string;
};

/** Groom and bride from who applied. Null while the role is not set. */
export function coupleOf(a: Names): { groom: { first: string; full: string }; bride: { first: string; full: string } } | null {
  if (!a.applicantRole) return null;
  const applicant = { first: a.applicantFirstName, full: `${a.applicantFirstName} ${a.applicantLastName}` };
  const partner = { first: a.partnerFirstName, full: `${a.partnerFirstName} ${a.partnerLastName}` };
  return a.applicantRole === 'GROOM' ? { groom: applicant, bride: partner } : { groom: partner, bride: applicant };
}

/** Groom or bride, for one side of the application. Null while the applicant's role is not set. */
export function roleOf(applicantRole: CounsellingApplicantRole | null, side: CounsellingParticipantSide): CounsellingApplicantRole | null {
  if (!applicantRole) return null;
  const groom = (applicantRole === 'GROOM') === (side === 'APPLICANT');
  return groom ? 'GROOM' : 'BRIDE';
}

/** "PMC-7K4QH2" prints as "7K4QH2" after EHC/MFM/PMC/. */
export const letterRef = (referenceCode: string) => referenceCode.replace(/^PMC-/, '');

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** "2026-11-20" as "20 November 2026". */
export function longDate(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** The Lagos calendar day of an instant, as YYYY-MM-DD. */
export const lagosDay = (at: Date) => lagosToday(at);

export function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The earliest test date the letter accepts: the application day minus the validity window. */
export const validFrom = (submittedAt: Date, validityDays: number) => addDays(lagosDay(submittedAt), -validityDays);

/** The values for one partner's letters: the person they are for, their partner, and the dates. */
export function letterVars(
  app: Names & { referenceCode: string; submittedAt: Date },
  o: { issueDay: string; validityDays: number; returnInstructions: string; person: CounsellingApplicantRole },
): LetterVars {
  const couple = coupleOf(app);
  if (!couple) throw new Error('The applicant role is not set');
  const [me, them] = o.person === 'GROOM' ? [couple.groom, couple.bride] : [couple.bride, couple.groom];
  return {
    applicationRef: letterRef(app.referenceCode),
    issueDate: longDate(o.issueDay),
    personName: me.full,
    personRole: o.person === 'GROOM' ? 'intending groom' : 'intending bride',
    partnerName: them.full,
    groomName: couple.groom.full,
    brideName: couple.bride.full,
    applicationDate: longDate(lagosDay(app.submittedAt)),
    validFromDate: longDate(validFrom(app.submittedAt, o.validityDays)),
    returnInstructions: o.returnInstructions,
  };
}
