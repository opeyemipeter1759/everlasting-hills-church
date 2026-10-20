import ApplyClient from "@/components/classes/ApplyClient";

export const metadata = { title: "Apply | Dashboard" };

export default function ApplyPage({ params }: { params: { slug: string } }) {
  return <ApplyClient slug={params.slug} />;
}
