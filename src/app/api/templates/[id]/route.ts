import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { toNumber, toNumberOrNull } from "@/lib/decimal";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await prisma.tripTemplate.findUnique({
    where: { id },
    include: { costItems: true },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: template.id,
    name: template.name,
    destination: template.destination,
    country: template.country,
    city: template.city,
    duration: template.duration,
    travelStyle: template.travelStyle,
    defaultMarkup: toNumber(template.defaultMarkup),
    defaultContingency: toNumber(template.defaultContingency),
    costItems: template.costItems.map((item) => ({
      category: item.category,
      description: item.description,
      supplier: item.supplier ?? "",
      currency: item.currency,
      unitPrice: toNumber(item.unitPrice),
      quantity: toNumber(item.quantity),
      participants: item.participants,
      days: toNumberOrNull(item.days),
      nights: toNumberOrNull(item.nights),
      notes: item.notes ?? "",
    })),
  });
}
