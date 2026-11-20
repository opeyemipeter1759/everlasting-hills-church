import { getBackendBaseUrl } from "@/lib/api/backend-url";

/** What the public page may show: approved policy values only, the privacy notice, and the active curriculum. */
export interface PremaritalPageData {
  policy: {
    eligibility: string | null;
    duration: string | null;
    fees: string | null;
    counsellors: string | null;
    retention: string | null;
    privacyNotice: string;
  };
  modules: { id: string; title: string; description: string | null; scriptureRefs: string[]; objectives: string[]; approvalState: "PROPOSED" | "APPROVED" }[];
}

/** Used when the API cannot be reached: nothing invented, just the privacy wording the form needs. */
export const PAGE_FALLBACK: PremaritalPageData = {
  policy: {
    eligibility: null,
    duration: null,
    fees: null,
    counsellors: null,
    retention: null,
    privacyNotice:
      "Only the pastors, the marriage ministry team and the counsellor assigned to you can see your application. You can ask to see, correct or delete your information at any time by contacting the church office. We handle your information in line with the Nigeria Data Protection Act 2023.",
  },
  modules: [],
};

/** Server only. Refreshed every five minutes. */
export async function getPremaritalPage(): Promise<PremaritalPageData> {
  try {
    const res = await fetch(`${getBackendBaseUrl()}/public/premarital/page`, { next: { revalidate: 300, tags: ["premarital:page"] } });
    if (!res.ok) return PAGE_FALLBACK;
    const body = (await res.json()) as { data?: PremaritalPageData };
    return body.data?.policy ? body.data : PAGE_FALLBACK;
  } catch {
    return PAGE_FALLBACK;
  }
}
