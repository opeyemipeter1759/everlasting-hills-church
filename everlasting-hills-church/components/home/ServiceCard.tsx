"use client";

import { Clock, MapPin, Calendar, Youtube } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { CHURCH } from "../config/config";


interface ServiceCardsProps {
  isSundayToday: boolean;
  isWednesdayToday: boolean;
  isLive: boolean;
}

export default function ServiceCards({
  isSundayToday,
  isWednesdayToday,
  isLive,
}: ServiceCardsProps) {
  const cards = [
    {
      icon: Clock,
      label: "Sunday Service",
      value: "Sundays — 9:00 AM",
      sub: isSundayToday ? "🟢 Service is on today" : "Doors open at 8:30 AM",
      isActive: isSundayToday,
    },

    {
      icon: Calendar,
      label: "Midweek Service",
      value: "Wednesdays — 5:30 PM",
      sub: isWednesdayToday ? "🟢 Service is on today" : "Bible study & prayer",
      isActive: isWednesdayToday,
      },
        {
      icon: MapPin,
      label: "Location",
      value: "Ibadan, Nigeria",
      sub: "Oyo State",
      isActive: false,
    },
  ];

  return (
    <div className="space-y-4">
      {cards.map((card, i) => (
        <ScrollReveal key={card.label} delay={0.15 + i * 0.1} direction="right">
          <div
            className={`flex items-start gap-5 bg-white rounded-2xl p-6 border transition-all duration-300 ${
              card.isActive
                ? "border-[#87102C]/30 shadow-[0_4px_24px_rgba(135,16,44,0.10)]"
                : "border-[#E7CDD3]/60 hover:border-[#E7CDD3] hover:shadow-[0_4px_24px_rgba(135,16,44,0.06)]"
            }`}
          >
            {/* Icon */}
            <div
              className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                card.isActive ? "bg-[#87102C]" : "bg-[#FFE8ED]"
              }`}
            >
              <card.icon
                size={18}
                className={card.isActive ? "text-white" : "text-[#87102C]"}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#999] tracking-[0.15em] uppercase font-medium mb-0.5">
                {card.label}
              </p>
              <p className="text-[#111] font-semibold text-base">{card.value}</p>
              <p
                className={`text-sm mt-0.5 ${
                  card.isActive ? "text-[#87102C] font-medium" : "text-[#888]"
                }`}
              >
                {card.sub}
              </p>

              {/* Live now → "Join Live" button */}
              {card.isActive && isLive && (
                <a
                  href={CHURCH.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                  </span>
                  Join Live on YouTube
                </a>
              )}

              {/* Service day but not live yet → softer "Watch on YouTube" */}
              {card.isActive && !isLive && (
                <a
                  href={CHURCH.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFE8ED] text-[#87102C] text-xs font-semibold hover:bg-[#FFCDD7] transition-colors"
                >
                  <Youtube size={13} />
                  Watch on YouTube
                </a>
              )}
            </div>
          </div>
        </ScrollReveal>
      ))}

      {/* First-time visitor note */}
    
    </div>
  );
}