import { z } from "zod";
import { currencyEnum, serviceFeeTypeEnum } from "@/lib/validation/trip";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export const settingsSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  companyAddress: z.string().trim().optional().or(z.literal("")),
  companyPhone: z.string().trim().optional().or(z.literal("")),
  companyEmail: z.string().trim().email().optional().or(z.literal("")),
  defaultCurrency: currencyEnum.default("IDR"),
  defaultMarkup: z.coerce.number().min(0).max(500).default(15),
  defaultContingency: z.coerce.number().min(0).max(100).default(5),
  defaultServiceFeeType: serviceFeeTypeEnum.default("PERCENTAGE"),
  defaultServiceFeeValue: z.coerce.number().min(0).default(0),
  quotationTerms: z.string().trim().optional().or(z.literal("")),
  showInternalFinancials: z.boolean().default(false),
  currencyRates: z.record(z.enum(SUPPORTED_CURRENCIES), z.coerce.number().positive()),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
