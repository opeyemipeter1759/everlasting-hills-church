import Link from "next/link";
import LegalLayout from "@/components/marketing/LegalLayout";
import { getSiteConfig } from "@/lib/site-config";

export const metadata = {
  title: "Google Calendar Connection — Everlasting Hills Church",
  description:
    "What the Everlasting Hills Church Google Calendar connection does, what it can access, and how to disconnect it.",
};

/**
 * Public explainer for the optional Google Calendar connection. This is the
 * page Google's OAuth reviewers are pointed to: it states the app's purpose,
 * why each scope is needed, and links the privacy policy and terms. Kept in
 * code rather than the CMS for the same reason as GoogleDataPolicy.
 */
export default async function GoogleCalendarPage() {
  const site = await getSiteConfig();

  return (
    <LegalLayout eyebrow="Integrations" title="Google Calendar" accent="Connection" updated="23 September 2026">
      <section>
        <h2>What it does</h2>
        <p>
          Everlasting Hills Church runs this website for its members: service check-in, events, sermons, giving and
          pastoral care. Signed-in members can choose to connect their Google Calendar so that church life and their own
          plans sit in one place. Connecting is optional, and the rest of the website works the same without it.
        </p>
        <p>Once a member connects, the website does two things:</p>
        <ul>
          <li>
            <strong>Adds church events to their calendar.</strong> It creates a separate calendar named &ldquo;Everlasting
            Hills Church&rdquo; in the member&rsquo;s Google account and keeps Sunday and midweek services, church events and
            gatherings in it up to date, so reminders arrive on their phone automatically.
          </li>
          <li>
            <strong>Shows their own upcoming events on their dashboard.</strong> The member&rsquo;s upcoming events are shown
            next to church events on their personal dashboard, so they can see clashes before committing to serve or
            attend. Only the member can see them.
          </li>
        </ul>
      </section>

      <section>
        <h2>Permissions we ask for, and why</h2>
        <ul>
          <li>
            <strong>See, edit, share and permanently delete all the calendars you can access using Google Calendar</strong>{" "}
            (<code>https://www.googleapis.com/auth/calendar</code>). This is needed to create the separate &ldquo;Everlasting
            Hills Church&rdquo; calendar, which narrower event-only permissions cannot do, to keep church events in it up to date,
            and to read upcoming events from the member&rsquo;s primary calendar for their dashboard. We only change events
            inside the calendar we created, and never edit or delete events the member made.
          </li>
          <li>
            <strong>See your primary Google Account email address</strong> (
            <code>https://www.googleapis.com/auth/userinfo.email</code>). This lets us show the member which Google account
            is connected.
          </li>
        </ul>
      </section>

      <section>
        <h2>How to connect or disconnect</h2>
        <ul>
          <li>Sign in, open <strong>Calendar</strong> in your dashboard, and choose <strong>Connect Google Calendar</strong>. Google will ask you to approve access.</li>
          <li>
            To disconnect, choose <strong>Disconnect</strong> on the same card. We revoke our access with Google and delete
            the tokens and sync records we hold. The &ldquo;Everlasting Hills Church&rdquo; calendar stays in your Google account
            for you to keep or delete.
          </li>
          <li>
            You can also remove access at any time from{" "}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-[#87102C] hover:underline">
              your Google Account permissions
            </a>
            .
          </li>
        </ul>
      </section>

      <section>
        <h2>Your data</h2>
        <p>
          How we handle Google user data, including storage, sharing, deletion and our Limited Use commitment, is set out
          in our{" "}
          <Link href="/privacy#google-user-data" className="text-[#87102C] hover:underline">
            Privacy Policy
          </Link>
          . Use of the website is covered by our{" "}
          <Link href="/terms" className="text-[#87102C] hover:underline">
            Terms of Service
          </Link>
          .
        </p>
        <p>
          Questions? Email{" "}
          <a href={`mailto:${site.contactEmail}`} className="text-[#87102C] hover:underline">
            {site.contactEmail}
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  );
}
