import { Briefcase, Mail, MapPin, Phone } from "lucide-react";
import type { VisitorRow } from "./types";

export default function VisitorDetails({ visitor }: { visitor: VisitorRow }) {
  return (
    <tr className="bg-[#FFF4F6]/40 dark:bg-white/[0.02] border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
      <td colSpan={6} className="px-5 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#FFB3C1]">
              Contact
            </p>
            {visitor.email && (
              <a
                href={`mailto:${visitor.email}`}
                className="flex items-center gap-2 text-[#555] dark:text-white/60 hover:text-[#87102C] dark:hover:text-[#FFB3C1] transition-colors"
              >
                <Mail size={12} className="text-[#b8a8ac] dark:text-white/30 flex-shrink-0" />
                {visitor.email}
              </a>
            )}
            {visitor.phone && (
              <a
                href={`tel:${visitor.phone}`}
                className="flex items-center gap-2 text-[#555] dark:text-white/60 hover:text-[#87102C] dark:hover:text-[#FFB3C1] transition-colors"
              >
                <Phone size={12} className="text-[#b8a8ac] dark:text-white/30 flex-shrink-0" />
                {visitor.phone}
              </a>
            )}
            {visitor.locatedInIbadan !== null && (
              <span className="flex items-center gap-2 text-[#8a7e80] dark:text-white/45">
                <MapPin size={12} className="text-[#b8a8ac] dark:text-white/30 flex-shrink-0" />
                {visitor.locatedInIbadan ? "Based in Ibadan" : "Visiting / outside Ibadan"}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#FFB3C1]">
              About
            </p>
            {visitor.gender && (
              <span className="flex items-center gap-2 text-[#8a7e80] dark:text-white/45">
                <span className="text-[#b8a8ac] dark:text-white/30">Gender:</span> {visitor.gender}
              </span>
            )}
            {visitor.occupation && (
              <span className="flex items-center gap-2 text-[#8a7e80] dark:text-white/45">
                <Briefcase size={12} className="text-[#b8a8ac] dark:text-white/30 flex-shrink-0" />
                {visitor.occupation}
              </span>
            )}
            {visitor.bornAgain && (
              <span className="flex items-center gap-2 text-[#8a7e80] dark:text-white/45">
                <span className="text-[#b8a8ac] dark:text-white/30">Born again:</span> {visitor.bornAgain}
              </span>
            )}
          </div>
          {visitor.howDidYouLearn && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#FFB3C1]">
                How They Found Us
              </p>
              <p className="text-[#555] dark:text-white/60">{visitor.howDidYouLearn}</p>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
