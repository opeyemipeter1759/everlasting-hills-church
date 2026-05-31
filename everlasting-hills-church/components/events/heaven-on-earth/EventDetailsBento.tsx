import { Calendar, Clock, Info, Mail, MapPin, Mic2, Phone, User, UserCheck } from "lucide-react";
import ScrollReveal from "@/components/home/ScrollReveal";
import { HEAVEN_ON_EARTH } from "./event-constants";

/**
 * Event details — Bento Grid with Anchor Info Chip pattern. The Date card is
 * the inverted (burgundy on white) variant so it acts as the visual anchor.
 *
 * Light section (white bg) with subtle blush accents. Order of cards is tuned
 * for visual rhythm: date (inverted, large) + time → venue + host pastor →
 * guest minister + contact → registration + special notes.
 */
export default function EventDetailsBento() {
  return (
    <section id="details" className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <ScrollReveal>
          <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold mb-3">
            Event Details
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] leading-[1.1] tracking-tight text-balance max-w-2xl">
            Everything you need{" "}
            <span className="text-[#87102C] font-serif italic">to be there</span>.
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="mt-4 text-[#555] text-base sm:text-lg leading-relaxed max-w-2xl">
            Save the details, share the invitation, and bring someone with you.
          </p>
        </ScrollReveal>

        {/* Bento grid — 6 columns on desktop, mixed spans for rhythm */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
          {/* Date — inverted, spans 2 cols, two rows tall on lg */}
          <ScrollReveal delay={0.25} className="lg:col-span-3 lg:row-span-2">
            <InvertedAnchorCard
              icon={<Calendar size={20} />}
              eyebrow="Save the date"
              primary={HEAVEN_ON_EARTH.dateDisplay}
              secondary="One night. Set apart. Don't miss it."
              size="large"
            />
          </ScrollReveal>

          {/* Time */}
          <ScrollReveal delay={0.3} className="lg:col-span-3">
            <AnchorChip
              icon={<Clock size={16} />}
              eyebrow="Time"
              primary={HEAVEN_ON_EARTH.timeDisplay}
              secondary="Doors open 30 minutes prior"
            />
          </ScrollReveal>

          {/* Venue */}
          <ScrollReveal delay={0.35} className="lg:col-span-3">
            <AnchorChip
              icon={<MapPin size={16} />}
              eyebrow="Venue"
              primary={HEAVEN_ON_EARTH.venue.name}
              secondary={HEAVEN_ON_EARTH.venue.address}
            />
          </ScrollReveal>

          {/* Host Pastor */}
          <ScrollReveal delay={0.4} className="lg:col-span-2">
            <AnchorChip
              icon={<User size={16} />}
              eyebrow="Host Pastor"
              primary={HEAVEN_ON_EARTH.hostPastor}
            />
          </ScrollReveal>

          {/* Guest Minister */}
          <ScrollReveal delay={0.45} className="lg:col-span-2">
            <AnchorChip
              icon={<Mic2 size={16} />}
              eyebrow="Guest Minister"
              primary={HEAVEN_ON_EARTH.guestMinister}
            />
          </ScrollReveal>

          {/* Registration */}
          <ScrollReveal delay={0.5} className="lg:col-span-2">
            <AnchorChip
              icon={<UserCheck size={16} />}
              eyebrow="Registration"
              primary="Free of charge"
              secondary="RSVP below to reserve your seat"
            />
          </ScrollReveal>

          {/* Contact (phone) */}
          <ScrollReveal delay={0.55} className="lg:col-span-2">
            <LinkAnchorChip
              href={`tel:${HEAVEN_ON_EARTH.contact.phone.replace(/\s/g, "")}`}
              icon={<Phone size={16} />}
              eyebrow="Phone"
              primary={HEAVEN_ON_EARTH.contact.phone}
            />
          </ScrollReveal>

          {/* Contact (email) */}
          <ScrollReveal delay={0.6} className="lg:col-span-2">
            <LinkAnchorChip
              href={`mailto:${HEAVEN_ON_EARTH.contact.email}`}
              icon={<Mail size={16} />}
              eyebrow="Email"
              primary={HEAVEN_ON_EARTH.contact.email}
            />
          </ScrollReveal>

          {/* Special notes — full width */}
          <ScrollReveal delay={0.65} className="lg:col-span-2">
            <div className="h-full rounded-2xl bg-[#FFF4F6] border border-[#E7CDD3]/60 p-6 hover:border-[#E7CDD3] hover:shadow-[0_8px_40px_rgba(135,16,44,0.06)] transition-all duration-300">
              <div className="flex items-start gap-3 mb-3">
                <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#FFE8ED] text-[#87102C] flex items-center justify-center">
                  <Info size={16} />
                </span>
                <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#888] pt-2.5">
                  Good to know
                </p>
              </div>
              <ul className="space-y-2">
                {HEAVEN_ON_EARTH.specialNotes.map((note, i) => (
                  <li
                    key={i}
                    className="text-sm text-[#444] leading-snug flex items-start gap-2"
                  >
                    <span
                      className="flex-shrink-0 w-1 h-1 rounded-full bg-[#87102C] mt-2"
                      aria-hidden="true"
                    />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// ── Card variants ──────────────────────────────────────────────────────────

interface ChipProps {
  icon: React.ReactNode;
  eyebrow: string;
  primary: string;
  secondary?: string;
}

function AnchorChip({ icon, eyebrow, primary, secondary }: ChipProps) {
  return (
    <div className="h-full rounded-2xl bg-white border border-[#E7CDD3]/60 p-6 hover:border-[#E7CDD3] hover:shadow-[0_8px_40px_rgba(135,16,44,0.08)] hover:-translate-y-0.5 transition-all duration-300">
      <span className="inline-flex w-11 h-11 rounded-xl bg-[#FFE8ED] text-[#87102C] items-center justify-center mb-4">
        {icon}
      </span>
      <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#888] mb-1.5">
        {eyebrow}
      </p>
      <p className="text-base sm:text-lg font-bold text-[#111] leading-snug">{primary}</p>
      {secondary && (
        <p className="text-xs text-[#666] mt-1.5 leading-relaxed">{secondary}</p>
      )}
    </div>
  );
}

function LinkAnchorChip({
  href,
  icon,
  eyebrow,
  primary,
}: ChipProps & { href: string }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group h-full block rounded-2xl bg-white border border-[#E7CDD3]/60 p-6 hover:border-[#87102C]/40 hover:shadow-[0_8px_40px_rgba(135,16,44,0.08)] hover:-translate-y-0.5 transition-all duration-300"
    >
      <span className="inline-flex w-11 h-11 rounded-xl bg-[#FFE8ED] text-[#87102C] items-center justify-center mb-4 group-hover:bg-[#87102C] group-hover:text-white transition-colors">
        {icon}
      </span>
      <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#888] mb-1.5">
        {eyebrow}
      </p>
      <p className="text-base sm:text-lg font-bold text-[#111] leading-snug break-words group-hover:text-[#87102C] transition-colors">
        {primary}
      </p>
    </a>
  );
}

function InvertedAnchorCard({
  icon,
  eyebrow,
  primary,
  secondary,
}: ChipProps & { size?: "large" }) {
  return (
    <div
      className="relative h-full overflow-hidden rounded-2xl p-8 sm:p-10 text-white"
      style={{
        background:
          "linear-gradient(160deg, #2a0410 0%, #4a0819 30%, #87102C 70%, #a01535 100%)",
      }}
    >
      {/* Texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Soft glow */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#FFB3C1]/15 blur-3xl rounded-full pointer-events-none" />

      <div className="relative">
        <span className="inline-flex w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 items-center justify-center mb-6">
          {icon}
        </span>
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#FFB3C1] mb-2">
          {eyebrow}
        </p>
        <p className="text-3xl sm:text-4xl font-bold leading-tight font-serif italic">
          {primary}
        </p>
        {secondary && (
          <p className="mt-4 text-sm text-white/70 leading-relaxed max-w-[280px]">
            {secondary}
          </p>
        )}
      </div>
    </div>
  );
}
