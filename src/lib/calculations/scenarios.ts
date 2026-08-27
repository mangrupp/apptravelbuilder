import type { PricingInput, ScenarioResult, TravelStyle } from "./types";
import { calculatePricing, getMarginStatus } from "./pricing";

/**
 * Deterministic cost multipliers applied to the trip's current base cost to
 * approximate what the trip would cost at each travel style tier. These are
 * fixed business rules, not AI output, so the simulator is reproducible.
 */
export const SCENARIO_STYLE_MULTIPLIERS: Record<"BUDGET" | "STANDARD" | "PREMIUM", number> = {
  BUDGET: 0.8,
  STANDARD: 1,
  PREMIUM: 1.35,
};

export interface ScenarioSimulatorInput {
  baseCost: number;
  contingencyPercent: number;
  serviceFeeType: PricingInput["serviceFeeType"];
  serviceFeeValue: number;
  markupPercentage: number;
  customerBudget?: number | null;
  currentStyle?: TravelStyle;
}

export function calculateScenarios(input: ScenarioSimulatorInput): ScenarioResult[] {
  const styles: Array<"BUDGET" | "STANDARD" | "PREMIUM"> = ["BUDGET", "STANDARD", "PREMIUM"];

  const scenarios: Omit<ScenarioResult, "recommended">[] = styles.map((style) => {
    const estimatedCost = Math.round(input.baseCost * SCENARIO_STYLE_MULTIPLIERS[style] * 100) / 100;
    const pricing = calculatePricing({
      baseCost: estimatedCost,
      contingencyPercent: input.contingencyPercent,
      serviceFeeType: input.serviceFeeType,
      serviceFeeValue: input.serviceFeeValue,
      markupPercentage: input.markupPercentage,
    });
    const fitsBudget =
      input.customerBudget != null ? pricing.sellingPrice <= input.customerBudget : null;

    return {
      style,
      estimatedCost,
      sellingPrice: pricing.sellingPrice,
      profit: pricing.profit,
      margin: pricing.margin,
      marginStatus: getMarginStatus(pricing.margin),
      fitsBudget,
    };
  });

  const recommendedIndex = pickRecommendedScenario(scenarios);

  return scenarios.map((scenario, index) => ({
    ...scenario,
    recommended: index === recommendedIndex,
  }));
}

/**
 * Recommendation rule (kept deterministic, never AI-driven):
 * 1. Prefer scenarios that fit the customer's budget.
 * 2. Among those, prefer a healthy margin (>=20%).
 * 3. Among healthy-margin, budget-fitting scenarios, pick the cheapest
 *    (don't recommend Premium if Standard is just as healthy) - "not
 *    unnecessarily expensive".
 * 4. If nothing is both in-budget and healthy, fall back to the in-budget
 *    scenario with the best margin.
 * 5. If nothing fits the budget at all, recommend the cheapest (Budget) option.
 */
function pickRecommendedScenario(scenarios: Omit<ScenarioResult, "recommended">[]): number {
  const inBudget = scenarios
    .map((s, i) => ({ ...s, index: i }))
    .filter((s) => s.fitsBudget !== false);

  const pool = inBudget.length > 0 ? inBudget : scenarios.map((s, i) => ({ ...s, index: i }));

  const healthy = pool.filter((s) => s.marginStatus === "HEALTHY");
  if (healthy.length > 0) {
    return healthy.reduce((best, s) => (s.estimatedCost < best.estimatedCost ? s : best)).index;
  }

  return pool.reduce((best, s) => (s.margin > best.margin ? s : best)).index;
}
