import { z } from 'zod';

const text = (max: number) => z.string().trim().min(1).max(max);

export const CreateDepartmentSchema = z.object({
  code: z.string().trim().min(2).max(12).toUpperCase(),
  name: text(120),
  description: z.string().trim().max(600).nullish(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});
export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;

export const UpdateDepartmentSchema = z.object({
  name: text(120).optional(),
  description: z.string().trim().max(600).nullish(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>;

export const AssignHeadSchema = z.object({
  profileId: z.string().trim().min(1),
});
export type AssignHeadInput = z.infer<typeof AssignHeadSchema>;

export const AssignUnitsSchema = z.object({
  unitIds: z.array(z.string().trim().min(1)).min(1).max(100),
});
export type AssignUnitsInput = z.infer<typeof AssignUnitsSchema>;

export const DeptAnnouncementSchema = z.object({
  departmentId: z.string().trim().min(1).optional(), // required on the /mine route
  title: text(160),
  body: text(4000),
});
export type DeptAnnouncementInput = z.infer<typeof DeptAnnouncementSchema>;

export const NudgeSchema = z.object({
  message: z.string().trim().max(500).nullish(),
});
export type NudgeInput = z.infer<typeof NudgeSchema>;
