import { z } from "zod";
import { travelStyleEnum } from "@/lib/validation/trip";
import { costItemSchema } from "@/lib/validation/trip";

export const templateSchema = z.object({
  name: z.string().trim().min(2, "Template name is required"),
  destination: z.string().trim().min(2, "Destination is required"),
  country: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  duration: z.coerce.number().int().min(1, "Duration must be at least 1 day"),
  travelStyle: travelStyleEnum.default("STANDARD"),
  description: z.string().trim().optional().or(z.literal("")),
  defaultMarkup: z.coerce.number().min(0).max(500).default(15),
  defaultContingency: z.coerce.number().min(0).max(100).default(5),
  costItems: z.array(costItemSchema.omit({ costDatabaseItemId: true })).default([]),
});

export type TemplateInput = z.infer<typeof templateSchema>;
