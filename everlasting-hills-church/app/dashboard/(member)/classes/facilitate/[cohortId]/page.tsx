import RosterClient from "@/components/classes/RosterClient";

export const metadata = { title: "Cohort | Dashboard" };

export default function FacilitatePage({ params }: { params: { cohortId: string } }) {
  return <RosterClient cohortId={params.cohortId} />;
}
