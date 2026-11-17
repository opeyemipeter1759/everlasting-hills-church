import OpeningTemplateEditor from "@/components/dashboard/first-timers/OpeningTemplateEditor";

export const metadata = { title: "Opening message" };

/** Edit the opening message, preview it for a real first-timer, and bring back an old version. */
export default function OpeningMessagePage() {
  return <OpeningTemplateEditor />;
}
