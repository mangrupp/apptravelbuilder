"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Users, Calendar, MapPin, Wallet } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CostItemsEditor } from "@/components/trips/cost-items-editor";
import { LiveCostSummary } from "@/components/pricing/live-cost-summary";
import { ScenarioSimulator } from "@/components/pricing/scenario-simulator";
import { AICopilotPanel } from "@/components/ai/ai-copilot-panel";
import { QuotationTab } from "@/components/quotation/quotation-tab";
import type { CostDatabaseOption } from "@/components/trips/cost-database-picker";
import { useTripDraftStore } from "@/store/trip-draft";
import { updateTripCostsAndPricing, updateTripStatus } from "@/lib/actions/trips";
import { calculateCategoryTotals } from "@/lib/calculations/costItems";
import { calculatePricing, getMarginStatus } from "@/lib/calculations/pricing";
import { convertToIDR, type CurrencyRates } from "@/lib/currency";
import { formatIDR, formatDateShort } from "@/lib/format";
import { MARGIN_STATUS_LABELS, TRAVEL_STYLE_LABELS } from "@/lib/constants";
import { toNumber, toNumberOrNull } from "@/lib/decimal";
import { toast } from "@/store/toast";
import type { CostItemDraft } from "@/lib/types/cost-draft";
import type { TripDetail } from "@/lib/queries/trips";

const STATUS_OPTIONS = ["DRAFT", "CONFIRMED", "CANCELLED", "COMPLETED"];
const MARGIN_BADGE_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  HEALTHY: "success",
  WARNING: "warning",
  LOW_MARGIN: "warning",
  LOSS: "destructive",
};

