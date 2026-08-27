import { prisma } from "@/lib/db/prisma";

export async function getQuotationDetail(id: string) {
  return prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      trip: { include: { traveler: true } },
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export type QuotationDetail = NonNullable<Awaited<ReturnType<typeof getQuotationDetail>>>;
