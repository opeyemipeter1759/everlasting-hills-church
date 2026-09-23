import Link from "next/link";

/**
 * How the Google Calendar connection handles Google user data.
 *
 * Deliberately not CMS-editable: Google's OAuth verification checks the
 * privacy policy for exactly these disclosures (what is accessed, why, how it
 * is stored, shared and deleted, and the Limited Use statement), and a CMS
 * edit to the rest of the page must never be able to remove them. If the
 * integration changes what it reads or writes, update this text with it.
 */
export default function GoogleDataPolicy({ contactEmail }: { contactEmail: string }) {
  return (
    <section id="google-user-data" className="scroll-mt-24">
      <h2>Google user data (Google Calendar)</h2>
      <p>
        Members can choose to connect their Google Calendar from their dashboard. Connecting is optional, and nothing
        is read from or written to your Google account unless you connect it yourself. See{" "}
        <Link href="/google-calendar" className="text-[#87102C] hover:underline">
          how the Google Calendar connection works
        </Link>
        .
      </p>

      <h3 className="mb-2 mt-5 font-bold text-[#111]">What we access</h3>
      <ul>
        <li>
          <strong>Your Google account email address</strong> (userinfo.email scope), to show you which Google account
          is connected.
        </li>
        <li>
          <strong>Your Google Calendar</strong> (calendar scope). We use it to read the upcoming events on your primary
          calendar (title, start and end time, location and link) so you can see them next to church events on your
          dashboard. We also use it to create one separate calendar named &ldquo;Everlasting Hills Church&rdquo; in your account and
          keep church services, events and gatherings in it up to date.
        </li>
      </ul>

      <h3 className="mb-2 mt-5 font-bold text-[#111]">How we use it</h3>
      <ul>
        <li>Events from your own calendar are only displayed to you, on your dashboard. They are fetched when you view them and are not saved on our servers.</li>
        <li>We only ever add, change or remove events inside the &ldquo;Everlasting Hills Church&rdquo; calendar we created. We never edit or delete events you created yourself.</li>
        <li>We do not use Google user data for advertising, and we do not sell it.</li>
        <li>We do not use Google user data to develop, improve or train generalised artificial intelligence or machine learning models.</li>
      </ul>

      <h3 className="mb-2 mt-5 font-bold text-[#111]">How we store and protect it</h3>
      <ul>
        <li>We store the access and refresh tokens Google issues, encrypted with AES-256-GCM, along with your Google email address and a record of which church events we placed in your calendar.</li>
        <li>Data is sent only over encrypted (HTTPS) connections, and the tokens are only used by the systems that run the connection. They are never shown to anyone in the app, including church staff.</li>
      </ul>

      <h3 className="mb-2 mt-5 font-bold text-[#111]">Sharing</h3>
      <p>
        We do not share, transfer or disclose Google user data to anyone, except where required by law or to the hosting
        providers who run this website on our behalf, under their data-protection terms.
      </p>

      <h3 className="mb-2 mt-5 font-bold text-[#111]">Retention and deletion</h3>
      <ul>
        <li>
          You can disconnect Google Calendar at any time from your dashboard. When you do, we revoke our access with Google
          and delete the stored tokens, your Google email address and our record of synced events.
        </li>
        <li>
          The &ldquo;Everlasting Hills Church&rdquo; calendar belongs to you and stays in your Google account after you disconnect.
          You can delete it from Google Calendar whenever you like.
        </li>
        <li>
          You can also remove our access from your Google Account at{" "}
          <a className="text-[#87102C] hover:underline" href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">
            myaccount.google.com/permissions
          </a>
          , or ask us to delete your data by emailing{" "}
          <a className="text-[#87102C] hover:underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </li>
      </ul>

      <h3 className="mb-2 mt-5 font-bold text-[#111]">Limited Use</h3>
      <p>
        Everlasting Hills Church&rsquo;s use and transfer to any other app of information received from Google APIs will
        adhere to the{" "}
        <a
          className="text-[#87102C] hover:underline"
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements.
      </p>
    </section>
  );
}
