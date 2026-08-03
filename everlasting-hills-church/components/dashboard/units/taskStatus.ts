import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import type { UnitTaskStatus } from "@/types";

export const STATUS_LABEL: Record<UnitTaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export const STATUS_ICON: Record<UnitTaskStatus, typeof Circle> = {
  TODO: Circle,
  IN_PROGRESS: CircleDot,
  DONE: CheckCircle2,
};

export function nextStatus(current: UnitTaskStatus): UnitTaskStatus {
  return current === "TODO" ? "IN_PROGRESS" : current === "IN_PROGRESS" ? "DONE" : "TODO";
}
