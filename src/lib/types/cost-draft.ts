import type { CostCategory } from "@/lib/calculations/types";
import type { CurrencyCode } from "@/lib/currency";

export interface CostItemDraft {
  key: string;
  category: CostCategory;
  description: string;
  supplier: string;
  currency: CurrencyCode;
  unitPrice: number;
  quantity: number;
  participants: number | null;
  days: number | null;
  nights: number | null;
  notes: string;
  costDatabaseItemId: string | null;
}

let counter = 0;
export function createEmptyCostItem(category: CostCategory): CostItemDraft {
  counter += 1;
  return {
    key: `new-${Date.now()}-${counter}`,
    category,
    description: "",
    supplier: "",
    currency: "IDR",
    unitPrice: 0,
    quantity: 1,
    participants: null,
    days: null,
    nights: null,
    notes: "",
    costDatabaseItemId: null,
  };
}
