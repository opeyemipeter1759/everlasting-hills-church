import { z } from "zod";

export const URGENCY_OPTIONS = [
  { value: "LOW", label: "Not urgent, within a few weeks is fine" },
  { value: "MEDIUM", label: "Somewhat urgent, within the next week" },
  { value: "HIGH", label: "Very urgent, needed right away" },
] as const;

export const stepOneSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(120, "That name is too long"),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number")
    .max(40, "That number is too long")
    .regex(/^[\d\s\-+()]+$/, "Please enter a valid phone number"),
  email: z.string().trim().min(1, "Please enter your email address").email("Please enter a valid email address"),
  isWorkerInChurch: z.enum(["YES", "NO"], { error: "Please let us know if you serve in a unit or department" }),
  address: z.string().trim().min(2, "Please enter your address").max(300, "That's a bit long, please keep it brief"),
  attendanceLength: z
    .string()
    .trim()
    .min(1, "Please let us know how long you've been attending")
    .max(120, "That's a bit long, please keep it brief"),
});

export const stepTwoSchema = z.object({
  occupation: z.string().trim().min(1, "Please let us know what you do for a living").max(120, "That's a bit long, please keep it brief"),
  category: z.string().trim().min(2, "Please let us know what you need help with").max(200, "That's a bit long, please keep it brief"),
  description: z
    .string()
    .trim()
    .min(10, "Please share a little more detail, even just a sentence or two")
    .max(3000, "That's a lot, please keep it under 3000 characters"),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH"], {
    error: "Please let us know how urgent this is",
  }),
});

export const stepThreeSchema = z.object({
  consent: z.boolean().refine((v) => v === true, { message: "Please confirm before submitting" }),
});

export type StepOneValues = z.infer<typeof stepOneSchema>;
export type StepTwoValues = z.infer<typeof stepTwoSchema>;
export type StepThreeValues = z.infer<typeof stepThreeSchema>;
export type WelfareFormValues = StepOneValues & StepTwoValues & StepThreeValues;

export const WELFARE_FORM_DEFAULTS: WelfareFormValues = {
  fullName: "",
  phone: "",
  email: "",
  isWorkerInChurch: "" as WelfareFormValues["isWorkerInChurch"],
  address: "",
  attendanceLength: "",
  occupation: "",
  category: "",
  description: "",
  urgency: "" as WelfareFormValues["urgency"],
  consent: false,
};

export function urgencyShortLabel(value: string): string {
  return { LOW: "Not urgent", MEDIUM: "Somewhat urgent", HIGH: "Very urgent" }[value] ?? value;
}
