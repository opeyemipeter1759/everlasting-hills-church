export type InventoryStatus = "IN_USE" | "IN_STORAGE" | "UNDER_REPAIR" | "RETIRED";
export type InventoryCondition = "NEW" | "GOOD" | "FAIR" | "POOR";
export type HistoryType = "NEW" | "REPAIR";
export type RepairStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  serialNumber: string | null;
  location: string | null;
  status: InventoryStatus;
  condition: InventoryCondition;
  quantity: number;
  purchaseDate: string | null;
  purchaseValue: number | null;
  assignedTo: string | null;
  photoUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryHistoryEntry {
  id: string;
  itemId: string;
  type: HistoryType;
  description: string | null;
  resolution: string | null;
  cost: number | null;
  performedBy: string | null;
  repairStatus: RepairStatus | null;
  occurredAt: string;
  createdAt: string;
}

export interface InventoryItemDetail extends InventoryItem {
  history: InventoryHistoryEntry[];
  totalSpent: number;
}

export interface InventoryFiltersData {
  categories: string[];
  locations: string[];
}

export interface InventoryStatsData {
  total: number;
  underRepair: number;
  retired: number;
  totalValue: number;
}

export const STATUS_LABEL: Record<InventoryStatus, string> = {
  IN_USE: "In use",
  IN_STORAGE: "In storage",
  UNDER_REPAIR: "Under repair",
  RETIRED: "Retired",
};

export const CONDITION_LABEL: Record<InventoryCondition, string> = {
  NEW: "New",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
};
