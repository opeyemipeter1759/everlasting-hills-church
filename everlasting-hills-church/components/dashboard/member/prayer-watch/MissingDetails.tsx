import Link from "next/link";
import { fieldCls } from "./ui";
import type { WatchSignup } from "./useWatchSignup";

const LABEL = "mb-1 block text-xs font-medium text-gray-500 dark:text-white/45";

/** Only the details the member's profile is missing, to fill in here or on their profile. */
export function MissingDetails({ signup }: { signup: WatchSignup }) {
  const { needs, fields, set } = signup;
  if (!needs.name && !needs.email && !needs.phone) return null;
  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-xs text-gray-500 dark:text-white/45">
        A few details are missing from your profile — fill them in here, or{" "}
        <Link href="/dashboard/profile" className="font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
          update your profile
        </Link>{" "}
        first.
      </p>
      {needs.name && (
        <div>
          <label className={LABEL}>Full name</label>
          <input value={fields.fullName} onChange={(e) => set.fullName(e.target.value)} placeholder="Your name" className={fieldCls} />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {needs.phone && (
          <div>
            <label className={LABEL}>Phone number</label>
            <input value={fields.phone} onChange={(e) => set.phone(e.target.value)} placeholder="+234 801 234 5678" className={fieldCls} />
          </div>
        )}
        {needs.email && (
          <div>
            <label className={LABEL}>Email</label>
            <input value={fields.email} onChange={(e) => set.email(e.target.value)} placeholder="you@example.com" className={fieldCls} />
          </div>
        )}
      </div>
    </div>
  );
}
