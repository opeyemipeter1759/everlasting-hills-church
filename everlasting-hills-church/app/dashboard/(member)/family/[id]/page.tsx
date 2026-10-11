import FamilyProfile from "@/components/dashboard/member/family/FamilyProfile";

export const metadata = { title: "Member Profile — Dashboard" };

export default function FamilyMemberPage({ params }: { params: { id: string } }) {
  return <FamilyProfile id={params.id} />;
}
