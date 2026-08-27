"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addDays } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/require-user";
import { getSettingsForCurrentUser } from "@/lib/queries/settings";
import { toNumber } from "@/lib/decimal";
import type { ActionResult } from "@/lib/actions/customers";
import type { CostCategory } from "@prisma/client";

async function nextQuotationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.quotation.count();
  return `QUO-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function generateQuotation(tripId: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { costs: true, customer: true },
  });
  if (!trip) return { success: false, error: "Trip not found" };

  const settings = await getSettingsForCurrentUser(userId);

  const baseCost = toNumber(trip.baseCost);
  const sellingPrice = toNumber(trip.sellingPrice);
  const scaleFactor = baseCost > 0 ? sellingPrice / baseCost : 1;

  const categoryTotals = trip.costs.reduce((acc, cost) => {
    acc[cost.category] = (acc[cost.category] ?? 0) + toNumber(cost.baseAmountIDR);
    return acc;
  }, {} as Record<string, number>);

  const quotationNumber = await nextQuotationNumber();

  try {
    const quotation = await prisma.quotation.create({
      data: {
        tripId: trip.id,
        quotationNumber,
        customerId: trip.customerId,
        subtotal: baseCost,
        contingency: toNumber(trip.contingencyAmount),
        serviceFee: toNumber(trip.serviceFee),
        sellingPrice,
        validUntil: addDays(new Date(), 14),
        terms: settings.quotationTerms || DEFAULT_TERMS,
        showInternalFinancials: settings.showInternalFinancials,
        items: {
          create: Object.entries(categoryTotals)
            .filter(([, total]) => total > 0)
            .map(([category, total], index) => ({
              category: category as CostCategory,
              description: CATEGORY_DESCRIPTIONS[category] ?? category,
              amount: Math.round(total * scaleFactor),
              sortOrder: index,
            })),
        },
      },
    });

    revalidatePath(`/trips/${tripId}`);
    revalidatePath("/quotations");
    return { success: true, id: quotation.id };
  } catch (err) {
    console.error("generateQuotation failed", err);
    return { success: false, error: "Could not generate the quotation. Please try again." };
  }
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  FLIGHT: "Flights",
  ACCOMMODATION: "Accommodation",
  TRANSPORTATION: "Local Transportation",
  ACTIVITY: "Activities & Excursions",
  MEAL: "Meals",
  OTHER: "Other Arrangements",
};

const DEFAULT_TERMS = `50% deposit required to confirm booking. Balance due 14 days before departure.
Prices are subject to availability at time of booking. Cancellation policy applies as per standard terms.`;

export async function updateQuotationStatus(id: string, status: string): Promise<ActionResult> {
  const validStatus = z.enum(["DRAFT", "SENT", "APPROVED", "EXPIRED"]).safeParse(status);
  if (!validStatus.success) return { success: false, error: "Invalid status" };

  const quotation = await prisma.quotation.update({
    where: { id },
    data: { status: validStatus.data },
  });

  revalidatePath(`/quotations/${id}`);
  revalidatePath("/quotations");
  revalidatePath(`/trips/${quotation.tripId}`);
  return { success: true, id };
}

export async function toggleQuotationInternalFinancials(id: string, show: boolean): Promise<ActionResult> {
  await prisma.quotation.update({ where: { id }, data: { showInternalFinancials: show } });
  revalidatePath(`/quotations/${id}`);
  return { success: true, id };
}
