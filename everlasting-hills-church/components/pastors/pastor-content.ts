import { BookOpen, Heart, Sprout, type LucideIcon } from "lucide-react";

export interface Pastor {
  id: string;
  name: string;
  role: string;
  photo: string | null;
  quote: string;
  scripture: string;
  scriptureText: string;
  bio: string[];
  email: string;
  instagram: string;
}

export const PASTORS: Pastor[] = [
  {
    id: "lead-pastor",
    name: "Pastor [Lead Name]",
    role: "Lead Pastor",
    photo: null,
    quote:
      "Our one ambition is that every person who walks through these doors would meet the living God and discover the inheritance He has prepared for them.",
    scripture: "Genesis 49:26",
    scriptureText: "The blessings of your father have surpassed the blessings of my ancestors…",
    bio: [
      "Pastor [Lead Name] leads Everlasting Hills Church with a deep passion for the word of God and a fatherly heart for people. For over [X] years he has given himself to teaching, discipleship, and raising leaders across Ibadan and beyond.",
      "Known for clear, life-applicable teaching, he carries a burden to see believers rooted, fruitful, and sent into every sphere of society — the same blessing spoken over Joseph in Genesis 49.",
      "He is married to [Spouse Name], and together they give themselves to the care of the church family and the next generation.",
    ],
    email: "",
    instagram: "",
  },
  {
    id: "associate-pastor",
    name: "Pastor [Associate Name]",
    role: "Associate Pastor",
    photo: null,
    quote:
      "Every believer carries heaven's assignment. My joy is helping people discover theirs and walk in it with confidence.",
    scripture: "Ephesians 4:12",
    scriptureText: "…to equip his people for works of service, so that the body of Christ may be built up.",
    bio: [
      "Pastor [Associate Name] serves alongside the lead pastor with a heart for pastoral care, discipleship, and the practical flourishing of every member of the EHC family.",
      "With a gifting in teaching and a love for people, they help build the infrastructure of community and care that allows the church to grow in depth as well as numbers.",
      "They are married to [Spouse Name], and together they are passionate about family, mentorship, and seeing the next generation planted in the house of God.",
    ],
    email: "",
    instagram: "",
  },
];

export const VALUES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: BookOpen, title: "Rooted in the Word", text: "Clear, practical teaching that helps every believer grow deep and live it out." },
  { icon: Heart, title: "A shepherd's heart", text: "Care for every member — in seasons of joy, in seasons of need, and everything between." },
  { icon: Sprout, title: "Raising the next generation", text: "Mentoring leaders and planting young people firmly in the house of God." },
];
