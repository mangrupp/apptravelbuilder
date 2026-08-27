import { toNumber } from "@/lib/decimal";
import { formatIDR } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { TripDetail } from "@/lib/queries/trips";
import type { CategoryTotals } from "@/lib/calculations/types";

export interface TripAIContext {
  destination: string;
  travelStyle: string;
  departureDate: string;
  returnDate: string;
  days: number;
  nights: number;
  travelers: { adults: number; children: number; infants: number; total: number };
  customerBudget: number | null;
  costItems: Array<{
    id: string;
    category: string;
    description: string;
    unitPrice: number;
    quantity: number;
    currency: string;
    totalIDR: number;
  }>;
  categoryTotals: CategoryTotals;
  baseCost: number;
  contingencyAmount: number;
  serviceFee: number;
  totalCost: number;
  sellingPrice: number;
  profit: number;
  margin: number;
}

export function buildTripAIContext(trip: TripDetail): TripAIContext {
  return {
    destination: trip.destination,
    travelStyle: trip.travelStyle,
    departureDate: trip.departureDate.toISOString().slice(0, 10),
    returnDate: trip.returnDate.toISOString().slice(0, 10),
    days: trip.days,
    nights: trip.nights,
    travelers: {
      adults: trip.traveler?.adults ?? 0,
      children: trip.traveler?.children ?? 0,
      infants: trip.traveler?.infants ?? 0,
      total: trip.traveler?.total ?? 0,
    },
    customerBudget: trip.customerBudget ? toNumber(trip.customerBudget) : null,
    costItems: trip.costs.map((cost) => ({
      id: cost.id,
      category: cost.category,
      description: cost.description,
      unitPrice: toNumber(cost.unitPrice),
      quantity: toNumber(cost.quantity),
      currency: cost.currency,
      totalIDR: toNumber(cost.baseAmountIDR),
    })),
    categoryTotals: trip.costs.reduce(
      (acc, cost) => {
        acc[cost.category] += toNumber(cost.baseAmountIDR);
        return acc;
      },
      { FLIGHT: 0, ACCOMMODATION: 0, TRANSPORTATION: 0, ACTIVITY: 0, MEAL: 0, OTHER: 0 } as CategoryTotals,
    ),
    baseCost: toNumber(trip.baseCost),
    contingencyAmount: toNumber(trip.contingencyAmount),
    serviceFee: toNumber(trip.serviceFee),
    totalCost: toNumber(trip.baseCost) + toNumber(trip.contingencyAmount) + toNumber(trip.serviceFee),
    sellingPrice: toNumber(trip.sellingPrice),
    profit: toNumber(trip.profit),
    margin: toNumber(trip.margin),
  };
}

export function formatTripContextForPrompt(ctx: TripAIContext): string {
  const lines = [
    `Destination: ${ctx.destination} (${ctx.travelStyle} style)`,
    `Dates: ${ctx.departureDate} to ${ctx.returnDate} (${ctx.days} days / ${ctx.nights} nights)`,
    `Travelers: ${ctx.travelers.adults} adults, ${ctx.travelers.children} children, ${ctx.travelers.infants} infants (total ${ctx.travelers.total})`,
    `Customer budget: ${ctx.customerBudget != null ? formatIDR(ctx.customerBudget) : "not set"}`,
    "",
    "Cost items (all figures already converted to IDR):",
    ...ctx.costItems.map(
      (item) =>
        `- [${item.id}] ${CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ?? item.category}: ${item.description} — unit price ${item.currency} ${item.unitPrice.toLocaleString("id-ID")} x ${item.quantity} = ${formatIDR(item.totalIDR)}`,
    ),
    "",
    "Category totals (IDR):",
    ...Object.entries(ctx.categoryTotals).map(
      ([cat, total]) => `- ${CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat}: ${formatIDR(total)}`,
    ),
    "",
    `Base cost: ${formatIDR(ctx.baseCost)}`,
    `Contingency: ${formatIDR(ctx.contingencyAmount)}`,
    `Service fee: ${formatIDR(ctx.serviceFee)}`,
    `Total cost: ${formatIDR(ctx.totalCost)}`,
    `Selling price: ${formatIDR(ctx.sellingPrice)}`,
    `Profit: ${formatIDR(ctx.profit)}`,
    `Margin: ${ctx.margin.toFixed(2)}%`,
  ];
  return lines.join("\n");
}
