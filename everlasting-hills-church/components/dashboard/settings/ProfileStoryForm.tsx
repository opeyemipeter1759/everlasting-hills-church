"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Eye, EyeOff, Loader2, Plus, X } from "lucide-react";
import {
  useMyProfileDetails,
  useUpdateProfileDetails,
  type ProfileDetails,
  type Visibility,
  type VisibilityKey,
} from "@/lib/api/family";

const input =
  "w-full rounded-xl border border-[#E7CDD3]/60 bg-white px-4 py-3 text-sm text-[#111] focus:border-[#87102C] focus:outline-none focus:ring-2 focus:ring-[#87102C]/15 dark:border-white/[0.10] dark:bg-white/[0.06] dark:text-white";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5A4A4D] dark:text-white/55";

const GIFT_SUGGESTIONS = ["Teaching", "Intercession", "Music", "Hospitality", "Evangelism", "Counselling", "Children's ministry", "Media", "Administration", "Ushering"];
const LANGUAGE_SUGGESTIONS = ["English", "Yoruba", "Igbo", "Hausa", "French", "Pidgin"];

type Draft = Omit<ProfileDetails, "coverUrl">;

/** Type and press Enter (or a comma) to add; tap a suggestion; × to remove. */
function TagInput({
  id,
  value,
  onChange,
  suggestions = [],
  placeholder,
}: {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const add = (raw: string) => {
    const item = raw.trim().replace(/,$/, "").slice(0, 40);
    if (!item || value.some((v) => v.toLowerCase() === item.toLowerCase())) return setText("");
    onChange([...value, item]);
    setText("");
  };
  const remaining = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));
  return (
    <div>
      <div className={`${input} flex flex-wrap items-center gap-1.5 py-2`}>
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-[#FFE8ED] py-1 pl-3 pr-1 text-xs font-semibold text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]">
            {v}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} aria-label={`Remove ${v}`} className="rounded-full p-0.5 hover:bg-white/60">
              <X size={12} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={text}
          onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setText(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(text);
            } else if (e.key === "Backspace" && !text && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => text && add(text)}
          placeholder={value.length ? "" : placeholder}
          className="min-w-[8rem] flex-1 bg-transparent py-1 text-sm focus:outline-none"
        />
      </div>
      {remaining.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {remaining.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="min-h-8 rounded-full border border-dashed border-[#E7CDD3] px-2.5 text-xs text-[#5A4A4D] hover:border-[#87102C] hover:text-[#87102C] dark:border-white/15 dark:text-white/60"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** "Church family" or "Only me" for one part of the profile. */
function Who({ value, onChange, name }: { value: "MEMBERS" | "PRIVATE"; onChange: (v: "MEMBERS" | "PRIVATE") => void; name: string }) {
  const open = value === "MEMBERS";
  return (
    <button
      type="button"
      onClick={() => onChange(open ? "PRIVATE" : "MEMBERS")}
      aria-label={`${name}: ${open ? "seen by the church family" : "only me"}. Change`}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors ${
        open ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60"
      }`}
    >
      {open ? <Eye size={13} aria-hidden="true" /> : <EyeOff size={13} aria-hidden="true" />}
      {open ? "Church family" : "Only me"}
    </button>
  );
}

function Block({ title, hint, who, children }: { title: string; hint?: string; who?: React.ReactNode; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3 border-t border-[#E7CDD3]/40 pt-6 first:border-0 first:pt-0 dark:border-white/[0.07]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <legend className="text-[15px] font-bold text-[#111] dark:text-white">{title}</legend>
          {hint && <p className="mt-0.5 text-xs text-[#8a7e80] dark:text-white/45">{hint}</p>}
        </div>
        {who}
      </div>
      {children}
    </fieldset>
  );
}

const yearOptions = () => {
  const now = new Date().getFullYear();
  return Array.from({ length: now - 1929 }, (_, i) => now - i);
};

function YearSelect({ id, value, onChange }: { id: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} className={input}>
      <option value="">Not shared</option>
      {yearOptions().map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}

/**
 * The LinkedIn-style part of the profile, written by the member: headline,
 * favourite scripture, spiritual journey, career, gifts, interests, languages,
 * prayer focus, testimony, and who sees each part.
 */
export default function ProfileStoryForm({ memberId }: { memberId?: string | null }) {
  const { data, isLoading } = useMyProfileDetails();
  const save = useUpdateProfileDetails();
  const [d, setD] = useState<Draft | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data && !d) {
      const { coverUrl: _cover, ...rest } = data;
      // An older server sends no roles; treat that as none rather than failing.
      setD({ ...rest, roles: rest.roles ?? [] });
    }
  }, [data, d]);

  if (isLoading || !d) {
    return <div id="spiritual-career" className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />;
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setD((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  };
  const vis = (key: VisibilityKey) => d.visibility[key];
  const setVis = (key: VisibilityKey, value: "MEMBERS" | "PRIVATE") => set("visibility", { ...d.visibility, [key]: value } as Visibility);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!d) return;
    setError(null);
    try {
      // Rows left without a role title are dropped rather than saved blank.
      await save.mutateAsync({ ...d, roles: d.roles.filter((r) => r.title.trim()) });
      setSaved(true);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Could not save. Please try again.");
    }
  }

  return (
    <form
      id="spiritual-career"
      onSubmit={submit}
      className="scroll-mt-24 rounded-2xl border border-[#E7CDD3]/60 bg-white dark:border-white/[0.09] dark:bg-white/[0.05]"
    >
      <div className="border-b border-[#E7CDD3]/40 px-6 pb-5 pt-7 dark:border-white/[0.07] sm:px-8">
        <h2 className="text-lg font-bold text-[#111] dark:text-white">Spiritual &amp; career profile</h2>
        <p className="mt-1 text-xs text-[#8a7e80] dark:text-white/45">
          Your profile in your own words, like LinkedIn for the church family. Choose who sees each part.{" "}
          {memberId && (
            <Link href={`/dashboard/family/${memberId}`} className="font-semibold text-[#87102C] underline dark:text-[#FFB3C1]">
              See your profile
            </Link>
          )}
        </p>
      </div>

      <div className="space-y-6 px-6 py-6 sm:px-8">
        <Block
          title="Who can see your profile"
          hint="Pastors and admins always can. With Only me, other members see just your name, photo, banner and headline."
          who={<Who name="Profile" value={vis("profile")} onChange={(v) => setVis("profile", v)} />}
        >
          <span className="sr-only">Profile visibility</span>
        </Block>

        <Block title="Headline" hint="One line under your name.">
          <label htmlFor="pd-headline" className="sr-only">
            Headline
          </label>
          <input id="pd-headline" className={input} maxLength={120} value={d.headline ?? ""} onChange={(e) => set("headline", e.target.value)} placeholder="Civil engineer · Choir member · Lover of the Psalms" />
        </Block>

        <Block
          title="What you do"
          hint="Shown under your name, like CEO @sparkpayhq · Lead Pastor @everlastinghills. Add a link to make the @ clickable."
        >
          <ul className="space-y-3">
            {d.roles.map((role, i) => {
              const update = (patch: Partial<typeof role>) => set("roles", d.roles.map((r, j) => (j === i ? { ...r, ...patch } : r)));
              return (
                <li key={i} className="grid grid-cols-1 gap-2 rounded-xl bg-[#FFF8F9] p-3 dark:bg-white/[0.04] sm:grid-cols-[1fr_1fr_auto]">
                  <div>
                    <label htmlFor={`pd-role-title-${i}`} className={label}>
                      Role
                    </label>
                    <input id={`pd-role-title-${i}`} className={input} maxLength={60} value={role.title} onChange={(e) => update({ title: e.target.value })} placeholder="CEO" />
                  </div>
                  <div>
                    <label htmlFor={`pd-role-org-${i}`} className={label}>
                      @ Where
                    </label>
                    <input
                      id={`pd-role-org-${i}`}
                      className={input}
                      maxLength={61}
                      value={role.org ? `@${role.org}` : ""}
                      onChange={(e) => update({ org: e.target.value.replace(/^@+/, "") || null })}
                      placeholder="@sparkpayhq"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => set("roles", d.roles.filter((_, j) => j !== i))}
                    aria-label={`Remove ${role.title || "this role"}`}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center self-end rounded-xl text-[#8a7e80] hover:bg-white hover:text-red-600 dark:text-white/50"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                  <div className="sm:col-span-2">
                    <label htmlFor={`pd-role-url-${i}`} className={label}>
                      Link (optional)
                    </label>
                    <input
                      id={`pd-role-url-${i}`}
                      className={input}
                      maxLength={200}
                      value={role.url ?? ""}
                      onChange={(e) => update({ url: e.target.value || null })}
                      placeholder="sparkpay.co"
                      inputMode="url"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          {d.roles.length < 8 && (
            <button
              type="button"
              onClick={() => set("roles", [...d.roles, { title: "", org: null, url: null }])}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-dashed border-[#E7CDD3] px-4 text-sm font-semibold text-[#87102C] hover:border-[#87102C] dark:border-white/15 dark:text-[#FFB3C1]"
            >
              <Plus size={15} aria-hidden="true" /> Add a role
            </button>
          )}
        </Block>

        <Block title="Favourite scripture" hint="Shown as a banner quote on your profile.">
          <label htmlFor="pd-verse" className={label}>
            The verse
          </label>
          <textarea id="pd-verse" rows={2} maxLength={400} className={`${input} resize-none`} value={d.favouriteVerse ?? ""} onChange={(e) => set("favouriteVerse", e.target.value)} placeholder="The Lord is my shepherd; I shall not want." />
          <label htmlFor="pd-verse-ref" className={label}>
            Where it is
          </label>
          <input id="pd-verse-ref" className={input} maxLength={60} value={d.favouriteVerseRef ?? ""} onChange={(e) => set("favouriteVerseRef", e.target.value)} placeholder="Psalm 23:1" />
        </Block>

        <Block
          title="Spiritual journey"
          hint="The years of your milestones, shown as a timeline."
          who={<Who name="Spiritual journey" value={vis("journey")} onChange={(v) => setVis("journey", v)} />}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(
              [
                ["bornAgainYear", "Born again"],
                ["waterBaptismYear", "Baptised in water"],
                ["holySpiritYear", "Baptised in the Holy Spirit"],
                ["membershipClassYear", "Finished the membership class"],
              ] as const
            ).map(([key, text]) => (
              <div key={key}>
                <label htmlFor={`pd-${key}`} className={label}>
                  {text}
                </label>
                <YearSelect id={`pd-${key}`} value={d[key]} onChange={(v) => set(key, v)} />
              </div>
            ))}
          </div>
        </Block>

        <Block title="Career" who={<Who name="Career" value={vis("career")} onChange={(v) => setVis("career", v)} />}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pd-occupation" className={label}>
                Occupation
              </label>
              <input id="pd-occupation" className={input} maxLength={80} value={d.occupation ?? ""} onChange={(e) => set("occupation", e.target.value)} placeholder="Civil engineer" />
            </div>
            <div>
              <label htmlFor="pd-industry" className={label}>
                Industry
              </label>
              <input id="pd-industry" className={input} maxLength={80} value={d.industry ?? ""} onChange={(e) => set("industry", e.target.value)} placeholder="Construction" />
            </div>
          </div>
          <label htmlFor="pd-employer" className={label}>
            Employer or business (optional)
          </label>
          <input id="pd-employer" className={input} maxLength={80} value={d.employer ?? ""} onChange={(e) => set("employer", e.target.value)} />
          <label htmlFor="pd-skills" className={label}>
            Skills
          </label>
          <TagInput id="pd-skills" value={d.skills} onChange={(v) => set("skills", v)} placeholder="Type a skill and press Enter" />
        </Block>

        <Block title="Spiritual gifts and ministry interests">
          <label htmlFor="pd-gifts" className="sr-only">
            Spiritual gifts and ministry interests
          </label>
          <TagInput id="pd-gifts" value={d.gifts} onChange={(v) => set("gifts", v)} suggestions={GIFT_SUGGESTIONS} placeholder="Teaching, intercession, music…" />
        </Block>

        <Block title="Interests and languages" hint="Common ground with others, and a welcome for newer members.">
          <label htmlFor="pd-interests" className={label}>
            Interests
          </label>
          <TagInput id="pd-interests" value={d.interests} onChange={(v) => set("interests", v)} placeholder="Football, cooking, photography…" />
          <label htmlFor="pd-languages" className={label}>
            Languages
          </label>
          <TagInput id="pd-languages" value={d.languages} onChange={(v) => set("languages", v)} suggestions={LANGUAGE_SUGGESTIONS} placeholder="Languages you speak" />
        </Block>

        <Block title="Prayer focus" hint="Optional. One line others can pray along with.">
          <label htmlFor="pd-prayer" className="sr-only">
            Prayer focus
          </label>
          <input id="pd-prayer" className={input} maxLength={200} value={d.prayerFocus ?? ""} onChange={(e) => set("prayerFocus", e.target.value)} placeholder="Wisdom for my new role at work" />
        </Block>

        <Block title="Testimony or faith story" hint="Optional. What God has done for you." who={<Who name="Testimony" value={vis("testimony")} onChange={(v) => setVis("testimony", v)} />}>
          <label htmlFor="pd-testimony" className="sr-only">
            Testimony
          </label>
          <textarea id="pd-testimony" rows={6} maxLength={3000} className={`${input} resize-y`} value={d.testimony ?? ""} onChange={(e) => set("testimony", e.target.value)} />
          <p className="text-right text-xs text-[#8a7e80] dark:text-white/40">{(d.testimony ?? "").length}/3000</p>
        </Block>

        <Block title="Connecting with you" hint="Your contact details stay private unless you choose to share your phone number.">
          <div className="space-y-2">
            {(
              [
                ["phone", "My phone number"],
                ["birthday", "My birthday"],
                ["socials", "My social media links"],
              ] as const
            ).map(([key, text]) => (
              <div key={key} className="flex items-center justify-between gap-3 rounded-xl bg-[#FFF8F9] px-4 py-2.5 dark:bg-white/[0.04]">
                <span className="text-sm font-semibold text-[#111] dark:text-white">{text}</span>
                <Who name={text} value={vis(key)} onChange={(v) => setVis(key, v)} />
              </div>
            ))}
          </div>
        </Block>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 px-6 pb-7 sm:px-8">
        {saved && (
          <span role="status" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <Check size={15} aria-hidden="true" /> Saved
          </span>
        )}
        {error && (
          <span role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </span>
        )}
        <button
          type="submit"
          disabled={save.isPending}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#87102C] px-6 text-sm font-semibold text-white hover:bg-[#6E0C24] disabled:opacity-60"
        >
          {save.isPending && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
          Save profile
        </button>
      </div>
    </form>
  );
}
