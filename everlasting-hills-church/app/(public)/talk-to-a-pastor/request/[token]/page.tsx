import VisitorRequestStatus from "@/components/one-on-one-public/VisitorRequestStatus";

export const metadata = {
  title: "Your request | Everlasting Hills Church",
  // A private link: keep it out of search engines.
  robots: { index: false, follow: false },
};

export default function VisitorRequestPage({ params }: { params: { token: string } }) {
  return (
    <main className="min-h-[70vh] bg-[#FBF7F8] px-5 pb-16 pt-28 dark:bg-[#130A0D] sm:px-8 sm:pt-36">
      <VisitorRequestStatus token={decodeURIComponent(params.token)} />
    </main>
  );
}
