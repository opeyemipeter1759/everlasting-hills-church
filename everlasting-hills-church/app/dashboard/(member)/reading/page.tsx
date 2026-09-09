import ReadingScreen from "@/components/dashboard/member/reading-plan/ReadingScreen";

export const metadata = { title: "Today's reading — Dashboard" };

/**
 * Client rendered throughout: what to show depends on the member's own
 * subscription and their local date, neither of which the server can decide
 * from a cached page.
 */
export default function ReadingPage() {
  return <ReadingScreen />;
}
