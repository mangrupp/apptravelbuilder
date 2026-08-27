import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export const currencyEnum = z.enum(SUPPORTED_CURRENCIES);
export const travelStyleEnum = z.enum(["BUDGET", "STANDARD", "PREMIUM", "LUXURY"]);
export const costCategoryEnum = z.enum([
  "FLIGHT",
  "ACCOMMODATION",
  "TRANSPORTATION",
  "ACTIVITY",
  "MEAL",
  "OTHER",
]);
export const serviceFeeTypeEnum = z.enum(["FIXED", "PERCENTAGE"]);
export const tripStatusEnum = z.enum(["DRAFT", "CONFIRMED", "CANCELLED", "COMPLETED"]);

export const tripDetailsSchema = z
  .object({
    destination: z.string().trim().min(2, "Destination is required"),
    country: z.string().trim().optional().or(z.literal("")),
    city: z.string().trim().optional().or(z.literal("")),
    departureCity: z.string().trim().optional().or(z.literal("")),
    tripType: z.string().trim().optional().or(z.literal("")),
    departureDate: z.coerce.date({ error: "Departure date is required" }),
    returnDate: z.coerce.date({ error: "Return date is required" }),
    travelStyle: travelStyleEnum.default("STANDARD"),
    currency: currencyEnum.default("IDR"),
    customerBudget: z.coerce.number().min(0).optional().nullable(),
  })
  .refine((data) => data.departureDate < data.returnDate, {
    message: "Return date must be after departure date",
    path: ["returnDate"],
  });

export type TripDetailsInput = z.infer<typeof tripDetailsSchema>;

export const costItemSchema = z.object({
  category: costCategoryEnum,
  description: z.string().trim().min(1, "Description is required"),
  supplier: z.string().trim().optional().or(z.literal("")),
  currency: currencyEnum.default("IDR"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than zero").default(1),
  participants: z.coerce.number().int().min(0).optional().nullable(),
  days: z.coerce.number().min(0).optional().nullable(),
  nights: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().trim().optional().or(z.literal("")),
  costDatabaseItemId: z.string().optional().nullable(),
});

export type CostItemFormInput = z.infer<typeof costItemSchema>;

export const pricingConfigSchema = z.object({
  contingencyPercent: z.coerce.number().min(0).max(100).default(5),
  serviceFeeType: serviceFeeTypeEnum.default("PERCENTAGE"),
  serviceFeeValue: z.coerce.number().min(0).default(0),
  markupPercentage: z.coerce.number().min(0).max(500).default(15),
});

export type PricingConfigInput = z.infer<typeof pricingConfigSchema>;
