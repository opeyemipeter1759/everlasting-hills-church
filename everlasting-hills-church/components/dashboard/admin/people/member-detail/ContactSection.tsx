import Link from "next/link";
import { Gift, Heart, Mail, MapPin, Phone, UserCheck } from "lucide-react";
import { fmtBirthday, genderLabel } from "../peopleShared";
import { InfoRow } from "./shared";
import type { MemberDetail } from "./types";

function maritalLine(m: MemberDetail): string {
  const married = m.maritalStatus ? m.maritalStatus === "MARRIED" : !!m.weddingAnniversary;
  if (!married) return "Single";
  if (m.Spouse) return `Married to ${m.Spouse.firstName} ${m.Spouse.lastName}`.trim();
  return m.spouseName ? `Married to ${m.spouseName}` : "Married";
}

export default function ContactSection({ member: m }: { member: MemberDetail }) {
  return (
    <>
      <InfoRow icon={<Mail size={14} />} label="Email" value={m.email ?? "—"} />
      <InfoRow icon={<Phone size={14} />} label="Phone" value={m.phone ?? "—"} />
      <InfoRow icon={<UserCheck size={14} />} label="Gender" value={genderLabel(m.gender)} />
      <InfoRow icon={<Gift size={14} />} label="Birthday" value={fmtBirthday(m.dateOfBirth)} />
      <InfoRow icon={<Heart size={14} />} label="Marital status" value={maritalLine(m)} />
      {m.Spouse && (
        <p className="py-2 text-sm">
          <Link href={`/dashboard/admin/members/${m.Spouse.id}`} className="font-semibold text-[#87102C] hover:underline dark:text-[#e8768a]">
            Open {m.Spouse.firstName}&apos;s record
          </Link>
        </p>
      )}
      <InfoRow icon={<MapPin size={14} />} label="Address" value={m.address ?? "—"} />
    </>
  );
}
