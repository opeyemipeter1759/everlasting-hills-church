export { useCurrentUser } from './useCurrentUser';
export { useNavDropdown } from './useNavDropdown';
export { useSessionReady } from './useSessionReady';
export { useAnnouncementsFeed, type Announcement } from './useAnnouncementsFeed';
export { useUnseenAnnouncements } from './useUnseenAnnouncements';
export { useRegisteredEvents } from './useRegisteredEvents';

import { useState, useEffect } from "react";

type QrBannerType = "success" | "already" | "error" | "invalid";

export interface QrBanner {
  type: QrBannerType;
  service?: string;
}

export function useMemberQrBanner() {
  const [qrBanner, setQrBanner] = useState<QrBanner | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qr = params.get("qr");
    if (!qr) return;
    const service = params.get("service") ?? undefined;
    if (qr === "success" || qr === "already" || qr === "error" || qr === "invalid") {
      setQrBanner({ type: qr as QrBannerType, service });
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  return { qrBanner, setQrBanner };
}
