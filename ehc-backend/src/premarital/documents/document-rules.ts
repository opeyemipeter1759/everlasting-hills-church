import type { CounsellingApplicantRole, CounsellingParticipantSide, CounsellingRequirementKind } from '@prisma/client';
import type { CaseTier } from '../case-access';
import { lagosToday } from '../lagos-time';
import type { LetterVars } from './letter-blocks';

/**
 * Who may do what with counselling documents (decided 2026-11-20):
 *
 *   Medical certificates  open, verify, mark received, ask again: Pastor only.
 *                         Not Super Admin, not Marriage Ministry, not
 *                         counsellors. Anyone else gets 404 for the file.
 *   Consent letter        open: Pastor, Super Admin, Marriage Ministry, and a
 *                         counsellor on the case. Verify, mark received, ask
 *                         again: Pastor, Super Admin, Marriage Ministry.
 *   Reopen an accepted document, delete a closed case's stored files: Pastor.
 *
 * CaseAccess.open runs first, so a case the person cannot see is 404 already.
 */
export const REQUIREMENT_KINDS: readonly CounsellingRequirementKind[] = [
  'PARENTAL_CONSENT',
  'MEDICAL_CERT_GROOM',
  'MEDICAL_CERT_BRIDE',
];

export const isMedical = (k: CounsellingRequirementKind) => k !== 'PARENTAL_CONSENT';

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
  return tier !== 'COUNSELLOR' || kind === 'PARENTAL_CONSENT';
}

/**
 * What a partner may upload on the couple dashboard: the consent letter (either
 * of them), and their own medical certificate only, because the storage
 * consent must come from the person the certificate belongs to.
 */
export function mayUpload(role: CounsellingApplicantRole | null, kind: CounsellingRequirementKind): boolean {
  if (kind === 'PARENTAL_CONSENT') return true;
  return role !== null && kind === (role === 'GROOM' ? 'MEDICAL_CERT_GROOM' : 'MEDICAL_CERT_BRIDE');
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

export function letterVars(
  app: Names & { referenceCode: string; submittedAt: Date },
  o: { issueDay: string; validityDays: number; returnInstructions: string },
): LetterVars {
  const couple = coupleOf(app);
  if (!couple) throw new Error('The applicant role is not set');
  return {
    applicationRef: letterRef(app.referenceCode),
    issueDate: longDate(o.issueDay),
    groomName: couple.groom.full,
    brideName: couple.bride.full,
    applicationDate: longDate(lagosDay(app.submittedAt)),
    validFromDate: longDate(validFrom(app.submittedAt, o.validityDays)),
    returnInstructions: o.returnInstructions,
  };
}
