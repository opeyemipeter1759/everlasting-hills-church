import { EyeOff, ShieldCheck, Users } from "lucide-react";
import type { AdminTestimonial } from "@/lib/api/testimonials";
import { Avatar } from "@/components/dashboard/admin/departments/HeadPicker";
import { fmt } from "./shared";

/** Who gave the testimony, how to reach them, and whether they want anonymity or to share in person. */
export default function TestimonialAuthor({ t }: { t: AdminTestimonial }) {
  // A signed-in member is always linked (even when isAnonymous — see submitTestimony)
  // so admins can identify who really submitted, distinct from a public guest.
  const displayName = t.member ? `${t.member.firstName} ${t.member.lastName}` : t.authorName;
  const avatarPhoto = t.member?.photoUrl ?? t.authorPhotoUrl;

  return (
    <div className="flex items-center gap-3">
      <Avatar name={displayName} photoUrl={avatarPhoto} px={36} />
      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{displayName}</p>
          {t.member && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400"
              title="Signed in when submitted"
            >
              <ShieldCheck size={9} /> Verified
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400">
          {t.authorRole ? `${t.authorRole} · ` : ""}{fmt(t.createdAt)}
        </p>
        {t.member?.email && (
          <p className="text-[11px] text-gray-400">Member contact: {t.member.email}{t.member.phone ? ` · ${t.member.phone}` : ""}</p>
        )}
        {t.submitterContact && <p className="text-[11px] text-gray-400">Contact: {t.submitterContact}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {t.isAnonymous && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:text-white/60">
              <EyeOff size={10} /> Wants to stay anonymous
            </span>
          )}
          {t.sharePhysically !== null && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                t.sharePhysically
                  ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"
                  : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50"
              }`}
            >
              <Users size={10} /> {t.sharePhysically ? "Willing to share physically" : "Prefers not to share physically"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
