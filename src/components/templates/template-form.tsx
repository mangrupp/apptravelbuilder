"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CostItemsEditor } from "@/components/trips/cost-items-editor";
import type { CostDatabaseOption } from "@/components/trips/cost-database-picker";
import { createTemplate, updateTemplate } from "@/lib/actions/templates";
import { calculateBaseCostFromItems } from "@/lib/calculations/pricing";
import { formatIDR } from "@/lib/format";
import { TRAVEL_STYLE_LABELS } from "@/lib/constants";
import { toast } from "@/store/toast";
import type { CostItemDraft } from "@/lib/types/cost-draft";

export interface TemplateFormInitial {
  id?: string;
  name: string;
  destination: string;
  country: string;
  city: string;
  duration: number;
  travelStyle: string;
  description: string;
  defaultMarkup: number;
  defaultContingency: number;
  costItems: CostItemDraft[];
}

export function TemplateForm({
  initial,
  costDatabaseItems,
}: {
  initial?: TemplateFormInitial;
  costDatabaseItems: CostDatabaseOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    destination: initial?.destination ?? "",
    country: initial?.country ?? "",
    city: initial?.city ?? "",
    duration: initial?.duration ?? 4,
    travelStyle: initial?.travelStyle ?? "STANDARD",
    description: initial?.description ?? "",
    defaultMarkup: initial?.defaultMarkup ?? 15,
    defaultContingency: initial?.defaultContingency ?? 5,
  });
  const [costItems, setCostItems] = useState<CostItemDraft[]>(initial?.costItems ?? []);

  const baseCost = calculateBaseCostFromItems(
    costItems.map((item) => ({
      category: item.category,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      participants: item.participants,
      days: item.days,
      nights: item.nights,
    })),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = {
        ...form,
        costItems: costItems.map(({ key: _key, ...rest }) => rest),
      };
      const result = initial?.id
        ? await updateTemplate(initial.id, payload)
        : await createTemplate(payload);

      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      toast({ title: initial?.id ? "Template updated" : "Template created", variant: "success" });
      router.push("/templates");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Template Name</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Kuala Lumpur 4D3N"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Destination</Label>
            <Input
              required
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              placeholder="Kuala Lumpur"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Country</Label>
            <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Duration (days)</Label>
            <Input
              type="number"
              min={1}
              required
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Travel Style</Label>
            <Select value={form.travelStyle} onValueChange={(v) => setForm({ ...form, travelStyle: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TRAVEL_STYLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Default Markup (%)</Label>
            <Input
              type="number"
              min={0}
              value={form.defaultMarkup}
              onChange={(e) => setForm({ ...form, defaultMarkup: Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Default Contingency (%)</Label>
            <Input
              type="number"
              min={0}
              value={form.defaultContingency}
              onChange={(e) => setForm({ ...form, defaultContingency: Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Default Costs</CardTitle>
          <p className="text-sm text-muted-foreground">Base cost: {formatIDR(baseCost)}</p>
        </CardHeader>
        <CardContent>
          <CostItemsEditor items={costItems} onChange={setCostItems} costDatabaseItems={costDatabaseItems} />
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/templates")}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Template
        </Button>
      </div>
    </form>
  );
}
