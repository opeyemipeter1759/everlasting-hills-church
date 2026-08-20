"use client";

import { useParams } from "next/navigation";
import UnitExpensesClient from "@/components/dashboard/unit-lead/UnitExpensesClient";

export default function UnitExpensesPage() {
  const { unitId } = useParams<{ unitId: string }>();
  return <UnitExpensesClient unitId={unitId} />;
}
