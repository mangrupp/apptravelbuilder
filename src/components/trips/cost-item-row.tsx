"use client";

import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CostDatabasePicker, type CostDatabaseOption } from "@/components/trips/cost-database-picker";
import { CURRENCY_OPTIONS } from "@/lib/constants";
import { calculateItemTotal } from "@/lib/calculations/costItems";
import { formatCurrency } from "@/lib/format";
import type { CostItemDraft } from "@/lib/types/cost-draft";
import type { CurrencyCode } from "@/lib/currency";

export function CostItemRow({
  item,
  costDatabaseItems,
  onChange,
  onRemove,
}: {
  item: CostItemDraft;
  costDatabaseItems: CostDatabaseOption[];
  onChange: (next: CostItemDraft) => void;
  onRemove: () => void;
}) {
  const total = calculateItemTotal({
    category: item.category,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    participants: item.participants,
    days: item.days,
    nights: item.nights,
  });

  function applyDatabaseItem(dbItem: CostDatabaseOption) {
    onChange({
      ...item,
      description: dbItem.name,
      supplier: dbItem.supplier ?? "",
      currency: dbItem.currency,
      unitPrice: dbItem.cost,
      costDatabaseItemId: dbItem.id,
    });
  }

  const showParticipants = item.category === "ACTIVITY" || item.category === "MEAL";
  const showDays = item.category === "MEAL";
  const showNights = item.category === "ACCOMMODATION";
  const quantityLabel =
    item.category === "ACCOMMODATION" ? "Rooms" : item.category === "FLIGHT" ? "Tickets" : "Qty";

  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3 sm:grid-cols-12 sm:items-end">
      <div className="sm:col-span-3">
        <label className="text-xs font-medium text-muted-foreground">Description</label>
        <Input
          value={item.description}
          onChange={(e) => onChange({ ...item, description: e.target.value })}
          placeholder="e.g. AirAsia AK892 economy"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs font-medium text-muted-foreground">Supplier</label>
        <Input
          value={item.supplier}
          onChange={(e) => onChange({ ...item, supplier: e.target.value })}
          placeholder="Supplier"
        />
      </div>
      <div className="sm:col-span-1">
        <label className="text-xs font-medium text-muted-foreground">Currency</label>
        <Select
          value={item.currency}
          onValueChange={(v) => onChange({ ...item, currency: v as CurrencyCode })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs font-medium text-muted-foreground">Unit Price</label>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={item.unitPrice}
          onChange={(e) => onChange({ ...item, unitPrice: Number(e.target.value) })}
        />
      </div>
      <div className="sm:col-span-1">
        <label className="text-xs font-medium text-muted-foreground">{quantityLabel}</label>
        <Input
          type="number"
          min={0}
          step="1"
          value={item.quantity}
          onChange={(e) => onChange({ ...item, quantity: Number(e.target.value) })}
        />
      </div>
      {showParticipants && (
        <div className="sm:col-span-1">
          <label className="text-xs font-medium text-muted-foreground">Pax</label>
          <Input
            type="number"
            min={0}
            step="1"
            value={item.participants ?? ""}
            onChange={(e) =>
              onChange({ ...item, participants: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
      )}
      {showDays && (
        <div className="sm:col-span-1">
          <label className="text-xs font-medium text-muted-foreground">Days</label>
          <Input
            type="number"
            min={0}
            step="0.5"
            value={item.days ?? ""}
            onChange={(e) => onChange({ ...item, days: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
      )}
      {showNights && (
        <div className="sm:col-span-1">
          <label className="text-xs font-medium text-muted-foreground">Nights</label>
          <Input
            type="number"
            min={0}
            step="1"
            value={item.nights ?? ""}
            onChange={(e) => onChange({ ...item, nights: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
      )}
      <div className="flex items-center justify-between gap-2 sm:col-span-2 sm:justify-end">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-sm font-semibold">{formatCurrency(total, item.currency)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:col-span-1 sm:justify-end">
        <CostDatabasePicker items={costDatabaseItems} category={item.category} onSelect={applyDatabaseItem} />
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
