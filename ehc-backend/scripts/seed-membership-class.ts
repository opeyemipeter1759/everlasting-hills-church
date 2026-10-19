/**
 * Creates the Membership Class: the course, its four weeks and twenty lessons.
 *
 *   npx ts-node --transpile-only scripts/seed-membership-class.ts --dry-run
 *   npx ts-node --transpile-only scripts/seed-membership-class.ts
 *
 * Safe to run again. Missing weeks and lessons are added; anything that already
 * exists is left alone, so edits made in the admin content editor (videos,
 * quizzes, summaries) are never overwritten. Only the class flags on the course
 * itself are kept in line with this file.
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';

interface LessonSeed {
  slug: string;
  title: string;
  description: string;
  reflection: string;
  scriptures: string[];
}

interface WeekSeed {
  title: string;
  subtitle: string;
  stage: string;
  lessons: LessonSeed[];
}

const WEEKS: WeekSeed[] = [
  {
    title: 'Welcome to the House',
    subtitle: 'You belong here. Discover who we are and where you fit.',
    stage: 'Belong',
    lessons: [
      {
        slug: 'welcome-and-orientation',
        title: 'Welcome and Orientation',
        description: 'How the class works and what to expect.',
        reflection: 'What made you decide to take this class, and what do you hope to receive from it?',
        scriptures: ['Genesis 49:26', 'Psalm 92:13'],
      },
      {
        slug: 'vision-and-mission',
        title: 'Introduction to EHC, Vision and Mission',
        description: 'Our story, our calling, and where God is taking us.',
        reflection: 'Which part of the EHC vision speaks to you most, and why?',
        scriptures: ['Habakkuk 2:2-3', 'Proverbs 29:18'],
      },
      {
        slug: 'part-of-the-church',
        title: 'What It Means to Be Part of the Church',
        description: 'Salvation and membership in the body of Christ.',
        reflection: 'How would you explain, in your own words, how you became part of the body of Christ?',
        scriptures: ['1 Corinthians 12:12-13', 'Ephesians 2:19-22'],
      },
      {
        slug: 'why-belong',
        title: 'Why Belong to a Church Family',
        description: 'The bond that holds us together and why no believer should walk alone.',
        reflection: 'Where in your life have you been trying to walk alone?',
        scriptures: ['Hebrews 10:24-25', 'Acts 2:42-47'],
      },
      {
        slug: 'home-cell',
        title: 'Home Cell, and Why',
        description: 'Where church gets personal, and how to join one.',
        reflection: 'What would make it easy for you to open up in a small group?',
        scriptures: ['Acts 5:42', 'Acts 20:20'],
      },
    ],
  },
  {
    title: 'What We Believe',
    subtitle: 'The truths we stand on.',
    stage: 'Believe',
    lessons: [
      {
        slug: 'who-is-jesus',
        title: 'Who Really Is Jesus?',
        description: 'The person of Christ and the Trinity, clearly explained.',
        reflection: 'Who is Jesus to you today, not just in doctrine but in your daily life?',
        scriptures: ['John 1:1-14', 'Colossians 1:15-20', 'Matthew 28:19'],
      },
      {
        slug: 'holy-spirit-as-lord',
        title: 'The Holy Spirit as Lord',
        description: 'Knowing Him as a person, not just a power.',
        reflection: 'How have you related to the Holy Spirit until now: as a person or as a power?',
        scriptures: ['John 14:16-17', '2 Corinthians 3:17', 'Acts 13:2'],
      },
      {
        slug: 'fruit-of-the-spirit',
        title: 'Fruit of the Spirit',
        description: 'The character God grows in us.',
        reflection: 'Which fruit of the Spirit do you most want God to grow in you right now?',
        scriptures: ['Galatians 5:22-23', 'John 15:4-5'],
      },
      {
        slug: 'gifts-of-the-spirit',
        title: 'Gifts of the Spirit',
        description: 'The grace God gives through us.',
        reflection: 'What gifts have others noticed in you, even ones you are unsure about?',
        scriptures: ['1 Corinthians 12:4-11', 'Romans 12:6-8', '1 Peter 4:10'],
      },
      {
        slug: 'basic-doctrine',
        title: 'Basic Biblical Doctrine',
        description: 'A summary of what EHC believes.',
        reflection: 'Which of these truths would you like to understand more deeply?',
        scriptures: ['2 Timothy 3:16-17', 'Jude 1:3'],
      },
    ],
  },
  {
    title: 'How We Walk',
    subtitle: 'Faith lived out, every day.',
    stage: 'Walk',
    lessons: [
      {
        slug: 'prayer',
        title: 'Prayer',
        description: 'Building a life of communion with God.',
        reflection: 'What usually gets in the way of your prayer life?',
        scriptures: ['Matthew 6:5-13', 'Luke 18:1', '1 Thessalonians 5:17'],
      },
      {
        slug: 'daily-devotion',
        title: 'Personal and Daily Devotion',
        description: 'Meeting God in His Word daily.',
        reflection: 'What has God said to you through His Word recently?',
        scriptures: ['Psalm 119:105', 'Joshua 1:8', 'Mark 1:35'],
      },
      {
        slug: 'love-walk',
        title: 'Love Walk',
        description: 'How we treat one another as family.',
        reflection: 'Is there anyone you need to forgive or make peace with?',
        scriptures: ['1 Corinthians 13:4-7', 'John 13:34-35', '1 John 4:20-21'],
      },
      {
        slug: 'welfare',
        title: 'Welfare',
        description: 'How we care for one another in need.',
        reflection: 'How can you be part of how this house cares for its own?',
        scriptures: ['Galatians 6:2', 'Galatians 6:10', 'Acts 4:32-35'],
      },
      {
        slug: 'living-with-purpose',
        title: 'Living With Purpose in Mind',
        description: 'Discovering why God placed you here.',
        reflection: 'What do you sense God has placed you on earth to do?',
        scriptures: ['Jeremiah 29:11', 'Ephesians 2:10', 'Ecclesiastes 12:13'],
      },
    ],
  },
  {
    title: 'Order and Mission',
    subtitle: 'Honoring the house and reaching the world.',
    stage: 'Go',
    lessons: [
      {
        slug: 'church-service-conduct',
        title: 'Church Service Conduct',
        description: 'How we behave in the house of God.',
        reflection: 'What does honouring the presence of God look like for you on a Sunday?',
        scriptures: ['1 Timothy 3:14-15', 'Psalm 100:4', 'Ecclesiastes 5:1'],
      },
      {
        slug: 'leadership-and-honor',
        title: 'Spiritual Leadership and Honor',
        description: 'Knowing and honoring those who watch over your soul.',
        reflection: 'How do you show honour to spiritual leaders in practical ways?',
        scriptures: ['Hebrews 13:17', '1 Thessalonians 5:12-13', '1 Timothy 5:17'],
      },
      {
        slug: 'shining-light',
        title: 'Shining Light',
        description: 'Living as light in your world.',
        reflection: 'Where is God asking you to shine more brightly: home, work or school?',
        scriptures: ['Matthew 5:14-16', 'Philippians 2:15'],
      },
      {
        slug: 'how-to-evangelize',
        title: 'How to Evangelize',
        description: 'Sharing your faith simply and confidently.',
        reflection: 'Who is one person you would love to see come to Christ?',
        scriptures: ['Matthew 28:18-20', 'Romans 10:14-15', '1 Peter 3:15'],
      },
      {
        slug: 'what-next',
        title: 'What Next',
        description: 'Your path forward at EHC, plus the class conclusion.',
        reflection: 'What is your next step at EHC after this class?',
        scriptures: ['Psalm 92:12-14', 'Philippians 3:13-14'],
      },
    ],
  },
];

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const tenantId = process.env.DEFAULT_TENANT_ID;
  if (!tenantId) throw new Error('DEFAULT_TENANT_ID is not set');
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.course.findUnique({ where: { tenantId_slug: { tenantId, slug: 'membership' } } });
    console.log(existing ? `Course "membership" exists (${existing.id})` : 'Course "membership" will be created');
    if (dryRun) {
      console.log(`Dry run: ${WEEKS.length} weeks, ${WEEKS.reduce((n, w) => n + w.lessons.length, 0)} lessons in the file.`);
      return;
    }

    const classFlags = { isClass: true, eligibilitySundays: 4, grantsMembership: true, requiresFullMembership: false };
    const course = existing
      ? await prisma.course.update({ where: { id: existing.id }, data: classFlags })
      : await prisma.course.create({
          data: {
            id: randomUUID(),
            tenantId,
            slug: 'membership',
            title: 'Membership Class',
            tagline: 'Belong. Believe. Walk. Go.',
            description: 'A four-week journey into the life, faith and family of Everlasting Hills Church.',
            iconKey: 'users',
            gradientFrom: '#87102C',
            gradientTo: '#4a0819',
            duration: '4 weeks',
            instructorName: 'EHC Pastoral Team',
            instructorRole: 'Facilitators',
            outcomes: [
              'A clear picture of who EHC is and where we are going',
              'A firm grasp of the core truths we stand on',
              'Practical habits for your walk with God',
              'Real connection through a Home Cell and the church family',
              'A clear next step for your growth and service',
            ],
            ...classFlags,
          },
        });

    let addedWeeks = 0;
    let addedLessons = 0;
    for (const [wi, week] of WEEKS.entries()) {
      let mod = await prisma.courseModule.findFirst({ where: { courseId: course.id, sortOrder: wi } });
      if (!mod) {
        mod = await prisma.courseModule.create({
          data: { id: randomUUID(), tenantId, courseId: course.id, title: week.title, subtitle: week.subtitle, stage: week.stage, sortOrder: wi },
        });
        addedWeeks++;
      }
      for (const [li, lesson] of week.lessons.entries()) {
        const found = await prisma.courseLesson.findFirst({ where: { moduleId: mod.id, slug: lesson.slug } });
        if (found) continue;
        await prisma.courseLesson.create({
          data: {
            id: randomUUID(),
            tenantId,
            moduleId: mod.id,
            title: lesson.title,
            slug: lesson.slug,
            description: lesson.description,
            duration: '10 min',
            sortOrder: li,
            reflectionPrompt: lesson.reflection,
            scriptures: lesson.scriptures.map((ref) => ({ ref })),
          },
        });
        addedLessons++;
      }
    }
    console.log(`Membership Class ready: ${addedWeeks} week(s) and ${addedLessons} lesson(s) added.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
