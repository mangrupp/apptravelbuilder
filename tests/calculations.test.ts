import { describe, it, expect } from "vitest";
import {
  calculateFlightCost,
  calculateAccommodationCost,
  calculateTransportationCost,
  calculateActivityCost,
  calculateMealCost,
  calculateOtherCost,
  calculateCategoryTotals,
} from "@/lib/calculations/costItems";
import {
  calculateBaseCost,
  calculateContingency,
  calculateServiceFee,
  calculateSellingPrice,
  calculateProfit,
  calculateMargin,
  calculatePricing,
  getMarginStatus,
} from "@/lib/calculations/pricing";
import { calculateScenarios } from "@/lib/calculations/scenarios";
import { convertToIDR, DEFAULT_CURRENCY_RATES } from "@/lib/currency";

describe("calculateFlightCost", () => {
  it("1 traveler: unitPrice x quantity", () => {
    expect(calculateFlightCost({ category: "FLIGHT", unitPrice: 2_500_000, quantity: 1 })).toBe(
      2_500_000,
    );
  });

  it("multiple travelers", () => {
    expect(calculateFlightCost({ category: "FLIGHT", unitPrice: 2_500_000, quantity: 4 })).toBe(
      10_000_000,
    );
  });
});

describe("calculateAccommodationCost", () => {
  it("price per night x rooms x nights", () => {
    expect(
      calculateAccommodationCost({
        category: "ACCOMMODATION",
        unitPrice: 1_000_000,
        quantity: 2,
        nights: 3,
      }),
    ).toBe(6_000_000);
  });

  it("multiple rooms, multiple nights", () => {
    expect(
      calculateAccommodationCost({
        category: "ACCOMMODATION",
        unitPrice: 750_000,
        quantity: 3,
        nights: 4,
      }),
    ).toBe(9_000_000);
  });

  it("defaults to 1 night when not provided", () => {
    expect(
      calculateAccommodationCost({ category: "ACCOMMODATION", unitPrice: 500_000, quantity: 1 }),
    ).toBe(500_000);
  });
});

describe("calculateTransportationCost", () => {
  it("generic unitPrice x quantity", () => {
    expect(
      calculateTransportationCost({
        category: "TRANSPORTATION",
        unitPrice: 500_000,
        quantity: 4,
      }),
    ).toBe(2_000_000);
  });
});

describe("calculateActivityCost", () => {
  it("price per person x participants", () => {
    expect(
      calculateActivityCost({
        category: "ACTIVITY",
        unitPrice: 250_000,
        quantity: 1,
        participants: 4,
      }),
    ).toBe(1_000_000);
  });

  it("falls back to quantity when participants missing", () => {
    expect(calculateActivityCost({ category: "ACTIVITY", unitPrice: 250_000, quantity: 4 })).toBe(
      1_000_000,
    );
  });
});

describe("calculateMealCost", () => {
  it("price per person per day x participants x days", () => {
    expect(
      calculateMealCost({
        category: "MEAL",
        unitPrice: 200_000,
        quantity: 1,
        participants: 4,
        days: 3.5,
      }),
    ).toBe(2_800_000);
  });
});

describe("calculateOtherCost", () => {
  it("generic unitPrice x quantity", () => {
    expect(calculateOtherCost({ category: "OTHER", unitPrice: 1_000_000, quantity: 1 })).toBe(
      1_000_000,
    );
  });
});

describe("calculateCategoryTotals", () => {
  it("sums multiple items within the same category", () => {
    const totals = calculateCategoryTotals([
      { category: "FLIGHT", unitPrice: 2_500_000, quantity: 4 },
      { category: "FLIGHT", unitPrice: 100_000, quantity: 4 }, // e.g. airport tax
      { category: "MEAL", unitPrice: 200_000, quantity: 1, participants: 4, days: 3.5 },
    ]);
    expect(totals.FLIGHT).toBe(10_400_000);
    expect(totals.MEAL).toBe(2_800_000);
    expect(totals.ACCOMMODATION).toBe(0);
  });
});

describe("calculateBaseCost", () => {
  it("sums all categories", () => {
    const baseCost = calculateBaseCost({
      FLIGHT: 10_000_000,
      ACCOMMODATION: 9_000_000,
      TRANSPORTATION: 2_000_000,
      ACTIVITY: 3_000_000,
      MEAL: 2_800_000,
      OTHER: 1_000_000,
    });
    expect(baseCost).toBe(27_800_000);
  });
});

describe("calculateContingency", () => {
  it("default 5%", () => {
    expect(calculateContingency(27_800_000, 5)).toBe(1_390_000);
  });

  it("user-editable percentage", () => {
    expect(calculateContingency(27_800_000, 10)).toBe(2_780_000);
  });

  it("zero contingency", () => {
    expect(calculateContingency(27_800_000, 0)).toBe(0);
  });
});

describe("calculateServiceFee", () => {
  it("fixed amount", () => {
    expect(calculateServiceFee(29_190_000, "FIXED", 500_000)).toBe(500_000);
  });

  it("percentage of cost before fee", () => {
    expect(calculateServiceFee(29_190_000, "PERCENTAGE", 5)).toBe(1_459_500);
  });
});

