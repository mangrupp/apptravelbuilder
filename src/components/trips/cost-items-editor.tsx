"use client";

import { Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CostItemRow } from "@/components/trips/cost-item-row";
import type { CostDatabaseOption } from "@/components/trips/cost-database-picker";
import { COST_CATEGORIES, type CostCategory } from "@/lib/calculations/types";
import { calculateCategoryTotals, calculateItemTotal } from "@/lib/calculations/costItems";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatIDR } from "@/lib/format";
import { convertToIDR, DEFAULT_CURRENCY_RATES, type CurrencyRates } from "@/lib/currency";
import type { CostItemDraft } from "@/lib/types/cost-draft";
import { createEmptyCostItem } from "@/lib/types/cost-draft";

export function CostItemsEditor({
  items,
  onChange,
  costDatabaseItems,
  currencyRates = DEFAULT_CURRENCY_RATES,
}: {
  items: CostItemDraft[];
  onChange: (items: CostItemDraft[]) => void;
  costDatabaseItems: CostDatabaseOption[];
  currencyRates?: CurrencyRates;
}) {
  const totalsInIDR = calculateCategoryTotals(
    items.map((item) => ({
      category: item.category,
      unitPrice: convertToIDR(item.unitPrice, item.currency, currencyRates),
      quantity: item.quantity,
      participants: item.participants,
      days: item.days,
      nights: item.nights,
    })),
  );

  function addItem(category: CostCategory) {
    onChange([...items, createEmptyCostItem(category)]);
  }

  function updateItem(key: string, next: CostItemDraft) {
    onChange(items.map((item) => (item.key === key ? next : item)));
  }

  function removeItem(key: string) {
    onChange(items.filter((item) => item.key !== key));
  }

  return (
    <Tabs defaultValue="FLIGHT">
      <TabsList className="flex-wrap h-auto">
        {COST_CATEGORIES.map((category) => (
          <TabsTrigger key={category} value={category} className="flex flex-col gap-0.5 py-1.5">
            <span>{CATEGORY_LABELS[category]}</span>
            <span className="text-[10px] text-muted-foreground">{formatIDR(totalsInIDR[category])}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {COST_CATEGORIES.map((category) => {
        const categoryItems = items.filter((item) => item.category === category);
        return (
          <TabsContent key={category} value={category} className="flex flex-col gap-3">
            {categoryItems.length === 0 && (
              <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                No {CATEGORY_LABELS[category].toLowerCase()} costs added yet.
              </p>
            )}
            {categoryItems.map((item) => (
              <CostItemRow
                key={item.key}
                item={item}
                costDatabaseItems={costDatabaseItems}
                onChange={(next) => updateItem(item.key, next)}
                onRemove={() => removeItem(item.key)}
              />
            ))}
            <Button type="button" variant="outline" onClick={() => addItem(category)} className="self-start">
              <Plus className="h-4 w-4" /> Add {CATEGORY_LABELS[category]} Cost
            </Button>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

export { calculateItemTotal };
