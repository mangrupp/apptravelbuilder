"use client";

import { useMemo, useState } from "react";
import { Search, Database } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { CostCategory } from "@/lib/calculations/types";
import type { CurrencyCode } from "@/lib/currency";

export interface CostDatabaseOption {
  id: string;
  name: string;
  category: CostCategory;
  destination: string | null;
  supplier: string | null;
  currency: CurrencyCode;
  cost: number;
  unit: string | null;
}

export function CostDatabasePicker({
  items,
  category,
  onSelect,
}: {
  items: CostDatabaseOption[];
  category: CostCategory;
  onSelect: (item: CostDatabaseOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return items
      .filter((item) => item.category === category)
      .filter((item) =>
        query
          ? item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.supplier?.toLowerCase().includes(query.toLowerCase())
          : true,
      );
  }, [items, category, query]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>
        <Button type="button" variant="outline" size="sm">
          <Database className="h-3.5 w-3.5" /> From Database
        </Button>
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select {CATEGORY_LABELS[category]} from Cost Database</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="pl-8"
          />
        </div>
        <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No items found for this category.
            </p>
          )}
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item);
                setOpen(false);
              }}
              className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-left text-sm hover:border-border hover:bg-muted"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.supplier || "—"} {item.destination ? `· ${item.destination}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{formatCurrency(item.cost, item.currency)}</Badge>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
