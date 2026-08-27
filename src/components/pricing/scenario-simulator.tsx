"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { calculateScenarios } from "@/lib/calculations/scenarios";
import { TRAVEL_STYLE_LABELS, MARGIN_STATUS_LABELS } from "@/lib/constants";
import { formatIDR, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ServiceFeeType } from "@/lib/calculations/types";

const MARGIN_BADGE_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  HEALTHY: "success",
  WARNING: "warning",
  LOW_MARGIN: "warning",
  LOSS: "destructive",
};

export function ScenarioSimulator({
  baseCost,
  contingencyPercent,
  serviceFeeType,
  serviceFeeValue,
  markupPercentage,
  customerBudget,
}: {
  baseCost: number;
  contingencyPercent: number;
  serviceFeeType: ServiceFeeType;
  serviceFeeValue: number;
  markupPercentage: number;
  customerBudget?: number | null;
}) {
  const scenarios = calculateScenarios({
    baseCost,
    contingencyPercent,
    serviceFeeType,
    serviceFeeValue,
    markupPercentage,
    customerBudget,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Simulator</CardTitle>
        <p className="text-sm text-muted-foreground">
          How this trip would look at each travel style tier, based on your current costs.
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {scenarios.map((scenario) => (
          <div
            key={scenario.style}
            className={cn(
              "flex flex-col gap-3 rounded-xl border p-4",
              scenario.recommended ? "border-primary bg-secondary/50" : "border-border",
            )}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">{TRAVEL_STYLE_LABELS[scenario.style]}</p>
              {scenario.recommended && (
                <Badge className="gap-1">
                  <Sparkles className="h-3 w-3" /> Recommended
                </Badge>
              )}
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Cost</span>
                <span>{formatIDR(scenario.estimatedCost)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Selling Price</span>
                <span>{formatIDR(scenario.sellingPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profit</span>
                <span>{formatIDR(scenario.profit)}</span>
              </div>
            </div>
            <Badge variant={MARGIN_BADGE_VARIANT[scenario.marginStatus]} className="w-fit">
              {formatPercent(scenario.margin)} · {MARGIN_STATUS_LABELS[scenario.marginStatus]}
            </Badge>
            {scenario.fitsBudget === false && (
              <p className="text-xs text-destructive">Over customer budget</p>
            )}
            {scenario.fitsBudget === true && (
              <p className="text-xs text-success">Fits customer budget</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
