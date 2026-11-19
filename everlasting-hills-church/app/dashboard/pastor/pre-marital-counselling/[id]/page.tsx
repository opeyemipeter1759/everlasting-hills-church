import ApplicationDetail from "@/components/dashboard/pastor/pre-marital/ApplicationDetail";

export const metadata = { title: "Pre-Marital Counselling application · Dashboard" };

export default function PreMaritalApplicationPage({ params }: { params: { id: string } }) {
  return <ApplicationDetail id={params.id} />;
}
