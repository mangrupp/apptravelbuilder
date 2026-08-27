import { prisma } from "@/lib/db/prisma";
import { parseCurrencyRates, DEFAULT_CURRENCY_RATES } from "@/lib/currency";

export async function getOrCreateSettings(userId: string) {
  const existing = await prisma.settings.findUnique({ where: { userId } });
  if (existing) return existing;

  return prisma.settings.create({
    data: {
      userId,
      currencyRates: DEFAULT_CURRENCY_RATES,
    },
  });
}

export async function getSettingsForCurrentUser(userId: string) {
  const settings = await getOrCreateSettings(userId);
  return {
    ...settings,
    currencyRates: parseCurrencyRates(settings.currencyRates),
  };
}
