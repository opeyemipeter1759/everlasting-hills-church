import OverviewYear from "@/components/dashboard/follow-up/v2/overview/OverviewYear";

export const metadata = { title: "Follow-up overview" };

/** The year at a glance for first-timers. The data is gated by the API (the follow-up team and the first-timer contact). */
export default function FollowUpOverviewPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-5 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold text-[#111] dark:text-white">Overview</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-white/60">Who came each month, and where they are now.</p>
      </header>
      <OverviewYear />
    </div>
  );
}
