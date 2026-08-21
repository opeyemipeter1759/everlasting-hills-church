import { Injectable } from '@nestjs/common';
import ical, { ICalAlarmType, ICalCalendar, ICalEventStatus } from 'ical-generator';
import { getVtimezoneComponent } from '@touch4it/ical-timezones';

/** Every gathering this church runs is in Nigeria. */
export const CHURCH_TIMEZONE = 'Africa/Lagos';

export interface IcsEventInput {
  /** Stable across regenerations. Calendar clients dedupe and update on this. */
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  url?: string;
  /** RFC 5545 RRULE without the "RRULE:" prefix, e.g. "FREQ=DAILY". */
  repeating?: string;
  cancelled?: boolean;
  /** Minutes before start for the default reminder. Omit for no alarm. */
  alarmMinutesBefore?: number;
  lastModified?: Date;
}

/**
 * Builds .ics payloads.
 *
 * Timezone handling is the whole point of this class. Emitting floating times
 * ("come at 9am, whatever that means to you") or UTC-only times is the most
 * common .ics bug: a service at 09:00 in Lagos shows up at 08:00 for anyone
 * whose calendar is in UTC, and shifts again for members abroad. So every event
 * carries an explicit Africa/Lagos TZID, and the calendar carries the matching
 * VTIMEZONE component that defines it.
 *
 * Nigeria has no daylight saving and has been UTC+1 throughout, which is why
 * this looks simple — but the VTIMEZONE is still emitted rather than assumed,
 * because a client that cannot resolve a TZID falls back to floating time and
 * we are back to the original bug.
 */
@Injectable()
export class IcsBuilderService {
  /**
   * Creates a calendar shell.
   *
   * `name` becomes X-WR-CALNAME, which is what most clients display in the
   * sidebar. Without it, a subscribed feed shows up as its raw URL.
   */
  createCalendar(options: { name: string; description?: string; ttlSeconds?: number }): ICalCalendar {
    const calendar = ical({
      name: options.name,
      description: options.description,
      prodId: { company: 'Everlasting Hills Church', product: 'ehc-calendar', language: 'EN' },
      timezone: {
        name: CHURCH_TIMEZONE,
        // Supplies the real VTIMEZONE block. Without a generator, ical-generator
        // writes the TZID but no definition of it, and strict clients (Outlook
        // in particular) either reject the feed or silently treat it as UTC.
        generator: getVtimezoneComponent,
      },
    });

    if (options.ttlSeconds) {
      // Emits both REFRESH-INTERVAL (RFC 7986) and X-PUBLISHED-TTL (the older
      // Outlook/Google hint). Advisory only: clients refresh on their own
      // schedule, typically hours. That is fine for scheduled services and is
      // exactly why urgent changes go out via push instead of via the feed.
      calendar.ttl(options.ttlSeconds);
    }

    return calendar;
  }

  addEvent(calendar: ICalCalendar, input: IcsEventInput): void {
    const event = calendar.createEvent({
      id: input.uid,
      start: input.start,
      end: input.end,
      timezone: CHURCH_TIMEZONE,
      summary: input.summary,
      description: input.description,
      location: input.location,
      url: input.url,
      lastModified: input.lastModified,
      // A cancelled service stays in the feed as CANCELLED rather than being
      // dropped. If it simply vanished, a subscriber's calendar would quietly
      // lose the entry and they would turn up to a locked building.
      status: input.cancelled ? ICalEventStatus.CANCELLED : ICalEventStatus.CONFIRMED,
    });

    if (input.repeating) {
      // Passed through as a raw RRULE string so the stored rule is emitted
      // verbatim, rather than being round-tripped through an object model that
      // could quietly drop parts of it.
      event.repeating(`RRULE:${input.repeating}`);
    }

    // No alarm on a cancelled event: reminding someone about a service that is
    // not happening is worse than not reminding them at all.
    if (input.alarmMinutesBefore && !input.cancelled) {
      event.createAlarm({
        type: ICalAlarmType.display,
        triggerBefore: input.alarmMinutesBefore * 60,
        description: input.summary,
      });
    }
  }

  /** Serialises to the wire format. */
  toString(calendar: ICalCalendar): string {
    return calendar.toString();
  }
}
