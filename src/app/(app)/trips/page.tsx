import Link from "next/link";
import { Plane, Plus } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { formatIDR, formatDateShort } from "@/lib/format";
import { toNumber } from "@/lib/decimal";
import { getMarginStatus } from "@/lib/calculations/pricing";
import type { Prisma } from "@prisma/client";

const STATUS_VARIANT: Record<string, "muted" | "secondary" | "success" | "destructive"> = {
  DRAFT: "muted",
  CONFIRMED: "success",
  CANCELLED: "destructive",
  COMPLETED: "secondary",
};

const MARGIN_BADGE_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  HEALTHY: "success",
  WARNING: "warning",
  LOW_MARGIN: "warning",
  LOSS: "destructive",
};

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where: Prisma.TripWhereInput = q
    ? {
        OR: [
          { destination: { contains: q, mode: "insensitive" } },
          { customer: { name: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  const trips = await prisma.trip.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { customer: true, traveler: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trips</h1>
          <p className="text-sm text-muted-foreground">Every trip you have built a budget for.</p>
        </div>
        <Button asChild>
          <Link href="/trips/new">
            <Plus className="h-4 w-4" /> Create New Trip
          </Link>
        </Button>
      </div>

      <SearchInput placeholder="Search by destination or customer..." />

      <Card>
        <CardContent className="p-0">
          {trips.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Plane}
                title={q ? "No trips match your search" : "No trips yet"}
                description="Create a trip to start calculating budgets and quotations."
                actionLabel={q ? undefined : "Create New Trip"}
                actionHref={q ? undefined : "/trips/new"}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destination</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Travelers</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip) => {
                  const margin = toNumber(trip.margin);
                  return (
                    <TableRow key={trip.id} className="cursor-pointer">
                      <TableCell>
                        <Link href={`/trips/${trip.id}`} className="font-medium hover:underline">
                          {trip.destination}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{trip.customer.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateShort(trip.departureDate)} · {trip.days}D{trip.nights}N
                      </TableCell>
                      <TableCell>{trip.traveler?.total ?? 0}</TableCell>
                      <TableCell className="font-medium">{formatIDR(toNumber(trip.sellingPrice))}</TableCell>
                      <TableCell>
                        <Badge variant={MARGIN_BADGE_VARIANT[getMarginStatus(margin)]}>
                          {margin.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[trip.status]}>{trip.status}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
