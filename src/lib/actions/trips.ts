"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/require-user";
import { getSettingsForCurrentUser } from "@/lib/queries/settings";
import { customerSchema, travelerSchema } from "@/lib/validation/customer";
import { tripDetailsSchema, costItemSchema, pricingConfigSchema } from "@/lib/validation/trip";
import { computeTripPricing } from "@/lib/calculations/computeTrip";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/customers";

const createTripSchema = z.object({
  customer: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("existing"), customerId: z.string().min(1, "Select a customer") }),
    z.object({ mode: z.literal("new") }).extend(customerSchema.shape),
  ]),
  traveler: travelerSchema,
  details: tripDetailsSchema,
  costItems: z.array(costItemSchema).min(1, "Add at least one cost item"),
  pricing: pricingConfigSchema,
});

export async function createTrip(input: unknown): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const parsed = createTripSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid trip data" };
  }

  const { customer, traveler, details, costItems, pricing } = parsed.data;
  const settings = await getSettingsForCurrentUser(userId);

  const computed = computeTripPricing(costItems, pricing, settings.currencyRates);

  const start = new Date(details.departureDate);
  const end = new Date(details.returnDate);
  const diffMs = end.getTime() - start.getTime();
  const days = Math.round(diffMs / 86_400_000) + 1;
  const nights = days - 1;

  try {
    const trip = await prisma.$transaction(async (tx) => {
      let customerId: string;
      if (customer.mode === "existing") {
        customerId = customer.customerId;
      } else {
        const created = await tx.customer.create({
          data: {
            name: customer.name,
            whatsapp: customer.whatsapp || null,
            email: customer.email || null,
            notes: customer.notes || null,
          },
        });
        customerId = created.id;
      }

      const newTrip = await tx.trip.create({
        data: {
          customerId,
          destination: details.destination,
          country: details.country || null,
          city: details.city || null,
          departureCity: details.departureCity || null,
          tripType: details.tripType || null,
          departureDate: start,
          returnDate: end,
          days,
          nights,
          travelStyle: details.travelStyle,
          currency: details.currency,
          customerBudget: details.customerBudget ?? null,
          contingencyPercent: pricing.contingencyPercent,
          serviceFeeType: pricing.serviceFeeType,
          serviceFeeValue: pricing.serviceFeeValue,
          baseCost: computed.baseCost,
          contingencyAmount: computed.contingencyAmount,
          serviceFee: computed.serviceFee,
          markupPercentage: pricing.markupPercentage,
          sellingPrice: computed.sellingPrice,
          profit: computed.profit,
          margin: computed.margin,
          traveler: {
            create: {
              adults: traveler.adults,
              children: traveler.children,
              infants: traveler.infants,
              total: traveler.adults + traveler.children + traveler.infants,
            },
          },
          costs: {
            create: computed.items.map(({ item, total, baseAmountIDR, exchangeRate }) => ({
              category: item.category,
              description: item.description,
              supplier: item.supplier || null,
              currency: item.currency,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              participants: item.participants ?? null,
              days: item.days ?? null,
              nights: item.nights ?? null,
              total,
              baseAmountIDR,
              exchangeRate,
              notes: item.notes || null,
              costDatabaseItemId: item.costDatabaseItemId || null,
            })),
          },
        },
      });

      return newTrip;
    });

    revalidatePath("/dashboard");
    revalidatePath("/trips");
    revalidatePath("/customers");
    return { success: true, id: trip.id };
  } catch (err) {
    console.error("createTrip failed", err);
    return { success: false, error: "Could not save the trip. Please try again." };
  }
}

const updateTripCostsSchema = z.object({
  costItems: z.array(costItemSchema).min(1, "Add at least one cost item"),
  pricing: pricingConfigSchema,
});

export async function updateTripCostsAndPricing(tripId: string, input: unknown): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const parsed = updateTripCostsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return { success: false, error: "Trip not found" };

  const settings = await getSettingsForCurrentUser(userId);
  const { costItems, pricing } = parsed.data;
  const computed = computeTripPricing(costItems, pricing, settings.currencyRates);

  try {
    await prisma.$transaction([
      prisma.tripCost.deleteMany({ where: { tripId } }),
      prisma.trip.update({
        where: { id: tripId },
        data: {
          contingencyPercent: pricing.contingencyPercent,
          serviceFeeType: pricing.serviceFeeType,
          serviceFeeValue: pricing.serviceFeeValue,
          markupPercentage: pricing.markupPercentage,
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
              supplier: item.supplier || null,
              currency: item.currency,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              participants: item.participants ?? null,
              days: item.days ?? null,
              nights: item.nights ?? null,
              total,
              baseAmountIDR,
              exchangeRate,
              notes: item.notes || null,
              costDatabaseItemId: item.costDatabaseItemId || null,
            })),
          },
        },
      }),
    ]);

    revalidatePath(`/trips/${tripId}`);
    revalidatePath("/dashboard");
    return { success: true, id: tripId };
  } catch (err) {
    console.error("updateTripCostsAndPricing failed", err);
    return { success: false, error: "Could not update the trip. Please try again." };
  }
}

export async function updateTripStatus(tripId: string, status: string): Promise<ActionResult> {
  const validStatus = z.enum(["DRAFT", "CONFIRMED", "CANCELLED", "COMPLETED"]).safeParse(status);
  if (!validStatus.success) return { success: false, error: "Invalid status" };

  await prisma.trip.update({ where: { id: tripId }, data: { status: validStatus.data } });
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/trips");
  revalidatePath("/dashboard");
  return { success: true, id: tripId };
}
