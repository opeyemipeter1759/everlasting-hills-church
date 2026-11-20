import CoupleDashboard from "@/components/pre-marital/couple/CoupleDashboard";

export const metadata = { title: "Pre-marital counselling · Dashboard" };

/** A member's own pre-marital application, inside their usual dashboard. */
export default function MemberPreMaritalPage() {
  return (
    <div className="w-full max-w-5xl">
      <CoupleDashboard />
    </div>
  );
}