describe("calculateSellingPrice / calculateProfit / calculateMargin", () => {
  it("zero markup -> selling price equals total cost, zero profit", () => {
    const sellingPrice = calculateSellingPrice(29_190_000, 0);
    expect(sellingPrice).toBe(29_190_000);
    const profit = calculateProfit(sellingPrice, 29_190_000);
    expect(profit).toBe(0);
    expect(calculateMargin(profit, sellingPrice)).toBe(0);
  });

  it("15% markup", () => {
    const sellingPrice = calculateSellingPrice(29_190_000, 15);
    expect(sellingPrice).toBe(33_568_500);
    const profit = calculateProfit(sellingPrice, 29_190_000);
    expect(profit).toBe(4_378_500);
  });

  it("high markup", () => {
    const sellingPrice = calculateSellingPrice(10_000_000, 100);
    expect(sellingPrice).toBe(20_000_000);
    expect(calculateProfit(sellingPrice, 10_000_000)).toBe(10_000_000);
    expect(calculateMargin(10_000_000, 20_000_000)).toBe(50);
  });

  it("loss scenario: selling price below total cost", () => {
    const profit = calculateProfit(9_000_000, 10_000_000);
    expect(profit).toBe(-1_000_000);
    const margin = calculateMargin(profit, 9_000_000);
    expect(margin).toBeLessThan(0);
    expect(getMarginStatus(margin)).toBe("LOSS");
  });
});

describe("getMarginStatus", () => {
  it("classifies thresholds correctly", () => {
    expect(getMarginStatus(25)).toBe("HEALTHY");
    expect(getMarginStatus(20)).toBe("HEALTHY");
    expect(getMarginStatus(15)).toBe("WARNING");
    expect(getMarginStatus(10)).toBe("WARNING");
    expect(getMarginStatus(5)).toBe("LOW_MARGIN");
    expect(getMarginStatus(0)).toBe("LOW_MARGIN");
    expect(getMarginStatus(-5)).toBe("LOSS");
  });
});

describe("calculatePricing (full waterfall)", () => {
  it("acceptance test: Sarah Wijaya / Kuala Lumpur 4D3N", () => {
    const totals = calculateCategoryTotals([
      { category: "FLIGHT", unitPrice: 10_000_000, quantity: 1 },
      { category: "ACCOMMODATION", unitPrice: 3_000_000, quantity: 1, nights: 3 },
      { category: "TRANSPORTATION", unitPrice: 2_000_000, quantity: 1 },
      { category: "ACTIVITY", unitPrice: 3_000_000, quantity: 1 },
      { category: "MEAL", unitPrice: 2_800_000, quantity: 1 },
      { category: "OTHER", unitPrice: 1_000_000, quantity: 1 },
    ]);
    const baseCost = calculateBaseCost(totals);
    expect(baseCost).toBe(27_800_000);

    const result = calculatePricing({
      baseCost,
      contingencyPercent: 5,
      serviceFeeType: "FIXED",
      serviceFeeValue: 0,
      markupPercentage: 15,
    });

    expect(result.contingencyAmount).toBe(1_390_000);
    expect(result.totalCost).toBe(29_190_000);
    expect(result.sellingPrice).toBe(33_568_500);
    expect(result.profit).toBe(4_378_500);
    expect(result.margin).toBeCloseTo(13.05, 1);
    expect(getMarginStatus(result.margin)).toBe("WARNING");
  });
});

describe("currency conversion", () => {
  it("converts foreign currency amounts to IDR using stored rates", () => {
    expect(convertToIDR(100, "USD", DEFAULT_CURRENCY_RATES)).toBe(1_600_000);
    expect(convertToIDR(50, "SGD", DEFAULT_CURRENCY_RATES)).toBe(600_000);
    expect(convertToIDR(1_000_000, "IDR", DEFAULT_CURRENCY_RATES)).toBe(1_000_000);
  });
});

describe("calculateScenarios", () => {
  const base = {
    baseCost: 27_800_000,
    contingencyPercent: 5,
    serviceFeeType: "FIXED" as const,
    serviceFeeValue: 0,
    markupPercentage: 15,
  };

  it("produces three scenarios with real, distinct calculations", () => {
    const scenarios = calculateScenarios({ ...base, customerBudget: 30_000_000 });
    expect(scenarios).toHaveLength(3);
    const [budget, standard, premium] = scenarios;
    expect(budget.estimatedCost).toBeLessThan(standard.estimatedCost);
    expect(standard.estimatedCost).toBeLessThan(premium.estimatedCost);
    expect(budget.sellingPrice).toBeLessThan(premium.sellingPrice);
  });

  it("marks exactly one scenario as recommended", () => {
    const scenarios = calculateScenarios({ ...base, customerBudget: 30_000_000 });
    expect(scenarios.filter((s) => s.recommended)).toHaveLength(1);
  });

  it("recommends a scenario that fits the budget when possible", () => {
    const scenarios = calculateScenarios({ ...base, customerBudget: 30_000_000 });
    const recommended = scenarios.find((s) => s.recommended)!;
    expect(recommended.fitsBudget).not.toBe(false);
  });

  it("falls back sensibly when nothing fits a very low budget", () => {
    const scenarios = calculateScenarios({ ...base, customerBudget: 1_000_000 });
    expect(scenarios.every((s) => s.fitsBudget === false)).toBe(true);
    expect(scenarios.filter((s) => s.recommended)).toHaveLength(1);
  });

  it("handles no customer budget gracefully", () => {
    const scenarios = calculateScenarios({ ...base, customerBudget: null });
    expect(scenarios.every((s) => s.fitsBudget === null)).toBe(true);
    expect(scenarios.filter((s) => s.recommended)).toHaveLength(1);
  });
});
