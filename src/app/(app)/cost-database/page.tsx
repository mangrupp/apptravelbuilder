import { Database } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { CategoryFilter } from "@/components/cost-database/category-filter";
import { CostDatabaseFormDialog } from "@/components/cost-database/cost-database-form-dialog";
import { CostDatabaseRowActions } from "@/components/cost-database/cost-database-row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { toNumber } from "@/lib/decimal";
import type { CostCategory } from "@/lib/calculations/types";
import type { Prisma } from "@prisma/client";

export default async function CostDatabasePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;

  const where: Prisma.CostDatabaseItemWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { supplier: { contains: q, mode: "insensitive" } },
      { destination: { contains: q, mode: "insensitive" } },
    ];
  }
  if (category) {
    where.category = category as CostCategory;
  }

  const items = await prisma.costDatabaseItem.findMany({
    where,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cost Database</h1>
          <p className="text-sm text-muted-foreground">
            Reusable supplier prices you can drop straight into any trip.
          </p>
        </div>
        <CostDatabaseFormDialog />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search by name, supplier, destination..." />
        <CategoryFilter />
      </div>

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Database}
                title={q || category ? "No items match your filters" : "No cost database items yet"}
                description="Add supplier prices here so you never re-type them while building a trip."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.name}
                      {item.isDemo && (
                        <Badge variant="muted" className="ml-2">
                          Demo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{CATEGORY_LABELS[item.category]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.destination || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{item.supplier || "—"}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(toNumber(item.cost), item.currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.unit || "—"}</TableCell>
                    <TableCell>
                      <CostDatabaseRowActions item={{ ...item, cost: toNumber(item.cost) }} />
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
