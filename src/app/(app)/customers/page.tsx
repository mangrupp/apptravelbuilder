import Link from "next/link";
import { Users } from "lucide-react";
import { getCustomersWithStats } from "@/lib/queries/customers";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { SearchInput } from "@/components/ui/search-input";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { CustomerRowActions } from "@/components/customers/customer-row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { formatIDR, formatDateShort } from "@/lib/format";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const customers = await getCustomersWithStats(q);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage your customer relationships.</p>
        </div>
        <CustomerFormDialog />
      </div>

      <div className="flex items-center justify-between">
        <SearchInput placeholder="Search customers..." />
      </div>

      <Card>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title={q ? "No customers match your search" : "No customers yet"}
                description="Add a customer to start creating trips and quotations for them."
                actionLabel={q ? undefined : "Add Customer"}
                actionHref={q ? undefined : undefined}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Trips</TableHead>
                  <TableHead>Last Trip</TableHead>
                  <TableHead>Total Spending</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Link href={`/customers/${customer.id}`} className="font-medium hover:underline">
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{customer.whatsapp || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{customer.email || "—"}</TableCell>
                    <TableCell>{customer.tripsCount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.lastTrip ? formatDateShort(customer.lastTrip) : "—"}
                    </TableCell>
                    <TableCell className="font-medium">{formatIDR(customer.totalSpending)}</TableCell>
                    <TableCell>
                      <CustomerRowActions customer={customer} />
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
