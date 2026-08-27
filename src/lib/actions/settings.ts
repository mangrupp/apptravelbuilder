"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth/require-user";
import { getOrCreateSettings } from "@/lib/queries/settings";
import { settingsSchema } from "@/lib/validation/settings";
import { prisma } from "@/lib/db/prisma";
import type { ActionResult } from "@/lib/actions/customers";

export async function updateSettings(input: unknown): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  await getOrCreateSettings(userId);

  await prisma.settings.update({
    where: { userId },
    data: {
      companyName: parsed.data.companyName,
      companyAddress: parsed.data.companyAddress || null,
      companyPhone: parsed.data.companyPhone || null,
      companyEmail: parsed.data.companyEmail || null,
      defaultCurrency: parsed.data.defaultCurrency,
      defaultMarkup: parsed.data.defaultMarkup,
      defaultContingency: parsed.data.defaultContingency,
      defaultServiceFeeType: parsed.data.defaultServiceFeeType,
      defaultServiceFeeValue: parsed.data.defaultServiceFeeValue,
      quotationTerms: parsed.data.quotationTerms || null,
      showInternalFinancials: parsed.data.showInternalFinancials,
      currencyRates: parsed.data.currencyRates,
    },
  });

  revalidatePath("/settings");
  return { success: true };
}
