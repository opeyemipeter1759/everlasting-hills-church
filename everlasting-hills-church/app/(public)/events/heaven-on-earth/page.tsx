import type { Metadata } from "next";
import HeroExperience from "@/components/events/heaven-on-earth/HeroExperience";
import InvitationLetter from "@/components/events/heaven-on-earth/InvitationLetter";
import FlyerShowcase from "@/components/events/heaven-on-earth/FlyerShowcase";
import EventDetailsBento from "@/components/events/heaven-on-earth/EventDetailsBento";
import WhatToExpect from "@/components/events/heaven-on-earth/WhatToExpect";
import ScriptureMoment from "@/components/events/heaven-on-earth/ScriptureMoment";
import CountdownTimer from "@/components/events/heaven-on-earth/CountdownTimer";
import RsvpForm from "@/components/events/heaven-on-earth/RsvpForm";
import FinalInvitation from "@/components/events/heaven-on-earth/FinalInvitation";
import { HEAVEN_ON_EARTH } from "@/components/events/heaven-on-earth/event-constants";

/**
 * "Heaven on Earth" event landing page.
 *
 * Routed at /events/heaven-on-earth inside the (public) group so it inherits the
 * public Navbar + PageFooter automatically. The page itself composes 9 named
 * sections in deliberate order:
 *
 *   1. HeroExperience       — atmospheric dark hero
 *   2. InvitationLetter     — light personal letter
 *   3. FlyerShowcase        — light section with the framed artwork
 *   4. EventDetailsBento    — light bento grid with the details
 *   5. WhatToExpect         — blush section with 4 elevated cards
 *   6. ScriptureMoment      — dark dramatic scripture
 *   7. CountdownTimer       — dark live countdown
 *   8. RsvpForm             — blush form section
 *   9. FinalInvitation      — dark closing CTA
 *
 * Light → dark → light cadence is intentional (design system: alternating sections).
 */

export const metadata: Metadata = {
  title: `${HEAVEN_ON_EARTH.title} — Everlasting Hills Church`,
  description: HEAVEN_ON_EARTH.tagline,
  openGraph: {
    title: `${HEAVEN_ON_EARTH.title} · ${HEAVEN_ON_EARTH.dateDisplay}`,
    description: HEAVEN_ON_EARTH.tagline,
    type: "website",
  },
};

export default function HeavenOnEarthPage() {
  return (
    <main className="bg-white">
      <HeroExperience />
      <InvitationLetter />
      <FlyerShowcase />
      <EventDetailsBento />
      <WhatToExpect />
      <ScriptureMoment />
      <CountdownTimer />
      <RsvpForm />
      <FinalInvitation />
    </main>
  );
}
