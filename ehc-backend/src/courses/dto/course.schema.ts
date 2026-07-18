import { z } from 'zod';

const text = (max: number) => z.string().trim().min(1).max(max);

const LessonSchema = z.object({
  title: text(200),
  duration: text(40),
  videoUrl: z.string().trim().max(500).nullish(),
});

const ExamQuestionSchema = z.object({
  question: text(500),
  options: z.array(text(300)).length(4),
  correctIndex: z.number().int().min(0).max(3),
});

/** A module's optional single checkpoint question, gating entry into the next module. */
const ModuleCheckSchema = ExamQuestionSchema.nullish();

const ModuleSchema = z.object({
  title: text(200),
  lessons: z.array(LessonSchema).max(60).default([]),
  check: ModuleCheckSchema,
});

export const CourseInputSchema = z.object({
  title: text(160),
  tagline: text(300),
  description: z.string().trim().max(4000).default(''),
  categoryId: text(80),
  iconKey: text(60),
  gradient: z.tuple([z.string().trim().min(1), z.string().trim().min(1)]),
  duration: text(40),
  instructor: z.object({ name: text(120), role: z.string().trim().max(120).default('') }),
  outcomes: z.array(text(300)).max(20).default([]),
  curriculum: z.array(ModuleSchema).max(30).default([]),
  prerequisiteId: z.string().trim().min(1).nullish(),
  exam: z.array(ExamQuestionSchema).max(50).default([]),
});
export type CourseInput = z.infer<typeof CourseInputSchema>;

export const CourseCategoryInputSchema = z.object({
  name: text(80),
  parentId: z.string().trim().min(1).nullish(),
});
export type CourseCategoryInput = z.infer<typeof CourseCategoryInputSchema>;

export const SubmitExamSchema = z.object({
  answers: z.record(z.string(), z.number().int().min(0)),
});
export type SubmitExamInput = z.infer<typeof SubmitExamSchema>;

export const SubmitModuleCheckSchema = z.object({
  answer: z.number().int().min(0),
});
export type SubmitModuleCheckInput = z.infer<typeof SubmitModuleCheckSchema>;
