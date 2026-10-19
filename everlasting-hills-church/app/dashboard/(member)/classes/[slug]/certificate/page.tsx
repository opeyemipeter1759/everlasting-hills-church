import CertificateClient from "@/components/classes/CertificateClient";

export const metadata = { title: "Certificate | Dashboard" };

export default function CertificatePage({ params }: { params: { slug: string } }) {
  return <CertificateClient slug={params.slug} />;
}
