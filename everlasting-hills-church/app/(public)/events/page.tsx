import EventPage from "@/components/home/events/Eventpage";

export const metadata = {
  title: "Events — Everlasting Hills Church",
  description: "Browse upcoming and past events at Everlasting Hills Church, Ibadan.",
};

export const revalidate = 300;

export default function Page() {
  return <EventPage />;
}
