import TalkHero from "@/components/one-on-one-public/TalkHero";
import VisitorFlow from "@/components/one-on-one-public/VisitorFlow";

export const metadata = {
  title: "Talk to a Pastor | Everlasting Hills Church",
  description:
    "Request a private one-on-one session with Pastor Opeyemi or Pastor Faith, by video call or phone, wherever you are. For counsel, prayer and conversation.",
};

export default function TalkToAPastorPage() {
  return (
    <main className="bg-[#FBF7F8] dark:bg-[#130A0D]">
      <TalkHero
        heading="You don’t have to carry it alone."
        lead="If a message has stirred something in you and you’d like to talk it through, request a private session with one of our pastors, by video call or phone, wherever you are."
      />
      <div className="mx-auto max-w-[1100px] px-5 py-12 sm:px-8 sm:py-16">
        <VisitorFlow />
      </div>
    </main>
  );
}
