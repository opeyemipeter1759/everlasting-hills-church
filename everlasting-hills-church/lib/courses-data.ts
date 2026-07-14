import {
  BookOpen,
  Compass,
  Cross,
  Flame,
  Globe,
  GraduationCap,
  Heart,
  Landmark,
  Music,
  ScrollText,
  Shield,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";

// Courses are admin-authored (see /dashboard/admin/courses), so an icon can't be
// picked freely — components can't survive JSON/localStorage. Admins instead choose
// a key from this fixed palette, resolved back to a component at read time.
export const ICON_OPTIONS: Record<string, LucideIcon> = {
  Cross,
  Flame,
  Heart,
  Landmark,
  ScrollText,
  Shield,
  Users,
  BookOpen,
  GraduationCap,
  Compass,
  Sparkles,
  Star,
  Globe,
  Music,
};

export const GRADIENT_PRESETS: [string, string][] = [
  ["#4a0819", "#87102C"],
  ["#7c2d12", "#c2410c"],
  ["#831843", "#be185d"],
  ["#312e81", "#4f46e5"],
  ["#134e4a", "#0d9488"],
  ["#1e3a8a", "#2563eb"],
  ["#78350f", "#b45309"],
  ["#581c87", "#7e22ce"],
];

export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

export interface CourseLesson {
  title: string;
  duration: string;
  /** YouTube link for this lesson's video — set by admins in /dashboard/admin/courses. */
  videoUrl?: string;
}

export interface CourseModule {
  title: string;
  lessons: CourseLesson[];
}

export interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
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
  /** Slug of the course that must be passed (100% on the exam) before this one unlocks. */
  prerequisiteSlug: string | null;
  /** Set by admins in /dashboard/admin/courses — a perfect score marks the course complete. */
  exam: ExamQuestion[];
}

