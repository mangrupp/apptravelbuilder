"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { templateSchema } from "@/lib/validation/template";
import type { ActionResult } from "@/lib/actions/customers";

export async function createTemplate(input: unknown): Promise<ActionResult> {
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  const template = await prisma.tripTemplate.create({
    data: {
      name: parsed.data.name,
      destination: parsed.data.destination,
      country: parsed.data.country || null,
      city: parsed.data.city || null,
      duration: parsed.data.duration,
      travelStyle: parsed.data.travelStyle,
      description: parsed.data.description || null,
      defaultMarkup: parsed.data.defaultMarkup,
      defaultContingency: parsed.data.defaultContingency,
      costItems: {
        create: parsed.data.costItems.map((item) => ({
          category: item.category,
          description: item.description,
          supplier: item.supplier || null,
          currency: item.currency,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          participants: item.participants ?? null,
          days: item.days ?? null,
          nights: item.nights ?? null,
          notes: item.notes || null,
        })),
      },
    },
  });

  revalidatePath("/templates");
  return { success: true, id: template.id };
}

export async function updateTemplate(id: string, input: unknown): Promise<ActionResult> {
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  await prisma.$transaction([
    prisma.tripTemplateCostItem.deleteMany({ where: { templateId: id } }),
    prisma.tripTemplate.update({
      where: { id },
      data: {
        name: parsed.data.name,
        destination: parsed.data.destination,
        country: parsed.data.country || null,
        city: parsed.data.city || null,
        duration: parsed.data.duration,
        travelStyle: parsed.data.travelStyle,
        description: parsed.data.description || null,
        defaultMarkup: parsed.data.defaultMarkup,
        defaultContingency: parsed.data.defaultContingency,
        costItems: {
          create: parsed.data.costItems.map((item) => ({
            category: item.category,
            description: item.description,
            supplier: item.supplier || null,
            currency: item.currency,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            participants: item.participants ?? null,
            days: item.days ?? null,
            nights: item.nights ?? null,
            notes: item.notes || null,
          })),
        },
      },
    }),
  ]);

  revalidatePath("/templates");
  revalidatePath(`/templates/${id}`);
  return { success: true, id };
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
  await prisma.tripTemplate.delete({ where: { id } });
  revalidatePath("/templates");
  return { success: true };
}

