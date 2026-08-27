import type {
  CategoryTotals,
  CostItemInput,
  MarginStatus,
  PricingInput,
  PricingResult,
} from "./types";
import { calculateCategoryTotals } from "./costItems";

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateBaseCost(totals: CategoryTotals): number {
  return round2(
    totals.FLIGHT +
      totals.ACCOMMODATION +
      totals.TRANSPORTATION +
      totals.ACTIVITY +
      totals.MEAL +
      totals.OTHER,
  );
}

export function calculateBaseCostFromItems(items: CostItemInput[]): number {
  return calculateBaseCost(calculateCategoryTotals(items));
}

export function calculateContingency(baseCost: number, contingencyPercent: number): number {
  return round2(baseCost * (contingencyPercent / 100));
}

export function calculateServiceFee(
  costBeforeFee: number,
  serviceFeeType: "FIXED" | "PERCENTAGE",
  serviceFeeValue: number,
): number {
  if (serviceFeeType === "FIXED") return round2(serviceFeeValue);
  return round2(costBeforeFee * (serviceFeeValue / 100));
}

export function calculateSellingPrice(totalCost: number, markupPercentage: number): number {
  return round2(totalCost * (1 + markupPercentage / 100));
}

export function calculateProfit(sellingPrice: number, totalCost: number): number {
  return round2(sellingPrice - totalCost);
}

export function calculateMargin(profit: number, sellingPrice: number): number {
  if (sellingPrice === 0) return 0;
  return round2((profit / sellingPrice) * 100);
}

export function getMarginStatus(margin: number): MarginStatus {
  if (margin < 0) return "LOSS";
  if (margin < 10) return "LOW_MARGIN";
  if (margin < 20) return "WARNING";
  return "HEALTHY";
}

/**
 * Single entry point for the full pricing waterfall: base cost -> contingency ->
 * service fee -> total cost -> selling price -> profit -> margin.
 * Both the client (instant feedback) and the server (source of truth) call this
 * same function so the numbers can never drift apart.
 */
export function calculatePricing(input: PricingInput): PricingResult {
  const baseCost = round2(input.baseCost);
  const contingencyAmount = calculateContingency(baseCost, input.contingencyPercent);
  const costBeforeFee = round2(baseCost + contingencyAmount);
  const serviceFee = calculateServiceFee(
    costBeforeFee,
    input.serviceFeeType,
    input.serviceFeeValue,
  );
  const totalCost = round2(costBeforeFee + serviceFee);
  const sellingPrice = calculateSellingPrice(totalCost, input.markupPercentage);
  const profit = calculateProfit(sellingPrice, totalCost);
  const margin = calculateMargin(profit, sellingPrice);

  return {
    baseCost,
    contingencyAmount,
    serviceFee,
    totalCost,
    sellingPrice,
    profit,
    margin,
  };
}
