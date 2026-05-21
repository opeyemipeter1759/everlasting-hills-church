"use client";

import { useRef } from "react";
import { MapPin, Clock, Navigation, X, Car, PersonStanding, Train } from "lucide-react";
import { CHURCH, type RouteInfo, type TravelMode } from "../config/config";
import { buildMapSrc, openGoogleMapsNav } from "../utils/UseDirection";


interface DirectionsModalProps {
  travelMode: TravelMode;
  userLocation: { lat: number; lng: number } | null;
  locationError: string | null;
  routeInfo: RouteInfo | null;
  loadingRoute: boolean;
  onClose: () => void;
  onModeChange: (mode: TravelMode) => void;
}

const MODE_BUTTONS: { mode: TravelMode; icon: typeof Car; label: string }[] = [
  { mode: "driving",  icon: Car,           label: "Drive"   },
  { mode: "walking",  icon: PersonStanding, label: "Walk"    },
  { mode: "transit",  icon: Train,          label: "Transit" },
];

export default function DirectionsModal({
  travelMode,
  userLocation,
  locationError,
  routeInfo,
  loadingRoute,
  onClose,
  onModeChange,
}: DirectionsModalProps) {
  const mapRef = useRef<HTMLIFrameElement>(null);
  const mapSrc = buildMapSrc(travelMode, userLocation ?? undefined);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ maxHeight: "92dvh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFE8ED] flex items-center justify-center">
              <MapPin size={16} className="text-[#87102C]" />
            </div>
            <div>
              <p className="font-semibold text-[#111] text-sm leading-tight">
                {CHURCH.name}
              </p>
              <p className="text-xs text-[#888] leading-tight">{CHURCH.address}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            aria-label="Close directions modal"
            title="Close"
          >
            <X size={15} className="text-gray-600" />
          </button>
        </div>

        {/* Travel mode tabs */}
        <div className="flex gap-2 px-5 py-3 border-b border-gray-100">
          {MODE_BUTTONS.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                travelMode === mode
                  ? "bg-[#87102C] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Route info bar */}
        <div className="px-5 py-3 bg-[#FFF4F6] border-b border-[#F0D0D7] min-h-[52px] flex items-center">
          {loadingRoute ? (
            <div className="flex items-center gap-2 text-sm text-[#87102C]">
              <div className="w-4 h-4 border-2 border-[#87102C] border-t-transparent rounded-full animate-spin" />
              Getting your location…
            </div>
          ) : locationError ? (
            <p className="text-sm text-amber-700">{locationError}</p>
          ) : routeInfo ? (
            <div className="flex items-center gap-4 w-full">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-[#87102C]" />
                <span className="text-sm font-semibold text-[#111]">
                  {routeInfo.distance}
                </span>
                <span className="text-xs text-[#888]">away</span>
              </div>
              <div className="w-px h-4 bg-[#E7CDD3]" />
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-[#87102C]" />
                <span className="text-sm font-semibold text-[#111]">
                  {routeInfo.duration}
                </span>
                <span className="text-xs text-[#888]">estimated</span>
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => openGoogleMapsNav(travelMode, userLocation)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#87102C] text-white text-xs font-semibold hover:bg-[#6E0C24] transition-colors"
                >
                  <Navigation size={12} />
                  Open in Maps
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#888]">Showing church location</p>
          )}
        </div>

        {/* Map embed */}
        <div className="relative flex-1" style={{ minHeight: "340px" }}>
          <iframe
            ref={mapRef}
            key={`${travelMode}-${userLocation?.lat}-${userLocation?.lng}`}
            src={mapSrc}
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: "340px" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Directions to church"
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-[#aaa]">
            Tap "Open in Maps" for turn-by-turn navigation
          </p>
          <button
            onClick={onClose}
            className="text-xs text-[#87102C] font-medium hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}