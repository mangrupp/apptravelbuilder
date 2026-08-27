"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, MARGIN_STATUS_LABELS } from "@/lib/constants";
import { formatIDR, formatPercent } from "@/lib/format";
import { COST_CATEGORIES, type CategoryTotals } from "@/lib/calculations/types";
import { getMarginStatus } from "@/lib/calculations/pricing";
import { cn } from "@/lib/utils";

const MARGIN_BADGE_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  HEALTHY: "success",
  WARNING: "warning",
  LOW_MARGIN: "warning",
  LOSS: "destructive",
};

export function LiveCostSummary({
  categoryTotals,
  baseCost,
  contingencyAmount,
  serviceFee,
  totalCost,
  sellingPrice,
  profit,
  margin,
  customerBudget,
}: {
  categoryTotals: CategoryTotals;
  baseCost: number;
  contingencyAmount: number;
  serviceFee: number;
  totalCost: number;
  sellingPrice: number;
  profit: number;
  margin: number;
  customerBudget?: number | null;
}) {
  const marginStatus = getMarginStatus(margin);
  const overBudget = customerBudget != null && sellingPrice > customerBudget;

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle>Financial Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {COST_CATEGORIES.map((category) => (
          <div key={category} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{CATEGORY_LABELS[category]}</span>
            <span>{formatIDR(categoryTotals[category])}</span>
          </div>
        ))}
        <Separator />
        <div className="flex items-center justify-between text-sm font-medium">
          <span>Base Cost</span>
          <span>{formatIDR(baseCost)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Contingency</span>
          <span>{formatIDR(contingencyAmount)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Service Fee</span>
          <span>{formatIDR(serviceFee)}</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>Total Cost</span>
          <span>{formatIDR(totalCost)}</span>
        </div>
        <div className="flex items-center justify-between text-base font-semibold text-primary">
          <span>Selling Price</span>
          <span>{formatIDR(sellingPrice)}</span>
        </div>
        {customerBudget != null && (
          <div
            className={cn(
              "rounded-md px-2 py-1 text-xs",
              overBudget ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success",
            )}
          >
            {overBudget
              ? `Rp ${(sellingPrice - customerBudget).toLocaleString("id-ID")} over customer budget`
              : "Within customer budget"}
          </div>
        )}
        <Separator />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Profit</span>
          <span className={cn("font-medium", profit < 0 && "text-destructive")}>{formatIDR(profit)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Margin</span>
          <Badge variant={MARGIN_BADGE_VARIANT[marginStatus]}>
            {formatPercent(margin)} · {MARGIN_STATUS_LABELS[marginStatus]}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
