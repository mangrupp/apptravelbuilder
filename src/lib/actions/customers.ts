"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { customerSchema } from "@/lib/validation/customer";

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

export async function createCustomer(input: unknown): Promise<ActionResult> {
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  const customer = await prisma.customer.create({
    data: {
      name: parsed.data.name,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email || null,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/customers");
  return { success: true, id: customer.id };
}

export async function updateCustomer(id: string, input: unknown): Promise<ActionResult> {
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  await prisma.customer.update({
    where: { id },
    data: {
      name: parsed.data.name,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email || null,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { success: true, id };
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  try {
    await prisma.customer.delete({ where: { id } });
  } catch {
    return {
      success: false,
      error: "Unable to delete this customer. They may have existing trips or quotations.",
    };
  }
  revalidatePath("/customers");
  return { success: true };
}
