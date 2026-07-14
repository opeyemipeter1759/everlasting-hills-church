import {
  BookOpen,
  Cross,
  Flame,
  Heart,
  Landmark,
  ScrollText,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

export interface CourseLesson {
  title: string;
  duration: string;
}

export interface CourseModule {
  title: string;
  lessons: CourseLesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  level: CourseLevel;
  icon: LucideIcon;
  gradient: [string, string];
  duration: string;
  lessonsCount: number;
  studentsCount: number;
  instructor: { name: string; role: string };
  outcomes: string[];
  curriculum: CourseModule[];
}

// Frontend-only mock catalog — swap for a real `/courses` API once the backend ships.
export const COURSES: Course[] = [
  {
    id: "c1",
    slug: "foundations-of-faith",
    title: "Foundations of Faith",
    tagline: "The essentials every believer needs, from salvation to spiritual disciplines.",
    description:
      "A gentle on-ramp into the Christian life — what we believe, why it matters, and how to build habits of prayer, Scripture, and community that last.",
    category: "Foundations",
    level: "Beginner",
    icon: Cross,
    gradient: ["#4a0819", "#87102C"],
    duration: "4 weeks",
    lessonsCount: 12,
    studentsCount: 214,
    instructor: { name: "Pastor Opeyemi Peter", role: "Lead Pastor" },
    outcomes: [
      "Explain the gospel in your own words",
      "Build a sustainable daily prayer rhythm",
      "Navigate Scripture with confidence",
      "Understand what it means to belong to a church family",
    ],
    curriculum: [
      {
        title: "Week 1 — Who Is God?",
        lessons: [
          { title: "The Character of God", duration: "18 min" },
          { title: "Creation and the Fall", duration: "22 min" },
        ],
      },
      {
        title: "Week 2 — The Gospel",
        lessons: [
          { title: "Sin, Grace, and the Cross", duration: "20 min" },
          { title: "What It Means to Believe", duration: "16 min" },
        ],
      },
      {
        title: "Week 3 — Spiritual Disciplines",
        lessons: [
          { title: "A Life of Prayer", duration: "19 min" },
          { title: "Reading Scripture Well", duration: "21 min" },
        ],
      },
      {
        title: "Week 4 — Belonging",
        lessons: [
          { title: "Why Church Matters", duration: "17 min" },
          { title: "Your Next Step", duration: "14 min" },
        ],
      },
    ],
  },
  {
    id: "c2",
    slug: "the-prayer-life",
    title: "The Prayer Life",
    tagline: "Move from duty to delight in your conversations with God.",
    description:
      "A practical study of prayer — hearing God, praying Scripture, and building a rhythm that survives busy seasons instead of collapsing under them.",
    category: "Spiritual Growth",
    level: "Beginner",
    icon: Flame,
    gradient: ["#7c2d12", "#c2410c"],
    duration: "3 weeks",
    lessonsCount: 9,
    studentsCount: 158,
    instructor: { name: "Pastor Grace Adewale", role: "Discipleship Pastor" },
    outcomes: [
      "Build a daily prayer rhythm that fits your season of life",
      "Pray Scripture back to God with confidence",
      "Recognize God's voice in the ordinary",
    ],
    curriculum: [
      {
        title: "Week 1 — Why We Pray",
        lessons: [
          { title: "Prayer as Relationship", duration: "15 min" },
          { title: "Common Obstacles", duration: "13 min" },
        ],
      },
      {
        title: "Week 2 — How We Pray",
        lessons: [
          { title: "Praying Scripture", duration: "17 min" },
          { title: "The Lord's Prayer, Line by Line", duration: "20 min" },
        ],
      },
      {
        title: "Week 3 — Sustaining It",
        lessons: [
          { title: "Prayer in Busy Seasons", duration: "16 min" },
          { title: "Praying With Others", duration: "14 min" },
        ],
      },
    ],
  },
  {
    id: "c3",
    slug: "marriage-by-design",
    title: "Marriage by Design",
    tagline: "A biblical vision for covenant, communication, and oneness.",
    description:
      "For couples and those preparing for marriage — grounding your relationship in God's design, with honest tools for communication and conflict.",
    category: "Family",
    level: "Intermediate",
    icon: Heart,
    gradient: ["#831843", "#be185d"],
    duration: "6 weeks",
    lessonsCount: 15,
    studentsCount: 96,
    instructor: { name: "Elder Tunde & Sarah Bakare", role: "Family Life Ministry" },
    outcomes: [
      "Understand marriage as a covenant, not just a contract",
      "Communicate through conflict without contempt",
      "Build shared spiritual practices as a couple",
    ],
    curriculum: [
      {
        title: "Week 1 — God's Design",
        lessons: [
          { title: "Covenant vs. Contract", duration: "19 min" },
          { title: "Oneness and Difference", duration: "18 min" },
        ],
      },
      {
        title: "Week 2 — Communication",
        lessons: [
          { title: "Speaking the Truth in Love", duration: "21 min" },
          { title: "Fighting Fair", duration: "17 min" },
        ],
      },
      {
        title: "Week 3 — Roles & Rhythms",
        lessons: [
          { title: "Leadership and Submission, Rightly Understood", duration: "23 min" },
          { title: "Building Shared Rhythms", duration: "16 min" },
        ],
      },
    ],
  },
  {
    id: "c4",
    slug: "leading-with-integrity",
    title: "Leading with Integrity",
    tagline: "Character-first leadership for those serving in ministry.",
    description:
      "For unit leads, department heads, and anyone stepping into leadership — what it means to lead the way Jesus led: with humility, courage, and integrity.",
    category: "Leadership",
    level: "Advanced",
    icon: Shield,
    gradient: ["#312e81", "#4f46e5"],
    duration: "5 weeks",
    lessonsCount: 14,
    studentsCount: 61,
    instructor: { name: "Pastor Opeyemi Peter", role: "Lead Pastor" },
    outcomes: [
      "Lead from character, not just competence",
      "Give and receive correction with grace",
      "Multiply leaders instead of just managing tasks",
    ],
    curriculum: [
      {
        title: "Week 1 — The Servant Leader",
        lessons: [
          { title: "Jesus and the Towel", duration: "20 min" },
          { title: "Authority Under Authority", duration: "18 min" },
        ],
      },
      {
        title: "Week 2 — Character",
        lessons: [
          { title: "Integrity in the Small Things", duration: "17 min" },
          { title: "Handling Power Well", duration: "19 min" },
        ],
      },
      {
        title: "Week 3 — Multiplying",
        lessons: [
          { title: "Raising Up Others", duration: "22 min" },
          { title: "Succession and Handoff", duration: "15 min" },
        ],
      },
    ],
  },
  {
    id: "c5",
    slug: "financial-stewardship",
    title: "Financial Stewardship",
    tagline: "A biblical approach to money, giving, and generosity.",
    description:
      "Practical, Scripture-rooted teaching on budgeting, debt, saving, and cheerful generosity — money viewed as a tool for worship, not anxiety.",
    category: "Practical Living",
    level: "Intermediate",
    icon: Landmark,
    gradient: ["#134e4a", "#0d9488"],
    duration: "4 weeks",
    lessonsCount: 10,
    studentsCount: 132,
    instructor: { name: "Deacon Michael Ige", role: "Finance Committee" },
    outcomes: [
      "Build a budget that reflects your values",
      "Understand biblical generosity and tithing",
      "Make a plan to get out of debt",
    ],
    curriculum: [
      {
        title: "Week 1 — Money & Worship",
        lessons: [
          { title: "Whose Money Is It?", duration: "16 min" },
          { title: "Contentment vs. Consumerism", duration: "18 min" },
        ],
      },
      {
        title: "Week 2 — Practical Tools",
        lessons: [
          { title: "Building a Budget", duration: "20 min" },
          { title: "Getting Out of Debt", duration: "19 min" },
        ],
      },
      {
        title: "Week 3 — Generosity",
        lessons: [
          { title: "The Heart of Giving", duration: "17 min" },
          { title: "Tithing, Rightly Understood", duration: "15 min" },
        ],
      },
    ],
  },
  {
    id: "c6",
    slug: "understanding-the-holy-spirit",
    title: "Understanding the Holy Spirit",
    tagline: "Who He is, how He works, and how to walk in step with Him.",
    description:
      "A clear, Scripture-grounded study of the person and work of the Holy Spirit — His gifts, His fruit, and daily life in the Spirit.",
    category: "Spiritual Growth",
    level: "Intermediate",
    icon: ScrollText,
    gradient: ["#1e3a8a", "#2563eb"],
    duration: "5 weeks",
    lessonsCount: 13,
    studentsCount: 104,
    instructor: { name: "Pastor Grace Adewale", role: "Discipleship Pastor" },
    outcomes: [
      "Explain who the Holy Spirit is and His role in the Trinity",
      "Recognize the fruit of the Spirit growing in your life",
      "Understand spiritual gifts and how to steward yours",
    ],
    curriculum: [
      {
        title: "Week 1 — Who He Is",
        lessons: [
          { title: "The Spirit in the Old Testament", duration: "19 min" },
          { title: "Pentecost and Beyond", duration: "21 min" },
        ],
      },
      {
        title: "Week 2 — The Fruit of the Spirit",
        lessons: [
          { title: "Love, Joy, Peace", duration: "18 min" },
          { title: "Patience Through Faithfulness", duration: "17 min" },
        ],
      },
      {
        title: "Week 3 — The Gifts",
        lessons: [
          { title: "Discovering Your Gifts", duration: "20 min" },
          { title: "Using Gifts in Love", duration: "16 min" },
        ],
      },
    ],
  },
  {
    id: "c7",
    slug: "the-book-of-romans",
    title: "The Book of Romans",
    tagline: "A verse-by-verse journey through Paul's letter to the Romans.",
    description:
      "Deep, unhurried exposition of Romans — sin, righteousness, grace, and the life transformed by the gospel. Best suited for those already grounded in the basics.",
    category: "Bible Study",
    level: "Advanced",
    icon: BookOpen,
    gradient: ["#78350f", "#b45309"],
    duration: "8 weeks",
    lessonsCount: 20,
    studentsCount: 47,
    instructor: { name: "Pastor Opeyemi Peter", role: "Lead Pastor" },
    outcomes: [
      "Trace Paul's argument across all 16 chapters",
      "Understand justification, sanctification, and glorification",
      "Apply Romans 12–16 to everyday Christian living",
    ],
    curriculum: [
      {
        title: "Weeks 1–2 — Righteousness Revealed",
        lessons: [
          { title: "Romans 1–3: The Universal Need", duration: "24 min" },
          { title: "Romans 4–5: Justified by Faith", duration: "23 min" },
        ],
      },
      {
        title: "Weeks 3–4 — Freedom from Sin",
        lessons: [
          { title: "Romans 6–7: Dead to Sin", duration: "22 min" },
          { title: "Romans 8: Life in the Spirit", duration: "25 min" },
        ],
      },
      {
        title: "Weeks 5–8 — Life Transformed",
        lessons: [
          { title: "Romans 9–11: God's Sovereign Plan", duration: "24 min" },
          { title: "Romans 12–16: The Gospel Applied", duration: "26 min" },
        ],
      },
    ],
  },
  {
    id: "c8",
    slug: "parenting-in-the-word",
    title: "Parenting in the Word",
    tagline: "Raising children with grace, truth, and consistency.",
    description:
      "Biblical wisdom for the daily work of parenting — discipline that disciples, conversations about faith, and grace for the seasons that feel messy.",
    category: "Family",
    level: "Beginner",
    icon: Users,
    gradient: ["#581c87", "#7e22ce"],
    duration: "4 weeks",
    lessonsCount: 11,
    studentsCount: 88,
    instructor: { name: "Elder Tunde & Sarah Bakare", role: "Family Life Ministry" },
    outcomes: [
      "Discipline in a way that discipleships rather than just controls",
      "Have natural, ongoing conversations about faith at home",
      "Extend grace to yourself in the messy seasons",
    ],
    curriculum: [
      {
        title: "Week 1 — The Heart of Parenting",
        lessons: [
          { title: "Discipling, Not Just Disciplining", duration: "18 min" },
          { title: "Grace for the Journey", duration: "15 min" },
        ],
      },
      {
        title: "Week 2 — Everyday Faith",
        lessons: [
          { title: "Deuteronomy 6 at the Dinner Table", duration: "17 min" },
          { title: "Answering Hard Questions", duration: "19 min" },
        ],
      },
    ],
  },
];

export function getCourseBySlug(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}

export function getCourseCategories(): string[] {
  return Array.from(new Set(COURSES.map((c) => c.category)));
}