// Frontend-only mock catalog — swap for a real `/courses` API once the backend ships.
// Admin edits to `prerequisiteSlug`/`exam` are layered on top by lib/courses-catalog.ts.
export const SEED_COURSES: Course[] = [
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
    prerequisiteSlug: null,
    exam: [
      {
        id: "c1q1",
        question: "According to the course, what is the foundation beneath everything we do?",
        options: ["Church tradition", "The Word of God", "Personal experience", "Denominational rules"],
        correctIndex: 1,
      },
      {
        id: "c1q2",
        question: "What are the two spiritual disciplines emphasized in Week 3?",
        options: [
          "Fasting and tithing",
          "Prayer and reading Scripture",
          "Serving and singing",
          "Journaling and solitude",
        ],
        correctIndex: 1,
      },
      {
        id: "c1q3",
        question: "What does the course say church membership means?",
        options: [
          "Attending occasionally",
          "Just belonging on paper",
          "Genuinely belonging to a family, not just attending",
          "A financial commitment",
        ],
        correctIndex: 2,
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
    prerequisiteSlug: "foundations-of-faith",
    exam: [
      {
        id: "c2q1",
        question: "The course describes prayer primarily as:",
        options: ["A religious duty", "A relationship", "A last resort", "A performance"],
        correctIndex: 1,
      },
      {
        id: "c2q2",
        question: "What model prayer is studied line by line in Week 2?",
        options: ["The Prayer of Jabez", "The Lord's Prayer", "Psalm 23", "The Aaronic Blessing"],
        correctIndex: 1,
      },
      {
        id: "c2q3",
        question: "What does Week 3 focus on sustaining?",
        options: [
          "Prayer through busy seasons",
          "Fasting habits",
          "Memorizing verses",
          "Church attendance",
        ],
        correctIndex: 0,
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
    prerequisiteSlug: null,
    exam: [
      {
        id: "c3q1",
        question: "The course frames marriage as:",
        options: ["A contract", "A covenant", "A partnership of convenience", "A social custom"],
        correctIndex: 1,
      },
      {
        id: "c3q2",
        question: "Week 2's communication principle is 'speaking the truth in ___'.",
        options: ["Anger", "Silence", "Love", "Public"],
        correctIndex: 2,
      },
      {
        id: "c3q3",
        question: "What does Week 3 say about roles in marriage?",
        options: [
          "They don't matter",
          "Leadership and submission, rightly understood",
          "Only the husband leads, no exceptions",
          "Roles are culturally irrelevant today",
        ],
        correctIndex: 1,
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
    prerequisiteSlug: "foundations-of-faith",
    exam: [
      {
        id: "c4q1",
        question: "Week 1 uses what image of Jesus to illustrate servant leadership?",
        options: ["The towel and basin", "The empty tomb", "The fishing boat", "The temple courts"],
        correctIndex: 0,
      },
      {
        id: "c4q2",
        question: "What does the course say leadership should be built on first?",
        options: ["Competence", "Popularity", "Character", "Tenure"],
        correctIndex: 2,
      },
      {
        id: "c4q3",
        question: "Week 3 is about:",
        options: ["Multiplying leaders", "Managing budgets", "Public speaking", "Event planning"],
        correctIndex: 0,
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
    prerequisiteSlug: null,
    exam: [
      {
        id: "c5q1",
        question: "The course's central claim about money is that it belongs to:",
        options: ["The government", "God", "The bank", "No one"],
        correctIndex: 1,
      },
      {
        id: "c5q2",
        question: "Week 2 gives practical tools for building what?",
        options: ["A budget", "A business", "A portfolio", "A pension"],
        correctIndex: 0,
      },
      {
        id: "c5q3",
        question: "Week 3 focuses on:",
        options: ["Investing", "Generosity", "Insurance", "Taxes"],
        correctIndex: 1,
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
    prerequisiteSlug: "the-prayer-life",
    exam: [
      {
        id: "c6q1",
        question: "Week 1 traces the Spirit's presence starting from:",
        options: ["The New Testament only", "The Old Testament", "Church history", "The Reformation"],
        correctIndex: 1,
      },
      {
        id: "c6q2",
        question: "Week 2 studies the fruit of the Spirit, which begins with:",
        options: ["Patience, kindness, joy", "Love, joy, peace", "Faith, hope, love", "Wisdom, knowledge, power"],
        correctIndex: 1,
      },
      {
        id: "c6q3",
        question: "According to Week 3, spiritual gifts should be used:",
        options: ["For personal status", "In love", "Only by leaders", "Privately, never publicly"],
        correctIndex: 1,
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
    prerequisiteSlug: "understanding-the-holy-spirit",
    exam: [
      {
        id: "c7q1",
        question: "Romans 1–3 establishes what universal need?",
        options: ["The need for community", "The need for righteousness", "The need for leadership", "The need for law"],
        correctIndex: 1,
      },
      {
        id: "c7q2",
        question: "Romans 8 is described as life in the:",
        options: ["Law", "Flesh", "Spirit", "Past"],
        correctIndex: 2,
      },
      {
        id: "c7q3",
        question: "Romans 12–16 is applied to:",
        options: ["Church history", "Everyday Christian living", "Old Testament law", "Roman politics only"],
        correctIndex: 1,
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
    prerequisiteSlug: "marriage-by-design",
    exam: [
      {
        id: "c8q1",
        question: "The course says discipline should:",
        options: ["Only control behavior", "Disciple, not just control", "Be avoided entirely", "Be left to schools"],
        correctIndex: 1,
      },
      {
        id: "c8q2",
        question: "Which Old Testament passage anchors Week 2's 'everyday faith' teaching?",
        options: ["Psalm 23", "Deuteronomy 6", "Proverbs 31", "Genesis 1"],
        correctIndex: 1,
      },
      {
        id: "c8q3",
        question: "The course encourages parents to extend grace:",
        options: ["Never", "Only to their children", "To themselves, in messy seasons", "Only after perfection"],
        correctIndex: 2,
      },
    ],
  },
];
