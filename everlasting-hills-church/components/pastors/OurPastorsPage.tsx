import { SETMAN_FALLBACK, type SetmanContent } from "@/lib/site-settings";
import { getStructuredContent } from "@/lib/cms-page";
import PastorsCallToAction from "./PastorsCallToAction";
import PastorProfiles from "./PastorProfiles";
import PastorsHero from "./PastorsHero";
import PastoralValues from "./PastoralValues";
import { PASTORS, type Pastor } from "./pastor-content";

interface HomeContent {
  setman: SetmanContent;
}

function isValidHomeContent(content: unknown): content is HomeContent {
  const setman = (content as { setman?: SetmanContent } | null)?.setman;
  return Boolean(setman && typeof setman.name === "string");
}

export default async function OurPastorsPage() {
  const home = await getStructuredContent<HomeContent>("home", {
    fallback: { setman: SETMAN_FALLBACK },
    valid: isValidHomeContent,
  });
  const pastors: Pastor[] = PASTORS.map((pastor, index) =>
    index === 0
      ? { ...pastor, name: home.setman.name || pastor.name, photo: home.setman.photo || pastor.photo }
      : pastor,
  );

  return (
    <main className="bg-white">
      <PastorsHero pastors={pastors} />
      <PastorProfiles pastors={pastors} />
      <PastoralValues />
      <PastorsCallToAction />
    </main>
  );
}
