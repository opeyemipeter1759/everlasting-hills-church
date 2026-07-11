import { Gift, Mail, MapPin, Phone, UserCheck } from "lucide-react";
import { fmtBirthday, genderLabel } from "../peopleShared";
import { InfoRow } from "./shared";
import type { MemberDetail } from "./types";

export default function ContactSection({ member: m }: { member: MemberDetail }) {
  return (
    <>
      <InfoRow icon={<Mail size={14} />} label="Email" value={m.email ?? "—"} />
      <InfoRow icon={<Phone size={14} />} label="Phone" value={m.phone ?? "—"} />
      <InfoRow icon={<UserCheck size={14} />} label="Gender" value={genderLabel(m.gender)} />
      <InfoRow icon={<Gift size={14} />} label="Birthday" value={fmtBirthday(m.dateOfBirth)} />
      <InfoRow icon={<MapPin size={14} />} label="Address" value={m.address ?? "—"} />
    </>
  );
}
