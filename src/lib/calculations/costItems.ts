import type { CostItemInput, CategoryTotals } from "./types";

/**
 * All per-category formulas funnel through here so the "how a category is priced"
 * decision lives in exactly one place.
 */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateFlightCost(item: CostItemInput): number {
  return round2(item.unitPrice * item.quantity);
}

export function calculateAccommodationCost(item: CostItemInput): number {
  const nights = item.nights ?? 1;
  return round2(item.unitPrice * item.quantity * nights);
}

export function calculateTransportationCost(item: CostItemInput): number {
  return round2(item.unitPrice * item.quantity);
}

export function calculateActivityCost(item: CostItemInput): number {
  const participants = item.participants ?? item.quantity;
  return round2(item.unitPrice * participants);
}

export function calculateMealCost(item: CostItemInput): number {
  const participants = item.participants ?? item.quantity;
  const days = item.days ?? 1;
  return round2(item.unitPrice * participants * days);
}

export function calculateOtherCost(item: CostItemInput): number {
  return round2(item.unitPrice * item.quantity);
}

export function calculateItemTotal(item: CostItemInput): number {
  switch (item.category) {
    case "FLIGHT":
      return calculateFlightCost(item);
    case "ACCOMMODATION":
      return calculateAccommodationCost(item);
    case "TRANSPORTATION":
      return calculateTransportationCost(item);
    case "ACTIVITY":
      return calculateActivityCost(item);
    case "MEAL":
      return calculateMealCost(item);
    case "OTHER":
      return calculateOtherCost(item);
  }
}

export function calculateCategoryTotals(items: CostItemInput[]): CategoryTotals {
  const totals: CategoryTotals = {
    FLIGHT: 0,
    ACCOMMODATION: 0,
    TRANSPORTATION: 0,
    ACTIVITY: 0,
    MEAL: 0,
    OTHER: 0,
  };

  for (const item of items) {
    totals[item.category] = round2(totals[item.category] + calculateItemTotal(item));
  }

  return totals;
}