export function TripWorkspace({
  trip,
  costDatabaseItems,
  currencyRates,
}: {
  trip: TripDetail;
  costDatabaseItems: CostDatabaseOption[];
  currencyRates: CurrencyRates;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [statusPending, startStatusTransition] = useTransition();

  const [costItems, setCostItems] = useState<CostItemDraft[]>(() =>
    trip.costs.map((cost) => ({
      key: cost.id,
      category: cost.category,
      description: cost.description,
      supplier: cost.supplier ?? "",
      currency: cost.currency,
      unitPrice: toNumber(cost.unitPrice),
      quantity: toNumber(cost.quantity),
      participants: cost.participants,
      days: toNumberOrNull(cost.days),
      nights: toNumberOrNull(cost.nights),
      notes: cost.notes ?? "",
      costDatabaseItemId: cost.costDatabaseItemId,
    })),
  );

  const resetDraft = useTripDraftStore((s) => s.reset);
  useEffect(() => {
    resetDraft();
  }, [resetDraft]);

  const draftPricing: PricingConfigState = {
    contingencyPercent: toNumber(trip.contingencyPercent),
    serviceFeeType: trip.serviceFeeType,
    serviceFeeValue: toNumber(trip.serviceFeeValue),
    markupPercentage: toNumber(trip.markupPercentage),
  };
  const [pricing, setPricing] = useState<PricingConfigState>(draftPricing);

  const categoryTotalsIDR = useMemo(
    () =>
      calculateCategoryTotals(
        costItems.map((item) => ({
          category: item.category,
          unitPrice: convertToIDR(item.unitPrice, item.currency, currencyRates),
          quantity: item.quantity,
          participants: item.participants,
          days: item.days,
          nights: item.nights,
        })),
      ),
    [costItems, currencyRates],
  );
  const baseCost = Object.values(categoryTotalsIDR).reduce((a, b) => a + b, 0);
  const pricingResult = calculatePricing({ baseCost, ...pricing });
  const marginStatus = getMarginStatus(pricingResult.margin);

  const isDirty =
    JSON.stringify(pricing) !== JSON.stringify(draftPricing) ||
    costItems.length !== trip.costs.length ||
    costItems.some((item, i) => {
      const original = trip.costs[i];
      if (!original) return true;
      return (
        item.description !== original.description ||
        item.unitPrice !== toNumber(original.unitPrice) ||
        item.quantity !== toNumber(original.quantity) ||
        item.category !== original.category
      );
    });

  function handleSave() {
    startTransition(async () => {
      const result = await updateTripCostsAndPricing(trip.id, {
        costItems: costItems.map(({ key: _key, ...rest }) => rest),
        pricing,
      });
      if (!result.success) {
        toast({ title: "Could not save changes", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Trip updated", variant: "success" });
      router.refresh();
    });
  }

  function handleStatusChange(status: string) {
    startStatusTransition(async () => {
      await updateTripStatus(trip.id, status);
      toast({ title: `Status changed to ${status}`, variant: "success" });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/trips" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to trips
        </Link>
      </div>

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{trip.destination}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {trip.customer.name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {formatDateShort(trip.departureDate)} ·{" "}
              {trip.days}D{trip.nights}N
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {TRAVEL_STYLE_LABELS[trip.travelStyle]}
            </span>
            {trip.customerBudget && (
              <span className="flex items-center gap-1">
                <Wallet className="h-3.5 w-3.5" /> Budget {formatIDR(toNumber(trip.customerBudget))}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={MARGIN_BADGE_VARIANT[marginStatus]}>
            {pricingResult.margin.toFixed(1)}% · {MARGIN_STATUS_LABELS[marginStatus]}
          </Badge>
          <Select value={trip.status} onValueChange={handleStatusChange} disabled={statusPending}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="costs">
        <TabsList>
          <TabsTrigger value="costs">Costs & Pricing</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="ai">AI Copilot</TabsTrigger>
          <TabsTrigger value="quotation">Quotation</TabsTrigger>
        </TabsList>

        <TabsContent value="costs">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Cost Builder</CardTitle>
                </CardHeader>
                <CardContent>
                  <CostItemsEditor
                    items={costItems}
                    onChange={setCostItems}
                    costDatabaseItems={costDatabaseItems}
                    currencyRates={currencyRates}
                  />
                </CardContent>
              </Card>

              <PricingConfigCard pricing={pricing} setPricing={setPricing} />

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={pending || !isDirty}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </div>
            <div>
              <LiveCostSummary
                categoryTotals={categoryTotalsIDR}
                baseCost={pricingResult.baseCost}
                contingencyAmount={pricingResult.contingencyAmount}
                serviceFee={pricingResult.serviceFee}
                totalCost={pricingResult.totalCost}
                sellingPrice={pricingResult.sellingPrice}
                profit={pricingResult.profit}
                margin={pricingResult.margin}
                customerBudget={trip.customerBudget ? toNumber(trip.customerBudget) : null}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="scenarios">
          <ScenarioSimulator
            baseCost={baseCost}
            contingencyPercent={pricing.contingencyPercent}
            serviceFeeType={pricing.serviceFeeType}
            serviceFeeValue={pricing.serviceFeeValue}
            markupPercentage={pricing.markupPercentage}
            customerBudget={trip.customerBudget ? toNumber(trip.customerBudget) : null}
          />
        </TabsContent>

        <TabsContent value="ai">
          <AICopilotPanel trip={trip} />
        </TabsContent>

        <TabsContent value="quotation">
          <QuotationTab trip={trip} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface PricingConfigState {
  contingencyPercent: number;
  serviceFeeType: "FIXED" | "PERCENTAGE";
  serviceFeeValue: number;
  markupPercentage: number;
}

function PricingConfigCard({
  pricing,
  setPricing,
}: {
  pricing: PricingConfigState;
  setPricing: React.Dispatch<React.SetStateAction<PricingConfigState>>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Configuration</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PricingField
          label="Contingency (%)"
          value={pricing.contingencyPercent}
          onChange={(v) => setPricing((p) => ({ ...p, contingencyPercent: v }))}
        />
        <PricingField
          label="Markup (%)"
          value={pricing.markupPercentage}
          onChange={(v) => setPricing((p) => ({ ...p, markupPercentage: v }))}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Service Fee Type</label>
          <Select
            value={pricing.serviceFeeType}
            onValueChange={(v) => setPricing((p) => ({ ...p, serviceFeeType: v as "FIXED" | "PERCENTAGE" }))}
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
        <PricingField
          label={`Service Fee Value ${pricing.serviceFeeType === "PERCENTAGE" ? "(%)" : "(IDR)"}`}
          value={pricing.serviceFeeValue}
          onChange={(v) => setPricing((p) => ({ ...p, serviceFeeValue: v }))}
        />
      </CardContent>
    </Card>
  );
}

function PricingField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
