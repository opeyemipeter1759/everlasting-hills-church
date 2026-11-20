/**
 * The eight proposed curriculum modules, seeded as PROPOSED for each church
 * that has none. Pastors edit and approve them; the public page labels them
 * "proposed" until then.
 */
export const PROPOSED_MODULES: {
  title: string;
  description: string;
  scriptureRefs: string[];
  objectives: string[];
}[] = [
  {
    title: "God's Design for Marriage",
    description:
      "What marriage is in God's eyes: a covenant, not a contract, and why that changes how a couple lives.",
    scriptureRefs: ['Genesis 2:18-25', 'Matthew 19:4-6', 'Ephesians 5:31-32'],
    objectives: [
      'Understand marriage as a covenant before God',
      'Talk honestly about why you are marrying',
    ],
  },
  {
    title: 'Spiritual Unity',
    description:
      'Building a shared life of faith: praying together, worshipping together and growing in Christ side by side.',
    scriptureRefs: ['Ecclesiastes 4:9-12', 'Amos 3:3', '1 Peter 3:7'],
    objectives: [
      'Agree on simple spiritual habits as a couple',
      'Share where each of you is in your walk with God',
    ],
  },
  {
    title: 'Communication & Conflict Resolution',
    description:
      'Listening well, speaking the truth in love, and handling disagreements without wounding each other.',
    scriptureRefs: ['Ephesians 4:26-32', 'James 1:19', 'Proverbs 15:1'],
    objectives: [
      'Practise listening before answering',
      'Agree how you will handle a disagreement',
    ],
  },
  {
    title: 'Character & Emotional Maturity',
    description:
      'Growing in patience, kindness and self-control, and bringing your history and habits into the open.',
    scriptureRefs: [
      'Galatians 5:22-23',
      '1 Corinthians 13:4-7',
      'Colossians 3:12-14',
    ],
    objectives: [
      'Recognise the patterns you each bring into marriage',
      'Name one area each of you will grow in',
    ],
  },
  {
    title: 'Finances & Stewardship',
    description:
      'Money as a shared responsibility: budgeting, giving, saving and deciding together.',
    scriptureRefs: ['Proverbs 21:5', 'Luke 14:28', '1 Timothy 6:6-10'],
    objectives: [
      'Share your current finances openly',
      'Draft a first household budget together',
    ],
  },
  {
    title: 'Intimacy & Sexuality',
    description:
      "God's good gift of intimacy within marriage, expectations, and honouring each other.",
    scriptureRefs: [
      'Song of Songs 2:16',
      '1 Corinthians 7:3-5',
      'Hebrews 13:4',
    ],
    objectives: [
      'Talk about expectations with respect',
      'Understand intimacy as giving, not taking',
    ],
  },
  {
    title: 'Family & Relationships',
    description:
      'Leaving and cleaving: in-laws, extended family, friendships and setting healthy boundaries.',
    scriptureRefs: ['Genesis 2:24', 'Exodus 20:12', 'Psalm 127:3-5'],
    objectives: [
      'Agree how you will relate to both families',
      'Discuss your hopes about children',
    ],
  },
  {
    title: 'Building a Flourishing Home',
    description:
      'Roles, routines and rhythms that make a home where God is honoured and both of you can thrive.',
    scriptureRefs: ['Psalm 127:1', 'Proverbs 24:3-4', 'Joshua 24:15'],
    objectives: [
      'Agree the kind of home you want to build',
      'Plan your first year of married life',
    ],
  },
];
