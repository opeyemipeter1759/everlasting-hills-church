import NotificationSettingsClient from "@/components/dashboard/settings/NotificationSettingsClient";

export const metadata = { title: "Notifications — Dashboard" };

/**
 * Client-rendered throughout: every decision on this screen depends on browser
 * state the server cannot see (Notification.permission, whether this device has
 * a push subscription, whether iOS is running the installed app).
 */
export default function NotificationSettingsPage() {
  return <NotificationSettingsClient />;
}
