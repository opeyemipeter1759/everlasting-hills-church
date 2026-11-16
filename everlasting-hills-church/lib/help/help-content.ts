/**
 * Knowledge base for the in-app Help widget (components/help/HelpChatWidget.tsx).
 * Plain data — add or edit topics here without touching the widget itself.
 * Sections are matched against the current URL by longest-prefix match, so a
 * more specific path (e.g. /dashboard/explore-courses) is tried before a
 * shorter one (e.g. /dashboard). ACCOUNT_TOPICS are shown everywhere, since
 * "I forgot my password" isn't tied to any one page.
 */

export interface HelpTopic {
  id: string;
  /** The question shown as a suggestion chip, and echoed back when matched. */
  question: string;
  /** Extra words that should also match this topic from free-typed text. */
  keywords: string[];
  steps: string[];
  cta?: { label: string; href: string };
}

export interface HelpSection {
  pathPrefix: string;
  pageLabel: string;
  topics: HelpTopic[];
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    pathPrefix: "/dashboard/reading",
    pageLabel: "Reading plan",
    topics: [
      {
        id: "reading-how-it-works",
        question: "How does the reading plan work?",
        keywords: ["reading", "plan", "bible", "portion", "streak"],
        steps: [
          "Today's portion is at the top of the Reading plan page.",
          "Read it in your own Bible, or tap the passage to open it here.",
          "Tap \"Mark as read\" once you're done — your streak grows each day you finish.",
          "Missed a day? Scroll down to catch up on earlier portions any time.",
        ],
        cta: { label: "Go to today's reading", href: "/dashboard/reading" },
      },
      {
        id: "reading-change-plan",
        question: "Can I switch to a different reading plan?",
        keywords: ["switch", "change", "plans", "different plan"],
        steps: [
          "Open Reading plan, then look for \"Plans\" to see what's available.",
          "Pick the one that fits your pace — switching keeps your streak, but moves you to that plan's schedule from today.",
        ],
        cta: { label: "Browse plans", href: "/dashboard/reading/plans" },
      },
    ],
  },
  {
    pathPrefix: "/dashboard/prayer-watch",
    pageLabel: "Prayer Watch",
    topics: [
      {
        id: "prayer-watch-signup",
        question: "How do I join a prayer watch hour?",
        keywords: ["prayer", "watch", "signup", "slot", "hour", "family"],
        steps: [
          "Open Prayer Watch and pick a watch hour (\"Prayer Watchmen Family\") that's still open.",
          "Confirm your sign-up — you'll get a WhatsApp link for that hour's group.",
          "Show up for your hour, and log what you sensed from God afterward if you'd like.",
        ],
        cta: { label: "Open Prayer Watch", href: "/dashboard/prayer-watch" },
      },
      {
        id: "prayer-watch-change-hour",
        question: "Can I change my prayer watch hour?",
        keywords: ["change hour", "swap", "different hour", "move"],
        steps: [
          "On Prayer Watch, look for an option to request a different hour for your Prayer Watchmen Family.",
          "An admin reviews the request — you'll be told once it's decided.",
        ],
      },
    ],
  },
  {
    pathPrefix: "/dashboard/explore-courses",
    pageLabel: "Explore courses",
    topics: [
      {
        id: "explore-courses-enroll",
        question: "How do I enroll in a course?",
        keywords: ["enroll", "enrol", "course", "signup", "join course"],
        steps: [
          "Browse Explore courses and open the one you're interested in.",
          "Enroll from the course page — it'll then appear under My courses.",
          "Work through it at your own pace; your progress is saved as you go.",
        ],
        cta: { label: "Explore courses", href: "/dashboard/explore-courses" },
      },
    ],
  },
  {
    pathPrefix: "/dashboard/courses",
    pageLabel: "Courses",
    topics: [
      {
        id: "courses-exam-certificate",
        question: "How do I get my certificate after a course?",
        keywords: ["certificate", "exam", "finish", "complete", "pass"],
        steps: [
          "Watch every lesson in the course — each one is marked as you finish it.",
          "Once all lessons are done, take the course's exam.",
          "Pass the exam and your certificate becomes available to download from the course page.",
        ],
      },
    ],
  },
  {
    pathPrefix: "/dashboard/classes",
    pageLabel: "Classes",
    topics: [
      {
        id: "classes-apply",
        question: "How do I apply for a class?",
        keywords: ["class", "apply", "application", "cohort"],
        steps: [
          "Open the class you're interested in from the Classes page.",
          "Tap Apply and fill in the short application.",
          "Once accepted, the class's weekly lessons unlock here as the cohort progresses.",
        ],
        cta: { label: "Browse classes", href: "/dashboard/classes" },
      },
    ],
  },
  {
    pathPrefix: "/dashboard/giving",
    pageLabel: "Give",
    topics: [
      {
        id: "give-how-to",
        question: "How do I give (tithe or offering)?",
        keywords: ["give", "giving", "tithe", "offering", "donate", "pay"],
        steps: [
          "Open Give and choose what you're giving toward (tithe, offering, a project, etc.).",
          "Enter the amount and follow the payment steps.",
          "A receipt is kept on this page once it's confirmed.",
        ],
        cta: { label: "Go to Give", href: "/dashboard/giving" },
      },
      {
        id: "give-receipt",
        question: "Where can I find my giving receipt or history?",
        keywords: ["receipt", "history", "past giving", "records"],
        steps: ["Your past gifts and their receipts are listed on the Give page, newest first."],
        cta: { label: "View giving history", href: "/dashboard/giving" },
      },
    ],
  },
  {
    pathPrefix: "/dashboard/sermon",
    pageLabel: "Sermons",
    topics: [
      {
        id: "sermons-watch",
        question: "Where can I watch or listen to past sermons?",
        keywords: ["sermon", "watch", "listen", "video", "past"],
        steps: [
          "Open Sermons to see the full library, newest first.",
          "Tap any sermon to watch or listen, and leave a comment if you'd like.",
        ],
        cta: { label: "Go to Sermons", href: "/dashboard/sermon" },
      },
    ],
  },
  {
    pathPrefix: "/dashboard/calendar",
    pageLabel: "Calendar",
    topics: [
      {
        id: "calendar-events",
        question: "How do I see upcoming church events?",
        keywords: ["calendar", "event", "events", "schedule", "upcoming"],
        steps: [
          "Open Calendar to see everything coming up — services, programs, and special events.",
          "Tap an event for its details, time, and location.",
        ],
        cta: { label: "Open Calendar", href: "/dashboard/calendar" },
      },
    ],
  },
  {
    pathPrefix: "/dashboard/attendance",
    pageLabel: "Attendance",
    topics: [
      {
        id: "attendance-check-in",
        question: "How does attendance check-in work?",
        keywords: ["attendance", "check in", "checkin", "present"],
        steps: [
          "Open Attendance to check in for a service or program that's currently open for check-in.",
          "Your attendance record builds up here over time.",
        ],
        cta: { label: "Open Attendance", href: "/dashboard/attendance" },
      },
    ],
  },
  {
    pathPrefix: "/dashboard/family",
    pageLabel: "Family",
    topics: [
      {
        id: "family-household",
        question: "How do I manage my household/family profile?",
        keywords: ["family", "household", "spouse", "children", "add family"],
        steps: [
          "Open Family to see or add the people in your household.",
          "Add a family member's basic details — this helps the church reach your whole household, not just you.",
        ],
        cta: { label: "Open Family", href: "/dashboard/family" },
      },
    ],
  },
  {
    pathPrefix: "/dashboard/unit",
    pageLabel: "Units",
    topics: [
      {
        id: "units-join",
        question: "How do I join a unit or ministry?",
        keywords: ["unit", "ministry", "join", "serve", "volunteer"],
        steps: [
          "Open Units to see the ministries you're part of, or ones you can join.",
          "Each unit page shows what it does and who leads it — reach out to the unit leader from there to join in.",
        ],
        cta: { label: "Open Units", href: "/dashboard/unit" },
      },
    ],
  },
  {
    pathPrefix: "/dashboard/one-on-one",
    pageLabel: "Talk to a pastor",
    topics: [
      {
        id: "one-on-one-book",
        question: "How do I book a session with a pastor?",
        keywords: ["pastor", "one-on-one", "one on one", "session", "book", "meet"],
        steps: [
          "Open the One-on-one page and choose a pastor and a time that works for you.",
          "Submit your request — the pastor (or their delegate) will confirm it.",
          "You'll get the meeting link or details once it's approved.",
        ],
        cta: { label: "Request a session", href: "/dashboard/one-on-one" },
      },
    ],
  },
  {
    pathPrefix: "/dashboard/articles",
    pageLabel: "Articles",
    topics: [
      {
        id: "articles-write",
        question: "How do I write and submit an article?",
        keywords: ["article", "write", "submit", "publish", "blog"],
        steps: [
          "Open Articles and choose Write.",
          "Draft your article — you can save it and come back to it any time before submitting.",
          "Submit it for review; you'll be told once it's published or if changes are needed.",
        ],
        cta: { label: "Write an article", href: "/dashboard/articles/write" },
      },
    ],
  },
  {
    pathPrefix: "/dashboard/books",
    pageLabel: "Books",
    topics: [
      {
        id: "books-browse",
        question: "How do I read a book from the library?",
        keywords: ["book", "books", "library", "read"],
        steps: ["Open Books, pick one, and start reading — your place is saved as you go."],
        cta: { label: "Open Books", href: "/dashboard/books" },
      },
    ],
  },
  {
    pathPrefix: "/dashboard/profile",
    pageLabel: "Profile",
    topics: [
      {
        id: "profile-update",
        question: "How do I update my profile details or photo?",
        keywords: ["profile", "photo", "picture", "update details", "edit profile"],
        steps: [
          "Open Profile and tap Edit.",
          "Update your details or photo, then save.",
        ],
        cta: { label: "Open Profile", href: "/dashboard/profile" },
      },
    ],
  },
];

