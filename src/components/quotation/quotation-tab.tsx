"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Loader2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { generateQuotation } from "@/lib/actions/quotations";
import { formatIDR, formatDateShort } from "@/lib/format";
import { toNumber } from "@/lib/decimal";
import { toast } from "@/store/toast";
import type { TripDetail } from "@/lib/queries/trips";

const STATUS_VARIANT: Record<string, "muted" | "secondary" | "success" | "warning"> = {
  DRAFT: "muted",
  SENT: "secondary",
  APPROVED: "success",
  EXPIRED: "warning",
};

export function QuotationTab({ trip }: { trip: TripDetail }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateQuotation(trip.id);
      if (!result.success) {
        toast({ title: "Could not generate quotation", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Quotation generated", variant: "success" });
      router.push(`/quotations/${result.id}`);
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Quotations</CardTitle>
        <Button onClick={handleGenerate} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Generate Quotation
        </Button>
      </CardHeader>
      <CardContent>
        {trip.quotations.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No quotations yet"
            description="Generate a quotation from this trip's current pricing to share with the customer."
          />
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {trip.quotations.map((q) => (
              <Link
                key={q.id}
                href={`/quotations/${q.id}`}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:opacity-80"
              >
                <div>
                  <p className="text-sm font-medium">{q.quotationNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    Created {formatDateShort(q.createdAt)} · Valid until {formatDateShort(q.validUntil)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold">{formatIDR(toNumber(q.sellingPrice))}</p>
                  <Badge variant={STATUS_VARIANT[q.status]}>{q.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
