export type CostCategory =
  | "FLIGHT"
  | "ACCOMMODATION"
  | "TRANSPORTATION"
  | "ACTIVITY"
  | "MEAL"
  | "OTHER";

export const COST_CATEGORIES: CostCategory[] = [
  "FLIGHT",
  "ACCOMMODATION",
  "TRANSPORTATION",
  "ACTIVITY",
  "MEAL",
  "OTHER",
];

export type ServiceFeeType = "FIXED" | "PERCENTAGE";

export type TravelStyle = "BUDGET" | "STANDARD" | "PREMIUM" | "LUXURY";

/** A single line item used purely for calculation purposes (currency-agnostic; amounts already in base currency). */
export interface CostItemInput {
  category: CostCategory;
  unitPrice: number;
  quantity: number;
  participants?: number | null;
  days?: number | null;
  nights?: number | null;
}

export interface CategoryTotals {
  FLIGHT: number;
  ACCOMMODATION: number;
  TRANSPORTATION: number;
  ACTIVITY: number;
  MEAL: number;
  OTHER: number;
}

export interface PricingInput {
  baseCost: number;
  contingencyPercent: number;
  serviceFeeType: ServiceFeeType;
  serviceFeeValue: number;
  markupPercentage: number;
}

export interface PricingResult {
  baseCost: number;
  contingencyAmount: number;
  serviceFee: number;
  totalCost: number;
  sellingPrice: number;
  profit: number;
  margin: number;
}

export type MarginStatus = "HEALTHY" | "WARNING" | "LOW_MARGIN" | "LOSS";

export interface ScenarioResult {
  style: TravelStyle;
  estimatedCost: number;
  sellingPrice: number;
  profit: number;
  margin: number;
  marginStatus: MarginStatus;
  fitsBudget: boolean | null;
  recommended: boolean;
}
