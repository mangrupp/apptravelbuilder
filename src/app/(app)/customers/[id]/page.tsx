import Link from "next/link";
import { notFound } from "next/navigation";
import { Plane, FileText, ArrowLeft } from "lucide-react";
import { getCustomerDetail } from "@/lib/queries/customers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatIDR, formatDateShort } from "@/lib/format";
import { toNumber } from "@/lib/decimal";

const QUOTATION_STATUS_VARIANT: Record<string, "muted" | "secondary" | "success" | "warning"> = {
  DRAFT: "muted",
  SENT: "secondary",
  APPROVED: "success",
  EXPIRED: "warning",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerDetail(id);
  if (!customer) notFound();

  const totalSpending = customer.trips.reduce((sum, t) => sum + toNumber(t.sellingPrice), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/customers" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to customers
        </Link>
      </div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">
            {customer.whatsapp || "No WhatsApp"} · {customer.email || "No email"}
          </p>
        </div>
        <div className="flex gap-2">
          <CustomerFormDialog
            customer={customer}
            trigger={<Button variant="outline">Edit Customer</Button>}
          />
          <Button asChild>
            <Link href={`/trips/new?customerId=${customer.id}`}>New Trip</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Total Trips</p>
            <p className="mt-1 text-2xl font-semibold">{customer.trips.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Total Quotations</p>
            <p className="mt-1 text-2xl font-semibold">{customer.quotations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Total Spending</p>
            <p className="mt-1 text-2xl font-semibold">{formatIDR(totalSpending)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trip History</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.trips.length === 0 ? (
              <EmptyState icon={Plane} title="No trips yet" description="Create a trip for this customer." />
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {customer.trips.map((trip) => (
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.id}`}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:opacity-80"
                  >
                    <div>
                      <p className="text-sm font-medium">{trip.destination}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateShort(trip.departureDate)} · {trip.days}D{trip.nights}N ·{" "}
                        {trip.traveler?.total ?? 0} travelers
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatIDR(toNumber(trip.sellingPrice))}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quotation History</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.quotations.length === 0 ? (
              <EmptyState icon={FileText} title="No quotations yet" description="Generate a quotation from a trip." />
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {customer.quotations.map((q) => (
                  <Link
                    key={q.id}
                    href={`/quotations/${q.id}`}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:opacity-80"
                  >
                    <div>
                      <p className="text-sm font-medium">{q.quotationNumber}</p>
                      <p className="text-xs text-muted-foreground">{q.trip.destination}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold">{formatIDR(toNumber(q.sellingPrice))}</p>
                      <Badge variant={QUOTATION_STATUS_VARIANT[q.status]}>{q.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{customer.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
