import { z } from "zod";
import { costCategoryEnum, currencyEnum } from "@/lib/validation/trip";

export const costDatabaseItemSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  category: costCategoryEnum,
  destination: z.string().trim().optional().or(z.literal("")),
  supplier: z.string().trim().optional().or(z.literal("")),
  currency: currencyEnum.default("IDR"),
  cost: z.coerce.number().min(0, "Cost cannot be negative"),
  unit: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type CostDatabaseItemInput = z.infer<typeof costDatabaseItemSchema>;
