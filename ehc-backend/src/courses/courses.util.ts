import { Prisma } from '@prisma/client';

export const courseListInclude = {
  Prerequisite: { select: { slug: true, title: true } },
  CategoryRef: { include: { Parent: { select: { id: true, name: true } } } },
  Modules: { select: { Lessons: { select: { id: true } } } },
  ExamQuestions: { select: { id: true } },
  _count: { select: { Enrollments: true } },
} satisfies Prisma.CourseInclude;

export type CourseWithCounts = Prisma.CourseGetPayload<{ include: typeof courseListInclude }>;

export function toCategoryShape(cat: CourseWithCounts['CategoryRef']) {
  if (!cat) return { id: '', name: 'Uncategorized', parentId: null as string | null, parentName: null as string | null };
  return { id: cat.id, name: cat.name, parentId: cat.parentId, parentName: cat.Parent?.name ?? null };
}

export function toListItem(c: CourseWithCounts) {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    tagline: c.tagline,
    category: toCategoryShape(c.CategoryRef),
    iconKey: c.iconKey,
    gradient: [c.gradientFrom, c.gradientTo] as [string, string],
    duration: c.duration,
    instructor: { name: c.instructorName, role: c.instructorRole },
    lessonsCount: c.Modules.reduce((n, m) => n + m.Lessons.length, 0),
    studentsCount: c._count.Enrollments,
    examQuestionCount: c.ExamQuestions.length,
    prerequisiteId: c.prerequisiteId,
    prerequisiteSlug: c.Prerequisite?.slug ?? null,
  };
}
