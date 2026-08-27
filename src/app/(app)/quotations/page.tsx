import Link from "next/link";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { formatIDR, formatDateShort } from "@/lib/format";
import { toNumber } from "@/lib/decimal";
import type { Prisma } from "@prisma/client";

const STATUS_VARIANT: Record<string, "muted" | "secondary" | "success" | "warning"> = {
  DRAFT: "muted",
  SENT: "secondary",
  APPROVED: "success",
  EXPIRED: "warning",
};

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where: Prisma.QuotationWhereInput = q
    ? {
        OR: [
          { quotationNumber: { contains: q, mode: "insensitive" } },
          { customer: { name: { contains: q, mode: "insensitive" } } },
          { trip: { destination: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  const quotations = await prisma.quotation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { customer: true, trip: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Quotations</h1>
        <p className="text-sm text-muted-foreground">Every quotation you have sent or drafted.</p>
      </div>

      <SearchInput placeholder="Search by number, customer, destination..." />

      <Card>
        <CardContent className="p-0">
          {quotations.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={FileText}
                title={q ? "No quotations match your search" : "No quotations yet"}
                description="Generate a quotation from a trip's pricing tab."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <Link href={`/quotations/${q.id}`} className="font-medium hover:underline">
                        {q.quotationNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{q.customer.name}</TableCell>
                    <TableCell className="text-muted-foreground">{q.trip.destination}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateShort(q.createdAt)}</TableCell>
                    <TableCell className="font-medium">{formatIDR(toNumber(q.sellingPrice))}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[q.status]}>{q.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
