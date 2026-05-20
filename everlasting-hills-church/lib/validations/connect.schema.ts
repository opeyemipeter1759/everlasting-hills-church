import { z } from "zod";

export const firstTimerSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  gender: z.string().optional(),
  how_did_you_learn: z.string().optional(),
  invited_by: z.string().optional(),
  located_in_ibadan: z.boolean().optional(),
  membership_interest: z.string().optional(),
  address: z.string().optional(),
  date_of_birth: z.string().optional(),
  occupation: z.string().optional(),
  born_again: z.string().optional(),
  service_experience: z.string().optional(),
  prayer_point: z.string().optional(),
  whatsapp_interest: z.boolean().optional(),
});

export const prayerRequestSchema = z.object({
  request: z.string().min(1, "Prayer request is required").max(3000),
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  is_anonymous: z.boolean().optional(),
});

export const testimonySchema = z.object({
  name: z.string().optional(),
  phone_number: z.string().optional(),
  content: z.string().min(1, "Testimony content is required").max(5000),
  share_physically: z.string().optional(),
});

export type FirstTimerData = z.infer<typeof firstTimerSchema>;
export type PrayerRequestData = z.infer<typeof prayerRequestSchema>;
export type TestimonyData = z.infer<typeof testimonySchema>;
