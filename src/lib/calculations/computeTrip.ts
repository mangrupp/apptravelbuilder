import { calculateItemTotal, calculateCategoryTotals } from "@/lib/calculations/costItems";
import { calculateBaseCost, calculatePricing } from "@/lib/calculations/pricing";
import { convertToIDR, type CurrencyCode, type CurrencyRates } from "@/lib/currency";
import type { CostCategory, PricingResult } from "@/lib/calculations/types";

export interface ComputableCostItem {
  category: CostCategory;
  currency: CurrencyCode;
  unitPrice: number;
  quantity: number;
  participants?: number | null;
  days?: number | null;
  nights?: number | null;
}

export interface ComputedCostItem<T extends ComputableCostItem> {
  item: T;
  total: number;
  baseAmountIDR: number;
  exchangeRate: number;
}

export interface TripPricingConfig {
  contingencyPercent: number;
  serviceFeeType: "FIXED" | "PERCENTAGE";
  serviceFeeValue: number;
  markupPercentage: number;
}

export interface ComputedTripPricing<T extends ComputableCostItem = ComputableCostItem>
  extends PricingResult {
  items: ComputedCostItem<T>[];
}

/**
 * Single server-side source of truth for trip financials: converts every cost
 * item to IDR, sums by category, then runs the pricing waterfall. The client
 * runs the same math for instant feedback, but only this result is ever persisted.
 */
export function computeTripPricing<T extends ComputableCostItem>(
  costItems: T[],
  pricingConfig: TripPricingConfig,
  currencyRates: CurrencyRates,
): ComputedTripPricing<T> {
  const computedItems = costItems.map((item) => {
    const rate = currencyRates[item.currency] ?? 1;
    const baseAmountIDR = calculateItemTotal({
      category: item.category,
      unitPrice: convertToIDR(item.unitPrice, item.currency, currencyRates),
      quantity: item.quantity,
      participants: item.participants,
      days: item.days,
      nights: item.nights,
    });
    const total = calculateItemTotal(item);
    return { item, total, baseAmountIDR, exchangeRate: rate };
  });

  const categoryTotals = calculateCategoryTotals(
    computedItems.map(({ item, baseAmountIDR }) => ({
      category: item.category,
      unitPrice: baseAmountIDR,
      quantity: 1,
    })),
  );
  const baseCost = calculateBaseCost(categoryTotals);
  const pricing = calculatePricing({ baseCost, ...pricingConfig });

  return { ...pricing, items: computedItems };
}
