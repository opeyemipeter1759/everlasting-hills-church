/**
 * Push trigger events. Mirrors notification-events.ts (email) so both channels
 * are fired the same way: emit and forget, never awaited by the request that
 * caused them.
 */
export const PushEvents = {
  ServiceLive: 'push.service.live',
  AnnouncementPublished: 'push.announcement.published',
  SermonPublished: 'push.sermon.published',
} as const;

export interface ServiceLivePayload {
  tenantId: string;
  serviceId: string;
  serviceName: string;
}

export interface AnnouncementPublishedPayload {
  tenantId: string;
  announcementId: string;
  title: string;
  body: string;
  /** "all" for church-wide, otherwise a department or unit id. */
  audience: string;
}

export interface SermonPublishedPayload {
  tenantId: string;
  sermonId: string;
  title: string;
  slug?: string | null;
  preacher?: string | null;
}
