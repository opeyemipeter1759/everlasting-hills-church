import MemberDetailClient from "@/components/dashboard/admin/people/MemberDetailClient";

export const metadata = { title: "Member — Dashboard" };

export default function MemberDetailPage({ params }: { params: { id: string } }) {
  return <MemberDetailClient id={params.id} />;
}
