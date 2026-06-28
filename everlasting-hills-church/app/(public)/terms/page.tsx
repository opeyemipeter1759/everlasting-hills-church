import LegalLayout from "@/components/marketing/LegalLayout";
import { CHURCH } from "@/config/config";

export const metadata = {
  title: "Terms of Service — Everlasting Hills Church",
  description:
    "The terms that govern your use of the Everlasting Hills Church website and online services.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Terms of"
      accent="Service"
      updated="18 June 2026"
    >
      <p>
        Welcome to the {CHURCH.name} website. By using this site and our online
        services, you agree to the terms below. Please read them carefully.
      </p>

      <section>
        <h2>Use of the site</h2>
        <p>
          You agree to use this website lawfully and respectfully, and not to
          misuse, disrupt, or attempt to gain unauthorised access to any part of
          it or its underlying systems.
        </p>
      </section>

      <section>
        <h2>Accounts</h2>
        <ul>
          <li>You are responsible for keeping your login details secure.</li>
          <li>You agree to provide accurate information when you register.</li>
          <li>We may suspend accounts that breach these terms or are misused.</li>
        </ul>
      </section>

      <section>
        <h2>Submissions and content</h2>
        <p>
          Prayer requests, testimonies, and other content you submit may be read
          by our pastoral team. Do not submit unlawful, harmful, or content you
          do not have the right to share.
        </p>
      </section>

      <section>
        <h2>Giving</h2>
        <p>
          Online giving is processed securely through our payment partner. Gifts
          are voluntary and, unless stated otherwise, non-refundable. Receipts
          are issued for your records.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update these terms from time to time. Continued use of the site
          after changes means you accept the updated terms.
        </p>
      </section>

      <section>
        <h2>Contact us</h2>
        <p>
          Questions about these terms? Email us at{" "}
          <a className="text-[#87102C] hover:underline" href={`mailto:${CHURCH.email}`}>
            {CHURCH.email}
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  );
}
