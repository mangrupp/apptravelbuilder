export const SUPPORTED_CURRENCIES = ["IDR", "MYR", "SGD", "THB", "JPY", "USD", "EUR"] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export type CurrencyRates = Record<CurrencyCode, number>;

export const DEFAULT_CURRENCY_RATES: CurrencyRates = {
  IDR: 1,
  MYR: 3600,
  SGD: 12000,
  THB: 440,
  JPY: 105,
  USD: 16000,
  EUR: 17500,
};

/** Every rate is expressed as "1 unit of currency = X IDR". */
export function getExchangeRate(currency: CurrencyCode, rates: CurrencyRates): number {
  return rates[currency] ?? 1;
}

export function convertToIDR(amount: number, currency: CurrencyCode, rates: CurrencyRates): number {
  const rate = getExchangeRate(currency, rates);
  return Math.round(amount * rate * 100) / 100;
}

export function parseCurrencyRates(json: unknown): CurrencyRates {
  if (json && typeof json === "object") {
    return { ...DEFAULT_CURRENCY_RATES, ...(json as Partial<CurrencyRates>) };
  }
  return DEFAULT_CURRENCY_RATES;
}
