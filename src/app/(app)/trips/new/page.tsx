import { prisma } from "@/lib/db/prisma";
import { TripWizard } from "@/components/trips/trip-wizard";
import { getCurrentUserId } from "@/lib/auth/require-user";
import { getSettingsForCurrentUser } from "@/lib/queries/settings";
import { toNumber } from "@/lib/decimal";
import { DEFAULT_CURRENCY_RATES } from "@/lib/currency";

export default async function NewTripPage() {
  const userId = await getCurrentUserId();
  const [customers, costDatabaseItems, settings] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.costDatabaseItem.findMany({ orderBy: { name: "asc" } }),
    userId ? getSettingsForCurrentUser(userId) : null,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create New Trip</h1>
        <p className="text-sm text-muted-foreground">
          Customer, trip details, costs, and pricing — then save to unlock scenarios, AI, and quotations.
        </p>
      </div>
      <TripWizard
        customers={customers.map((c) => ({ id: c.id, name: c.name, whatsapp: c.whatsapp, email: c.email }))}
        costDatabaseItems={costDatabaseItems.map((item) => ({ ...item, cost: toNumber(item.cost) }))}
        currencyRates={settings?.currencyRates ?? DEFAULT_CURRENCY_RATES}
      />
    </div>
  );
}
