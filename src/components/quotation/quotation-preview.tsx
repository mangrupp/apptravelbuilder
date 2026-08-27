"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { updateQuotationStatus, toggleQuotationInternalFinancials } from "@/lib/actions/quotations";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatIDR, formatDate } from "@/lib/format";
import { toNumber } from "@/lib/decimal";
import { toast } from "@/store/toast";
import type { QuotationDetail } from "@/lib/queries/quotations";
import type { SettingsInput } from "@/lib/validation/settings";

const STATUS_VARIANT: Record<string, "muted" | "secondary" | "success" | "warning"> = {
  DRAFT: "muted",
  SENT: "secondary",
  APPROVED: "success",
  EXPIRED: "warning",
};

export function QuotationPreview({
  quotation,
  company,
}: {
  quotation: QuotationDetail;
  company: Pick<SettingsInput, "companyName" | "companyAddress" | "companyPhone" | "companyEmail">;
}) {
  const router = useRouter();
  const [statusPending, startStatusTransition] = useTransition();
  const [downloadPending, startDownloadTransition] = useTransition();
  const [showInternal, setShowInternal] = useState(quotation.showInternalFinancials);
  const [togglePending, startToggleTransition] = useTransition();

  function handleStatusChange(status: string) {
    startStatusTransition(async () => {
      await updateQuotationStatus(quotation.id, status);
      toast({ title: `Status changed to ${status}`, variant: "success" });
      router.refresh();
    });
  }

  function handleToggleInternal() {
    const next = !showInternal;
    setShowInternal(next);
    startToggleTransition(async () => {
      await toggleQuotationInternalFinancials(quotation.id, next);
    });
  }

  function handleDownload() {
    startDownloadTransition(async () => {
      try {
        const res = await fetch(`/api/quotations/${quotation.id}/pdf`);
        if (!res.ok) throw new Error("Failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${quotation.quotationNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        toast({ title: "Could not download PDF", description: "Please try again.", variant: "destructive" });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{quotation.quotationNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {quotation.customer.name} · {quotation.trip.destination}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleToggleInternal} disabled={togglePending}>
            {showInternal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showInternal ? "Hide" : "Show"} Internal Financials
          </Button>
          <Select value={quotation.status} onValueChange={handleStatusChange} disabled={statusPending}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["DRAFT", "SENT", "APPROVED", "EXPIRED"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleDownload} disabled={downloadPending}>
            {downloadPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download PDF
          </Button>
        </div>
      </div>

      <Card className="mx-auto w-full max-w-3xl">
        <CardContent className="flex flex-col gap-6 p-8">
          <div className="flex items-start justify-between border-b border-border pb-6">
            <div>
              <p className="text-lg font-semibold">{company.companyName}</p>
              {company.companyAddress && <p className="text-sm text-muted-foreground">{company.companyAddress}</p>}
              {company.companyPhone && <p className="text-sm text-muted-foreground">{company.companyPhone}</p>}
              {company.companyEmail && <p className="text-sm text-muted-foreground">{company.companyEmail}</p>}
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold">QUOTATION</p>
              <p className="text-sm text-muted-foreground">{quotation.quotationNumber}</p>
              <p className="text-sm text-muted-foreground">{formatDate(quotation.createdAt)}</p>
              <Badge variant={STATUS_VARIANT[quotation.status]} className="mt-2">
                {quotation.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Prepared For</p>
              <p className="mt-1 font-medium">{quotation.customer.name}</p>
              {quotation.customer.whatsapp && (
                <p className="text-sm text-muted-foreground">{quotation.customer.whatsapp}</p>
              )}
              {quotation.customer.email && <p className="text-sm text-muted-foreground">{quotation.customer.email}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Trip</p>
              <p className="mt-1 font-medium">
                {quotation.trip.destination}
                {quotation.trip.country ? `, ${quotation.trip.country}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {quotation.trip.days}D{quotation.trip.nights}N · {formatDate(quotation.trip.departureDate)} –{" "}
                {formatDate(quotation.trip.returnDate)}
              </p>
              <p className="text-sm text-muted-foreground">
                {quotation.trip.traveler?.total ?? 0} travelers
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Package Summary</p>
            <div className="mt-2 flex flex-col divide-y divide-border rounded-lg border border-border">
              {quotation.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span>{CATEGORY_LABELS[item.category]}</span>
                  <span className="font-medium">{formatIDR(toNumber(item.amount))}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
              <span className="font-semibold">Total Package Price</span>
              <span className="text-lg font-semibold text-primary">
                {formatIDR(toNumber(quotation.sellingPrice))}
              </span>
            </div>
          </div>

          {showInternal && (
            <div className="rounded-lg border border-dashed border-warning/50 bg-warning/5 p-4">
              <p className="text-xs font-semibold uppercase text-warning">Internal Only — Not Shown to Customer</p>
              <div className="mt-2 flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Cost</span>
                  <span>{formatIDR(toNumber(quotation.trip.baseCost))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profit</span>
                  <span>{formatIDR(toNumber(quotation.trip.profit))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margin</span>
                  <span>{toNumber(quotation.trip.margin).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Validity & Payment Terms</p>
            <p className="mt-1 text-sm text-muted-foreground">Valid until {formatDate(quotation.validUntil)}.</p>
            {quotation.terms && (
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{quotation.terms}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
