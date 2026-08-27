"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useTripDraftStore } from "@/store/trip-draft";

export function PricingStep() {
  const { pricing, setPricing } = useTripDraftStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Configuration</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Contingency (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={pricing.contingencyPercent}
            onChange={(e) => setPricing({ contingencyPercent: Number(e.target.value) })}
          />
          <p className="text-xs text-muted-foreground">Default is 5% of base cost.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Markup (%)</Label>
          <Input
            type="number"
            min={0}
            value={pricing.markupPercentage}
            onChange={(e) => setPricing({ markupPercentage: Number(e.target.value) })}
          />
          <p className="text-xs text-muted-foreground">Default is 15% of total cost.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Service Fee Type</Label>
          <Select
            value={pricing.serviceFeeType}
            onValueChange={(v) => setPricing({ serviceFeeType: v as "FIXED" | "PERCENTAGE" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENTAGE">Percentage</SelectItem>
              <SelectItem value="FIXED">Fixed Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Service Fee Value {pricing.serviceFeeType === "PERCENTAGE" ? "(%)" : "(IDR)"}</Label>
          <Input
            type="number"
            min={0}
            value={pricing.serviceFeeValue}
            onChange={(e) => setPricing({ serviceFeeValue: Number(e.target.value) })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
