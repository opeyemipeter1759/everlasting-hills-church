import type { CaseDetail } from "@/lib/api/premarital";
import { CONTACT_OPTIONS, MEMBERSHIP_OPTIONS } from "@/lib/pre-marital/schema";
import { card } from "../ui";

function Row({ label, value, href }: { label: string; value: string | null | undefined; href?: string }) {
  return (
    <div className="grid gap-0.5 py-2 sm:grid-cols-[10rem_1fr] sm:gap-3">
      <dt className="text-sm text-gray-600 dark:text-white/55">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-[#111] dark:text-white/90">
        {value ? (href ? <a href={href} className="text-[#87102C] underline-offset-2 hover:underline dark:text-[#f3a9b8]">{value}</a> : value) : "Not given"}
      </dd>
    </div>
  );
}

const tel = (v: string | null) => (v ? `tel:${v.replace(/\s/g, "")}` : undefined);

/** Who they are and how to reach them, as they wrote it. */
export function PeoplePanel({ c }: { c: CaseDetail }) {
  return (
    <section aria-labelledby="people-heading" className={card}>
      <h2 id="people-heading" className="text-base font-bold text-[#111] dark:text-white">The couple</h2>
      <dl className="mt-1 divide-y divide-gray-100 dark:divide-white/[0.06]">
        <Row label="Applicant" value={`${c.applicantFirstName} ${c.applicantLastName}`} />
        <Row label="Phone" value={c.applicantPhone} href={tel(c.applicantPhone)} />
        <Row label="Email" value={c.applicantEmail} href={`mailto:${c.applicantEmail}`} />
        <Row label="Partner" value={`${c.partnerFirstName} ${c.partnerLastName}`} />
        <Row label="Partner's phone" value={c.partnerPhone} href={tel(c.partnerPhone)} />
        <Row label="Partner's email" value={c.partnerEmail} href={c.partnerEmail ? `mailto:${c.partnerEmail}` : undefined} />
        <Row label="Membership" value={MEMBERSHIP_OPTIONS.find((o) => o.value === c.membership)?.label} />
        {c.member && <Row label="Linked member" value={c.member.name} />}
        <Row label="Contact them by" value={CONTACT_OPTIONS.find((o) => o.value === c.preferredContact)?.label} />
        <Row label="In their words" value={c.intro} />
      </dl>
    </section>
  );
}
