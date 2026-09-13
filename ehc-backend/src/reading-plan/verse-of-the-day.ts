import { daysBetween } from './local-date.util';
import { toVerseId } from './verse-id.util';

/**
 * The verse of the day.
 *
 * A curated rotation rather than a random pick. A random verse from the whole
 * Bible is as likely to be a genealogy as a promise, and this one goes out on
 * members' WhatsApp status with the church's name on it. Every entry is short
 * enough for a phone-sized card and makes sense read on its own.
 *
 * The same date gives everyone the same verse, so the church posts one verse
 * on one day. Which date it is — Lagos's, not the phone's — is the caller's
 * decision.
 *
 * Entries are [book, chapter, first verse, last verse?], with books numbered
 * 1 to 66 in canonical order. Each was checked against the seeded WEB and KJV
 * text when it was added.
 */
export type DailyVerseRef = readonly [book: number, chapter: number, from: number, to?: number];

export const DAILY_VERSES: readonly DailyVerseRef[] = [
  [19, 122, 1], // Psalm 122:1 — let us go into the house of the Lord
  [24, 29, 11], // Jeremiah 29:11
  [50, 4, 13], // Philippians 4:13
  [19, 23, 1], // Psalm 23:1
  [23, 41, 10], // Isaiah 41:10
  [6, 1, 9], // Joshua 1:9
  [20, 3, 5, 6], // Proverbs 3:5-6
  [45, 8, 28], // Romans 8:28
  [58, 10, 24, 25], // Hebrews 10:24-25 — not giving up meeting together
  [50, 4, 6, 7], // Philippians 4:6-7
  [40, 11, 28], // Matthew 11:28
  [43, 3, 16], // John 3:16
  [19, 46, 1], // Psalm 46:1
  [23, 40, 31], // Isaiah 40:31
  [47, 5, 17], // 2 Corinthians 5:17
  [25, 3, 22, 23], // Lamentations 3:22-23
  [19, 118, 24], // Psalm 118:24
  [40, 18, 20], // Matthew 18:20 — where two or three gather
  [58, 11, 1], // Hebrews 11:1
  [45, 12, 2], // Romans 12:2
  [40, 6, 33], // Matthew 6:33
  [19, 37, 4], // Psalm 37:4
  [48, 2, 20], // Galatians 2:20
  [43, 14, 27], // John 14:27
  [60, 5, 7], // 1 Peter 5:7
  [19, 121, 1, 2], // Psalm 121:1-2
  [19, 133, 1], // Psalm 133:1 — brethren dwelling together in unity
  [5, 31, 6], // Deuteronomy 31:6
  [4, 6, 24, 26], // Numbers 6:24-26
  [36, 3, 17], // Zephaniah 3:17
  [23, 26, 3], // Isaiah 26:3
  [49, 2, 8, 9], // Ephesians 2:8-9
  [45, 15, 13], // Romans 15:13
  [19, 27, 1], // Psalm 27:1
  [44, 2, 42], // Acts 2:42 — devoted to fellowship and prayer
  [43, 16, 33], // John 16:33
  [55, 1, 7], // 2 Timothy 1:7
  [40, 5, 16], // Matthew 5:16
  [19, 119, 105], // Psalm 119:105
  [58, 13, 8], // Hebrews 13:8
  [23, 43, 2], // Isaiah 43:2
  [33, 6, 8], // Micah 6:8
  [46, 13, 13], // 1 Corinthians 13:13
  [43, 15, 5], // John 15:5
  [19, 34, 8], // Psalm 34:8
  [45, 5, 8], // Romans 5:8
  [50, 1, 6], // Philippians 1:6
  [51, 3, 23], // Colossians 3:23
  [59, 1, 5], // James 1:5
  [19, 91, 1, 2], // Psalm 91:1-2
  [23, 9, 6], // Isaiah 9:6
  [40, 28, 20], // Matthew 28:20
  [62, 4, 19], // 1 John 4:19
  [62, 1, 9], // 1 John 1:9
  [49, 3, 20], // Ephesians 3:20
  [19, 16, 11], // Psalm 16:11
  [20, 18, 10], // Proverbs 18:10
  [34, 1, 7], // Nahum 1:7
  [35, 3, 19], // Habakkuk 3:19
  [23, 54, 10], // Isaiah 54:10
  [19, 139, 14], // Psalm 139:14
  [47, 12, 9], // 2 Corinthians 12:9
  [45, 10, 9], // Romans 10:9
  [43, 8, 12], // John 8:12
  [43, 10, 10], // John 10:10
  [43, 11, 25], // John 11:25
  [43, 14, 6], // John 14:6
  [44, 1, 8], // Acts 1:8
  [19, 100, 4, 5], // Psalm 100:4-5
  [19, 103, 1, 2], // Psalm 103:1-2
  [21, 3, 1], // Ecclesiastes 3:1
  [48, 6, 9], // Galatians 6:9
  [52, 5, 16, 18], // 1 Thessalonians 5:16-18
  [19, 55, 22], // Psalm 55:22
  [23, 12, 2], // Isaiah 12:2
  [20, 16, 3], // Proverbs 16:3
  [20, 4, 23], // Proverbs 4:23
  [19, 145, 18], // Psalm 145:18
  [19, 30, 5], // Psalm 30:5
  [23, 60, 1], // Isaiah 60:1
  [45, 8, 38, 39], // Romans 8:38-39
  [45, 8, 31], // Romans 8:31
  [47, 4, 18], // 2 Corinthians 4:18
  [50, 4, 19], // Philippians 4:19
  [50, 4, 4], // Philippians 4:4
  [51, 3, 2], // Colossians 3:2
  [58, 4, 16], // Hebrews 4:16
  [58, 10, 23], // Hebrews 10:23
  [59, 4, 8], // James 4:8
  [60, 2, 9], // 1 Peter 2:9
  [62, 4, 4], // 1 John 4:4
  [62, 3, 1], // 1 John 3:1
  [66, 3, 20], // Revelation 3:20
  [66, 21, 4], // Revelation 21:4
  [19, 18, 2], // Psalm 18:2
  [19, 19, 14], // Psalm 19:14
  [19, 32, 8], // Psalm 32:8
  [19, 40, 1, 2], // Psalm 40:1-2
  [19, 62, 1, 2], // Psalm 62:1-2
  [19, 84, 11], // Psalm 84:11
  [19, 90, 12], // Psalm 90:12
  [19, 107, 1], // Psalm 107:1
  [19, 126, 3], // Psalm 126:3
  [19, 127, 1], // Psalm 127:1
  [19, 150, 6], // Psalm 150:6
  [23, 30, 21], // Isaiah 30:21
  [23, 55, 8, 9], // Isaiah 55:8-9
  [23, 58, 11], // Isaiah 58:11
  [24, 17, 7], // Jeremiah 17:7
  [24, 33, 3], // Jeremiah 33:3
  [26, 36, 26], // Ezekiel 36:26
  [29, 2, 25], // Joel 2:25
  [40, 5, 9], // Matthew 5:9
  [40, 7, 7], // Matthew 7:7
  [40, 19, 26], // Matthew 19:26
  [41, 9, 23], // Mark 9:23
  [41, 11, 24], // Mark 11:24
  [42, 1, 37], // Luke 1:37
  [42, 6, 31], // Luke 6:31
  [43, 1, 5], // John 1:5
  [43, 13, 34, 35], // John 13:34-35
  [45, 1, 16], // Romans 1:16
  [45, 12, 12], // Romans 12:12
  [46, 16, 14], // 1 Corinthians 16:14
  [47, 9, 7], // 2 Corinthians 9:7
  [48, 5, 22, 23], // Galatians 5:22-23
  [49, 4, 32], // Ephesians 4:32
  [49, 6, 10], // Ephesians 6:10
  [50, 2, 3], // Philippians 2:3
  [51, 3, 15], // Colossians 3:15
  [52, 5, 11], // 1 Thessalonians 5:11
  [53, 3, 3], // 2 Thessalonians 3:3
  [54, 4, 12], // 1 Timothy 4:12
  [55, 3, 16], // 2 Timothy 3:16
  [58, 13, 5], // Hebrews 13:5
  [59, 1, 17], // James 1:17
  [60, 5, 10], // 1 Peter 5:10
  [61, 3, 9], // 2 Peter 3:9
  [62, 4, 18], // 1 John 4:18
  [65, 1, 24], // Jude 24
  [66, 22, 13], // Revelation 22:13
  [1, 28, 15], // Genesis 28:15
  [2, 14, 14], // Exodus 14:14
  [2, 15, 2], // Exodus 15:2
  [9, 16, 7], // 1 Samuel 16:7
  [13, 16, 34], // 1 Chronicles 16:34
  [14, 7, 14], // 2 Chronicles 7:14
  [18, 19, 25], // Job 19:25
  [19, 1, 3], // Psalm 1:3
  [19, 4, 8], // Psalm 4:8
  [19, 5, 3], // Psalm 5:3
  [19, 8, 1], // Psalm 8:1
  [19, 9, 1], // Psalm 9:1
  [19, 28, 7], // Psalm 28:7
  [19, 31, 24], // Psalm 31:24
  [19, 42, 11], // Psalm 42:11
  [19, 51, 10], // Psalm 51:10
  [19, 63, 1], // Psalm 63:1
  [19, 73, 26], // Psalm 73:26
  [19, 86, 5], // Psalm 86:5
  [19, 95, 1], // Psalm 95:1
  [20, 11, 25], // Proverbs 11:25
  [20, 17, 17], // Proverbs 17:17
  [20, 22, 6], // Proverbs 22:6
  [23, 6, 8], // Isaiah 6:8
  [23, 40, 8], // Isaiah 40:8
  [23, 53, 5], // Isaiah 53:5
  [25, 3, 25], // Lamentations 3:25
  [38, 4, 6], // Zechariah 4:6
];

/** Day zero of the rotation. Any fixed date works; this is the feature's. */
export const ROTATION_START = '2026-01-01';

/** The verse for a local calendar date, as a verse range. */
export function verseForDate(date: string) {
  const days = daysBetween(ROTATION_START, date);
  const count = DAILY_VERSES.length;
  // Wraps for dates before the start as well as after, so no date is invalid.
  const index = ((days % count) + count) % count;
  const [book, chapter, from, to] = DAILY_VERSES[index];
  return {
    index,
    startVerseId: toVerseId(book, chapter, from),
    endVerseId: toVerseId(book, chapter, to ?? from),
  };
}