/** Shown on every page, not tied to any one section — account/login help. */
export const ACCOUNT_TOPICS: HelpTopic[] = [
  {
    id: "account-forgot-password",
    question: "I forgot my password — what do I do?",
    keywords: ["forgot", "password", "reset", "login", "signin"],
    steps: [
      "On the sign-in page, tap \"Forgot password\".",
      "Enter the email you signed up with — a reset link is sent to it.",
      "Open that link and set a new password, then sign in as usual.",
    ],
  },
  {
    id: "account-change-email",
    question: "How do I change my email or phone number?",
    keywords: ["change email", "update email", "phone number", "change phone"],
    steps: [
      "Open Profile and tap Edit.",
      "Update your email or phone number, then save.",
    ],
    cta: { label: "Open Profile", href: "/dashboard/profile" },
  },
  {
    id: "account-notifications",
    question: "How do I turn notifications on or off?",
    keywords: ["notification", "notifications", "email me", "turn off alerts"],
    steps: ["Open Profile and look for Notification preferences — switch off whatever you don't want to hear about."],
    cta: { label: "Open Profile", href: "/dashboard/profile" },
  },
  {
    id: "account-logout-everywhere",
    question: "How do I log out of all my devices?",
    keywords: ["signout", "logout", "all devices", "everywhere"],
    steps: [
      "Open Profile, then look for a security or sessions option.",
      "If you only want to sign out of this device, use the regular Sign out in the sidebar.",
    ],
  },
];

