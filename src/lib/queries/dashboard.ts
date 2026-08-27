import { prisma } from "@/lib/db/prisma";
import { toNumber } from "@/lib/decimal";

export async function getDashboardData() {
  const [totalTrips, activeQuotations, trips, recentTrips, recentQuotations] = await Promise.all([
    prisma.trip.count(),
    prisma.quotation.count({ where: { status: { in: ["DRAFT", "SENT"] } } }),
    prisma.trip.findMany({ select: { sellingPrice: true, profit: true, status: true } }),
    prisma.trip.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { customer: true, traveler: true },
    }),
    prisma.quotation.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { customer: true, trip: true },
    }),
  ]);

  const estimatedRevenue = trips
    .filter((t) => t.status !== "CANCELLED")
    .reduce((sum, t) => sum + toNumber(t.sellingPrice), 0);
  const estimatedProfit = trips
    .filter((t) => t.status !== "CANCELLED")
    .reduce((sum, t) => sum + toNumber(t.profit), 0);

  return {
    totalTrips,
    activeQuotations,
    estimatedRevenue,
    estimatedProfit,
    recentTrips,
    recentQuotations,
  };
}
