"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { updateSettings } from "@/lib/actions/settings";
import { CURRENCY_OPTIONS } from "@/lib/constants";
import { toast } from "@/store/toast";
import type { CurrencyRates } from "@/lib/currency";

export interface SettingsFormInitial {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  defaultCurrency: string;
  defaultMarkup: number;
  defaultContingency: number;
  defaultServiceFeeType: "FIXED" | "PERCENTAGE";
  defaultServiceFeeValue: number;
  quotationTerms: string;
  showInternalFinancials: boolean;
  currencyRates: CurrencyRates;
}

export function SettingsForm({ initial }: { initial: SettingsFormInitial }) {
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateSettings(form);
      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      toast({ title: "Settings saved", variant: "success" });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Shown on quotations and PDFs.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Company Name</Label>
            <Input
              required
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Company Address</Label>
            <Textarea
              value={form.companyAddress}
              onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Phone</Label>
            <Input
              value={form.companyPhone}
              onChange={(e) => setForm({ ...form, companyPhone: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.companyEmail}
              onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing Defaults</CardTitle>
          <CardDescription>Applied as starting values for new trips.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Default Currency</Label>
            <Select
              value={form.defaultCurrency}
              onValueChange={(v) => setForm({ ...form, defaultCurrency: v })}
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
          <div className="flex flex-col gap-1.5">
            <Label>Default Service Fee Type</Label>
            <Select
              value={form.defaultServiceFeeType}
              onValueChange={(v) => setForm({ ...form, defaultServiceFeeType: v as "FIXED" | "PERCENTAGE" })}
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
            <Label>Default Service Fee Value</Label>
            <Input
              type="number"
              min={0}
              value={form.defaultServiceFeeValue}
              onChange={(e) => setForm({ ...form, defaultServiceFeeValue: Number(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Currency Rates</CardTitle>
          <CardDescription>1 unit of currency = X IDR. Used to normalize all trip costs to IDR.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CURRENCY_OPTIONS.filter((c) => c !== "IDR").map((currency) => (
            <div key={currency} className="flex flex-col gap-1.5">
              <Label>{currency} → IDR</Label>
              <Input
                type="number"
                min={0}
                value={form.currencyRates[currency] ?? 0}
                onChange={(e) =>
                  setForm({
                    ...form,
                    currencyRates: { ...form.currencyRates, [currency]: Number(e.target.value) },
                  })
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quotation Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Default Quotation Terms</Label>
            <Textarea
              rows={4}
              value={form.quotationTerms}
              onChange={(e) => setForm({ ...form, quotationTerms: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.showInternalFinancials}
              onChange={(e) => setForm({ ...form, showInternalFinancials: e.target.checked })}
            />
            Show internal financials (cost, profit, margin) on new quotations by default
          </label>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
      </div>
    </form>
  );
}
