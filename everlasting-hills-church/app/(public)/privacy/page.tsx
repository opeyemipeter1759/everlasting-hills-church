import LegalLayout from "@/components/marketing/LegalLayout";
import { CHURCH } from "@/config/config";

export const metadata = {
  title: "Privacy Policy — Everlasting Hills Church",
  description:
    "How Everlasting Hills Church collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Privacy"
      accent="Policy"
      updated="18 June 2026"
    >
      <p>
        Everlasting Hills Church ({CHURCH.name}) values your trust. This policy
        explains what information we collect, why we collect it, and how we keep
        it safe.
      </p>

      <section>
        <h2>Information we collect</h2>
        <ul>
          <li>Contact details you provide through our forms (name, email, phone).</li>
          <li>Membership and attendance records when you join or check in.</li>
          <li>Prayer requests, testimonies, and messages you choose to share.</li>
          <li>Basic technical data such as device and browser information.</li>
        </ul>
      </section>

      <section>
        <h2>How we use your information</h2>
        <ul>
          <li>To welcome, follow up with, and care for you as part of the church family.</li>
          <li>To send service updates, event details, and communications you opt into.</li>
          <li>To improve our website, services, and pastoral care.</li>
        </ul>
      </section>

      <section>
        <h2>How we protect it</h2>
        <p>
          We apply reasonable technical and organisational measures to guard
          your information. Access is limited to authorised leaders and staff
          who need it to serve you.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You may request access to, correction of, or deletion of your personal
          data at any time. You can also opt out of non-essential communications.
        </p>
      </section>

      <section>
        <h2>Contact us</h2>
        <p>
          For any privacy question or request, email us at{" "}
          <a className="text-[#87102C] hover:underline" href={`mailto:${CHURCH.email}`}>
            {CHURCH.email}
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  );
}
