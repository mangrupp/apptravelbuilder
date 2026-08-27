import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getTripDetail } from "@/lib/queries/trips";
import { getCurrentUserId } from "@/lib/auth/require-user";
import { getSettingsForCurrentUser } from "@/lib/queries/settings";
import { TripWorkspace } from "@/components/trips/trip-workspace";
import { toNumber } from "@/lib/decimal";
import { DEFAULT_CURRENCY_RATES } from "@/lib/currency";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const [trip, costDatabaseItems, settings] = await Promise.all([
    getTripDetail(id),
    prisma.costDatabaseItem.findMany({ orderBy: { name: "asc" } }),
    userId ? getSettingsForCurrentUser(userId) : null,
  ]);

  if (!trip) notFound();

  return (
    <TripWorkspace
      trip={trip}
      costDatabaseItems={costDatabaseItems.map((item) => ({ ...item, cost: toNumber(item.cost) }))}
      currencyRates={settings?.currencyRates ?? DEFAULT_CURRENCY_RATES}
    />
  );
}
