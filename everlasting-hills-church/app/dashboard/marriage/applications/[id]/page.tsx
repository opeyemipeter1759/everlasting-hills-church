import CaseClient from "@/components/dashboard/marriage/case/CaseClient";

export const metadata = { title: "Pre-marital case · Dashboard" };

export default function MarriageCasePage({ params }: { params: { id: string } }) {
  return <CaseClient id={params.id} />;
}
