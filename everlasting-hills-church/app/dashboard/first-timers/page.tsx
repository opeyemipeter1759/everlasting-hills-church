import FirstTimerWorkspace from "@/components/dashboard/first-timers/FirstTimerWorkspace";

export const metadata = { title: "Welcome queue" };

/** The first-timer contact's workspace: the not-yet-contacted queue. */
export default function FirstTimersPage() {
  return <FirstTimerWorkspace />;
}
