import PastorProfileCard from "./PastorProfileCard";
import type { Pastor } from "./pastor-content";

export default function PastorProfiles({ pastors }: { pastors: Pastor[] }) {
  return (
    <section className="bg-white">
      {pastors.map((pastor, index) => (
        <PastorProfileCard key={pastor.id} pastor={pastor} index={index} />
      ))}
    </section>
  );
}
