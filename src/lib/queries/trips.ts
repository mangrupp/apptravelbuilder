import { prisma } from "@/lib/db/prisma";

export async function getTripDetail(id: string) {
  return prisma.trip.findUnique({
    where: { id },
    include: {
      customer: true,
      traveler: true,
      costs: { orderBy: { createdAt: "asc" } },
      quotations: { orderBy: { createdAt: "desc" } },
      aiRecommendations: { orderBy: { createdAt: "desc" } },
    },
  });
}

export type TripDetail = NonNullable<Awaited<ReturnType<typeof getTripDetail>>>;
