import { prisma } from "@/lib/db/prisma";
import { toNumber } from "@/lib/decimal";

export async function getCustomersWithStats(search?: string) {
  const customers = await prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { whatsapp: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    include: {
      trips: {
        select: { id: true, sellingPrice: true, departureDate: true },
        orderBy: { departureDate: "desc" },
      },
    },
  });

  return customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    whatsapp: customer.whatsapp,
    email: customer.email,
    notes: customer.notes,
    tripsCount: customer.trips.length,
    lastTrip: customer.trips[0]?.departureDate ?? null,
    totalSpending: customer.trips.reduce((sum, t) => sum + toNumber(t.sellingPrice), 0),
  }));
}

export async function getCustomerDetail(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      trips: { orderBy: { createdAt: "desc" }, include: { traveler: true } },
      quotations: { orderBy: { createdAt: "desc" }, include: { trip: true } },
    },
  });
}
