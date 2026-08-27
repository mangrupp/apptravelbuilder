import type { CostCategory } from "@/lib/calculations/types";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export const CATEGORY_LABELS: Record<CostCategory, string> = {
  FLIGHT: "Flight",
  ACCOMMODATION: "Accommodation",
  TRANSPORTATION: "Transportation",
  ACTIVITY: "Activities",
  MEAL: "Meals",
  OTHER: "Other",
};

export const CATEGORY_UNIT_HINT: Record<CostCategory, string> = {
  FLIGHT: "per ticket",
  ACCOMMODATION: "per room / night",
  TRANSPORTATION: "per unit",
  ACTIVITY: "per person",
  MEAL: "per person / day",
  OTHER: "per unit",
};

export const CURRENCY_OPTIONS = SUPPORTED_CURRENCIES;

export const TRAVEL_STYLE_LABELS: Record<string, string> = {
  BUDGET: "Budget",
  STANDARD: "Standard",
  PREMIUM: "Premium",
  LUXURY: "Luxury",
};

export const MARGIN_STATUS_LABELS: Record<string, string> = {
  HEALTHY: "Healthy",
  WARNING: "Warning",
  LOW_MARGIN: "Low Margin",
  LOSS: "Loss",
};
