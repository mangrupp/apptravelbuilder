"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { costDatabaseItemSchema } from "@/lib/validation/costDatabase";
import type { ActionResult } from "@/lib/actions/customers";

export async function createCostDatabaseItem(input: unknown): Promise<ActionResult> {
  const parsed = costDatabaseItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  const item = await prisma.costDatabaseItem.create({
    data: {
      name: parsed.data.name,
      category: parsed.data.category,
      destination: parsed.data.destination || null,
      supplier: parsed.data.supplier || null,
      currency: parsed.data.currency,
      cost: parsed.data.cost,
      unit: parsed.data.unit || null,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/cost-database");
  return { success: true, id: item.id };
}

export async function updateCostDatabaseItem(id: string, input: unknown): Promise<ActionResult> {
  const parsed = costDatabaseItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  await prisma.costDatabaseItem.update({
    where: { id },
    data: {
      name: parsed.data.name,
      category: parsed.data.category,
      destination: parsed.data.destination || null,
      supplier: parsed.data.supplier || null,
      currency: parsed.data.currency,
      cost: parsed.data.cost,
      unit: parsed.data.unit || null,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/cost-database");
  return { success: true, id };
}

export async function deleteCostDatabaseItem(id: string): Promise<ActionResult> {
  await prisma.costDatabaseItem.delete({ where: { id } });
  revalidatePath("/cost-database");
  return { success: true };
}
