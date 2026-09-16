import PublicPledgeTracker from "@/components/pledge/PublicPledgeTracker";

export const metadata = {
  title: "Track Project Pledge — Everlasting Hills Church",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function TrackPledgePage({ params }: { params: { token: string } }) {
  return <PublicPledgeTracker token={params.token} />;
}
