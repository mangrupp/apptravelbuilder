import { z } from "zod";

export const aiRecommendationActionSchema = z.enum([
  "REDUCE_PRICE",
  "REDUCE_QUANTITY",
  "REMOVE_ITEM",
  "SWITCH_SUPPLIER",
]);

export const aiRecommendationItemSchema = z.object({
  costItemId: z.string(),
  category: z.string(),
  description: z.string(),
  action: aiRecommendationActionSchema,
  suggestedUnitPrice: z.number().min(0).optional(),
  suggestedQuantity: z.number().min(0).optional(),
  rationale: z.string(),
});

export const aiOptimizationResponseSchema = z.object({
  status: z.enum(["FITS_BUDGET", "OVER_BUDGET", "NO_BUDGET_SET"]),
  budgetDifference: z.number(),
  recommendations: z.array(aiRecommendationItemSchema).max(6),
  recommendedPlan: z.string(),
  summary: z.string(),
});

export type AIOptimizationResponse = z.infer<typeof aiOptimizationResponseSchema>;
export type AIRecommendationItem = z.infer<typeof aiRecommendationItemSchema>;

export const aiChatResponseSchema = z.object({
  answer: z.string(),
});

export type AIChatResponse = z.infer<typeof aiChatResponseSchema>;
