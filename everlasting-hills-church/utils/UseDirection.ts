"use client";

import { useState } from "react";
import { CHURCH } from "../config/config";
import type { TravelMode, RouteInfo } from "../config/config";

function estimateRoute(
  origin: { lat: number; lng: number },
  mode: TravelMode
): RouteInfo {
  const R = 6371;
  const dLat = ((CHURCH.lat - origin.lat) * Math.PI) / 180;
  const dLng = ((CHURCH.lng - origin.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((CHURCH.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const speeds: Record<TravelMode, number> = { driving: 35, walking: 5, transit: 20 };
  const mins = Math.round((distKm / speeds[mode]) * 60);
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return {
    distance: distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`,
    duration: hrs > 0 ? `${hrs}h ${rem}min` : `${mins} min`,
    mode,
  };
}

export function buildMapSrc(
  mode: TravelMode,
  origin?: { lat: number; lng: number }
): string {
  const dest = encodeURIComponent(CHURCH.address);
  if (origin) {
    const from = encodeURIComponent(`${origin.lat},${origin.lng}`);
    const flag = mode === "walking" ? "w" : mode === "transit" ? "r" : "d";
    return `https://maps.google.com/maps?saddr=${from}&daddr=${dest}&dirflg=${flag}&output=embed`;
  }
  return `https://maps.google.com/maps?q=${dest}&z=15&output=embed`;
}

export function openGoogleMapsNav(
  mode: TravelMode,
  userLocation: { lat: number; lng: number } | null
) {
  const dest = `${CHURCH.lat},${CHURCH.lng}`;
  const modeParam = mode === "walking" ? "walking" : mode === "transit" ? "transit" : "driving";
  const url = userLocation
    ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${dest}&travelmode=${modeParam}`
    : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=${modeParam}`;
  window.open(url, "_blank");
}

export function useDirections() {
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>("driving");
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const handleGetDirections = () => {
    setShowMap(true);
    setLocationError(null);
    setLoadingRoute(true);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setLoadingRoute(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setRouteInfo(estimateRoute(loc, travelMode));
        setLoadingRoute(false);
      },
      () => {
        setLocationError("Couldn't get your location. Showing church location only.");
        setLoadingRoute(false);
      },
      { timeout: 8000 }
    );
  };

  const handleModeChange = (mode: TravelMode) => {
    setTravelMode(mode);
    if (userLocation) setRouteInfo(estimateRoute(userLocation, mode));
  };

  return {
    showMap,
    setShowMap,
    userLocation,
    locationError,
    travelMode,
    routeInfo,
    loadingRoute,
    handleGetDirections,
    handleModeChange,
  };
}