"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/require-user";
import { getSettingsForCurrentUser } from "@/lib/queries/settings";
import { computeTripPricing } from "@/lib/calculations/computeTrip";
import { toNumber } from "@/lib/decimal";
import type { ActionResult } from "@/lib/actions/customers";
import { aiRecommendationActionSchema } from "@/lib/ai/schema";

const applySchema = z.object({
  recommendationId: z.string().optional(),
  changes: z
    .array(
      z.object({
        costItemId: z.string(),
        action: aiRecommendationActionSchema,
        suggestedUnitPrice: z.number().min(0).optional(),
        suggestedQuantity: z.number().min(0).optional(),
      }),
    )
    .min(1, "Select at least one recommendation to apply"),
});

export async function applyAIOptimization(tripId: string, input: unknown): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const parsed = applySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { costs: true },
  });
  if (!trip) return { success: false, error: "Trip not found" };

  const settings = await getSettingsForCurrentUser(userId);
  const { changes, recommendationId } = parsed.data;

  const removedIds = new Set(
    changes.filter((c) => c.action === "REMOVE_ITEM").map((c) => c.costItemId),
  );

  const nextItems = trip.costs
    .filter((cost) => !removedIds.has(cost.id))
    .map((cost) => {
      const change = changes.find((c) => c.costItemId === cost.id && c.action !== "REMOVE_ITEM");
      return {
        id: cost.id,
        category: cost.category,
        description: cost.description,
        supplier: cost.supplier,
        currency: cost.currency,
        unitPrice: change?.suggestedUnitPrice ?? toNumber(cost.unitPrice),
        quantity: change?.suggestedQuantity ?? toNumber(cost.quantity),
        participants: cost.participants,
        days: cost.days,
        nights: cost.nights,
        notes: cost.notes,
        costDatabaseItemId: cost.costDatabaseItemId,
      };
    });

  const pricingConfig = {
    contingencyPercent: toNumber(trip.contingencyPercent),
    serviceFeeType: trip.serviceFeeType,
    serviceFeeValue: toNumber(trip.serviceFeeValue),
    markupPercentage: toNumber(trip.markupPercentage),
  };

  const computed = computeTripPricing(nextItems, pricingConfig, settings.currencyRates);

  try {
    await prisma.$transaction([
      prisma.tripCost.deleteMany({ where: { tripId } }),
      prisma.trip.update({
        where: { id: tripId },
        data: {
          baseCost: computed.baseCost,
          contingencyAmount: computed.contingencyAmount,
          serviceFee: computed.serviceFee,
          sellingPrice: computed.sellingPrice,
          profit: computed.profit,
          margin: computed.margin,
          costs: {
            create: computed.items.map(({ item, total, baseAmountIDR, exchangeRate }) => ({
              category: item.category,
              description: item.description,
              supplier: item.supplier,
              currency: item.currency,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              participants: item.participants,
              days: item.days,
              nights: item.nights,
              total,
              baseAmountIDR,
              exchangeRate,
              notes: item.notes,
              costDatabaseItemId: item.costDatabaseItemId,
            })),
          },
        },
      }),
      ...(recommendationId
        ? [
            prisma.aIRecommendation.update({
              where: { id: recommendationId },
              data: { status: "APPLIED", appliedAt: new Date() },
            }),
          ]
        : []),
    ]);

    revalidatePath(`/trips/${tripId}`);
    return { success: true, id: tripId };
  } catch (err) {
    console.error("applyAIOptimization failed", err);
    return { success: false, error: "Could not apply the optimization. Please try again." };
  }
}
