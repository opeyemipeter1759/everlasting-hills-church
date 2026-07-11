import type { PersonRole } from "@/lib/api/people";

export interface Row {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: "" | "MALE" | "FEMALE";
  role: PersonRole;
}

export function emptyRow(role: PersonRole): Row {
  return { firstName: "", lastName: "", email: "", phone: "", gender: "", role };
}
