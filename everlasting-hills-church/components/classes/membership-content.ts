/** The Membership Class outline as the public page tells it (classes.md, section 6). */
export const MEMBERSHIP_WEEKS = [
  {
    number: 1,
    stage: "Belong",
    focus: "Becoming part of the house",
    title: "Welcome to the House",
    subtitle: "You belong here. Discover who we are and where you fit.",
    lessons: [
      ["Welcome and Orientation", "How the class works and what to expect."],
      ["Introduction to EHC, Vision and Mission", "Our story, our calling, and where God is taking us."],
      ["What It Means to Be Part of the Church", "Salvation and membership in the body of Christ."],
      ["Why Belong to a Church Family", "The bond that holds us together and why no believer should walk alone."],
      ["Home Cell, and Why", "Where church gets personal, and how to join one."],
    ],
  },
  {
    number: 2,
    stage: "Believe",
    focus: "The truths we stand on",
    title: "What We Believe",
    subtitle: "The truths we stand on.",
    lessons: [
      ["Who Really Is Jesus?", "The person of Christ and the Trinity, clearly explained."],
      ["The Holy Spirit as Lord", "Knowing Him as a person, not just a power."],
      ["Fruit of the Spirit", "The character God grows in us."],
      ["Gifts of the Spirit", "The grace God gives through us."],
      ["Basic Biblical Doctrine", "A summary of what EHC believes."],
    ],
  },
  {
    number: 3,
    stage: "Walk",
    focus: "Living it out daily",
    title: "How We Walk",
    subtitle: "Faith lived out, every day.",
    lessons: [
      ["Prayer", "Building a life of communion with God."],
      ["Personal and Daily Devotion", "Meeting God in His Word daily."],
      ["Love Walk", "How we treat one another as family."],
      ["Welfare", "How we care for one another in need."],
      ["Living With Purpose in Mind", "Discovering why God placed you here."],
    ],
  },
  {
    number: 4,
    stage: "Go",
    focus: "Order, honor and mission",
    title: "Order and Mission",
    subtitle: "Honoring the house and reaching the world.",
    lessons: [
      ["Church Service Conduct", "How we behave in the house of God (1 Timothy 3:14-15)."],
      ["Spiritual Leadership and Honor", "Knowing and honoring those who watch over your soul."],
      ["Shining Light", "Living as light in your world."],
      ["How to Evangelize", "Sharing your faith simply and confidently."],
      ["What Next", "Your path forward at EHC, plus the class conclusion."],
    ],
  },
] as const;

export const CLASS_PATHWAY = [
  { title: "Believers Class", line: "The essentials every believer should know" },
  { title: "Membership Class", line: "Belonging to the EHC family", here: true },
  { title: "Discipleship Class", line: "Growing as a disciple who makes disciples" },
  { title: "Foundation School", line: "Training for workers, including the culture of the house" },
] as const;

/**
 * One anchor verse per week, set on the class home (KJV). Keyed by class slug, then week number.
 * The pastors may change these; a class with none simply shows no verse.
 */
export const WEEK_VERSES: Record<string, Record<number, { ref: string; text: string }>> = {
  membership: {
    1: { ref: "Psalm 92:13", text: "Those that be planted in the house of the LORD shall flourish in the courts of our God." },
    2: { ref: "John 20:31", text: "But these are written, that ye might believe that Jesus is the Christ, the Son of God; and that believing ye might have life through his name." },
    3: { ref: "Colossians 2:6", text: "As ye have therefore received Christ Jesus the Lord, so walk ye in him." },
    4: { ref: "Matthew 28:19", text: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost." },
  },
};
