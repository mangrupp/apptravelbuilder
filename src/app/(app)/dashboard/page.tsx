import Link from "next/link";
import { Plane, FileText, TrendingUp, Wallet, Plus, ArrowRight } from "lucide-react";
import { getDashboardData } from "@/lib/queries/dashboard";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatIDR, formatDateShort } from "@/lib/format";
import { toNumber } from "@/lib/decimal";

const QUOTATION_STATUS_VARIANT: Record<string, "muted" | "secondary" | "success" | "warning"> = {
  DRAFT: "muted",
  SENT: "secondary",
  APPROVED: "success",
  EXPIRED: "warning",
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Your trips, quotations, and revenue at a glance.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/trips/new">
            <Plus className="h-4 w-4" /> Create New Trip
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Trips" value={data.totalTrips.toLocaleString("id-ID")} icon={Plane} />
        <KpiCard
          label="Active Quotations"
          value={data.activeQuotations.toLocaleString("id-ID")}
          icon={FileText}
        />
        <KpiCard
          label="Estimated Revenue"
          value={formatIDR(data.estimatedRevenue)}
          icon={Wallet}
          accent="success"
        />
        <KpiCard
          label="Estimated Profit"
          value={formatIDR(data.estimatedProfit)}
          icon={TrendingUp}
          accent="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Trips</CardTitle>
            <Link href="/trips" className="flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentTrips.length === 0 ? (
              <EmptyState
                icon={Plane}
                title="No trips yet"
                description="Create your first trip to start building a quotation."
                actionLabel="Create New Trip"
                actionHref="/trips/new"
              />
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {data.recentTrips.map((trip) => (
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.id}`}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:opacity-80"
                  >
                    <div>
                      <p className="text-sm font-medium">{trip.destination}</p>
                      <p className="text-xs text-muted-foreground">
                        {trip.customer.name} · {trip.traveler?.total ?? 0} travelers ·{" "}
                        {formatDateShort(trip.departureDate)}
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
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Quotations</CardTitle>
            <Link
              href="/quotations"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentQuotations.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No quotations yet"
                description="Quotations appear here once you generate them from a trip."
              />
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {data.recentQuotations.map((q) => (
                  <Link
                    key={q.id}
                    href={`/quotations/${q.id}`}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:opacity-80"
                  >
                    <div>
                      <p className="text-sm font-medium">{q.quotationNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {q.customer.name} · {q.trip.destination}
                      </p>
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
    </div>
  );
}