const FALLBACK_HINT = [
  "I don't have an answer written for that yet.",
  "Try rephrasing, pick one of the suggestions below, or talk to a person — someone will get back to you.",
];

export function findSection(pathname: string): HelpSection | null {
  const candidates = HELP_SECTIONS.filter((s) => pathname.startsWith(s.pathPrefix));
  if (candidates.length === 0) return null;
  // Longest prefix wins, so a specific section beats a shorter, broader one.
  return candidates.reduce((best, s) => (s.pathPrefix.length > best.pathPrefix.length ? s : best));
}

/** A readable label for pages with no HELP_SECTIONS entry (admin, pastor,
 * unit-lead pages — HillsBot's AI answer covers those; this just names the
 * page in the context banner). Skips a trailing id-looking segment. */
export function prettyPathLabel(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "dashboard";
  const looksLikeId = /^[0-9a-f-]{8,}$/i.test(last) || /^\d+$/.test(last);
  const label = (looksLikeId ? segments[segments.length - 2] : last) ?? last;
  return label.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Generic words that show up in nearly every topic's own question ("How do I
// ...?"), so they can't be allowed to count as a real match signal — without
// this, two unrelated topics tie on "how"/"do" alone and whichever comes
// first in the array wins, regardless of what was actually asked.
const STOPWORDS = new Set([
  "how", "do", "does", "did", "i", "im", "my", "me", "can", "what", "where", "when", "why",
  "is", "are", "am", "the", "a", "an", "to", "in", "on", "of", "for", "with", "and", "or",
  "it", "this", "that", "you", "your", "from", "about", "will", "would", "should", "could",
  "get", "go", "up", "down", "please", "need", "want", "like", "so", "not", "no", "yes",
  "work", "works", "working",
]);

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\W+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function topicTokens(topic: HelpTopic): Set<string> {
  return new Set([...tokenize(topic.question), ...topic.keywords.flatMap((k) => tokenize(k))]);
}

function score(topic: HelpTopic, terms: string[]): number {
  const tokens = topicTokens(topic);
  return terms.reduce((sum, term) => sum + (tokens.has(term) ? 1 : 0), 0);
}

/** Best-matching topic for free-typed text, searched across every page's
 * topics (not just the current page) since a question can be about anywhere
 * in the app regardless of where it's asked from. Ties prefer a topic from
 * the current page, since that's the more likely intent. */
export function matchTopic(query: string, section: HelpSection | null): HelpTopic | null {
  const terms = tokenize(query);
  if (terms.length === 0) return null;

  const allTopics = [...HELP_SECTIONS.flatMap((s) => s.topics), ...ACCOUNT_TOPICS];
  const sectionTopicIds = new Set((section?.topics ?? []).map((t) => t.id));

  let best: HelpTopic | null = null;
  let bestScore = 0;
  for (const topic of allTopics) {
    const s = score(topic, terms);
    if (s === 0) continue;
    const better = s > bestScore || (s === bestScore && sectionTopicIds.has(topic.id) && !sectionTopicIds.has(best?.id ?? ""));
    if (better) {
      best = topic;
      bestScore = s;
    }
  }
  return best;
}

export function fallbackMessage(): string {
  return FALLBACK_HINT.join(" ");
}
