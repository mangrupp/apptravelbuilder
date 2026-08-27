import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getTripDetail } from "@/lib/queries/trips";
import { buildTripAIContext, formatTripContextForPrompt } from "@/lib/ai/context";
import { callAI, AIConfigError, AIRequestError } from "@/lib/ai/client";
import { aiOptimizationResponseSchema } from "@/lib/ai/schema";

const requestSchema = z.object({ tripId: z.string().min(1) });

const SYSTEM_PROMPT = `You are the "Travel Copilot" inside a travel agent's trip budgeting tool.
You analyze an existing trip's costs and suggest ways to fit the customer's budget while keeping a healthy margin.

STRICT RULES:
- You may ONLY propose changes to the cost items given to you (reference them by their exact costItemId).
- Never invent a new cost item, a new supplier, or a price that isn't a reasonable adjustment of an existing item's price/quantity.
- Prefer, in order: reducing an optional item's quantity, removing a clearly optional/non-essential item, then reducing a price only when it represents a realistic downgrade (e.g. moving from a 5-star to a 4-star equivalent).
- You never finalize numbers - the app will recompute every total deterministically from your suggested unitPrice/quantity. Do not report a computed "savings" number that isn't just (old total - new total) using the values you propose.
- Respond with ONLY a single JSON object matching this TypeScript type, no prose outside the JSON:
{
  "status": "FITS_BUDGET" | "OVER_BUDGET" | "NO_BUDGET_SET",
  "budgetDifference": number, // sellingPrice - customerBudget (0 if no budget set)
  "recommendations": Array<{
    "costItemId": string,
    "category": string,
    "description": string, // human-readable description of the suggested change
    "action": "REDUCE_PRICE" | "REDUCE_QUANTITY" | "REMOVE_ITEM" | "SWITCH_SUPPLIER",
    "suggestedUnitPrice"?: number,
    "suggestedQuantity"?: number,
    "rationale": string
  }>, // at most 5, ordered by impact
  "recommendedPlan": string, // 1-2 sentence summary of the overall recommended plan
  "summary": string // short overall analysis of budget fit and margin health
}`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsedBody = requestSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const trip = await getTripDetail(parsedBody.data.tripId);
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const context = buildTripAIContext(trip);

  try {
    const raw = await callAI(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: formatTripContextForPrompt(context) },
      ],
      { jsonMode: true },
    );

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "The AI returned a response we couldn't understand. Please try again." },
        { status: 422 },
      );
    }

    const validated = aiOptimizationResponseSchema.safeParse(parsedJson);
    if (!validated.success) {
      return NextResponse.json(
        { error: "The AI response didn't match the expected format. Please try again." },
        { status: 422 },
      );
    }

    const potentialSavings = validated.data.recommendations.reduce((sum, rec) => {
      const original = trip.costs.find((c) => c.id === rec.costItemId);
      if (!original) return sum;
      const originalTotal = Number(original.baseAmountIDR);
      let estimatedNewTotal = originalTotal;
      if (rec.action === "REMOVE_ITEM") estimatedNewTotal = 0;
      else if (rec.suggestedUnitPrice != null && Number(original.unitPrice) > 0) {
        estimatedNewTotal = originalTotal * (rec.suggestedUnitPrice / Number(original.unitPrice));
      } else if (rec.suggestedQuantity != null && Number(original.quantity) > 0) {
        estimatedNewTotal = originalTotal * (rec.suggestedQuantity / Number(original.quantity));
      }
      return sum + Math.max(0, originalTotal - estimatedNewTotal);
    }, 0);

    const recommendation = await prisma.aIRecommendation.create({
      data: {
        tripId: trip.id,
        responseJson: validated.data,
        potentialSavings,
      },
    });

    return NextResponse.json({ id: recommendation.id, ...validated.data, potentialSavings });
  } catch (err) {
    if (err instanceof AIConfigError) {
      return NextResponse.json({ error: err.message, code: "AI_NOT_CONFIGURED" }, { status: 503 });
    }
    if (err instanceof AIRequestError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("AI optimize failed", err);
    return NextResponse.json({ error: "Something went wrong while analyzing this trip." }, { status: 500 });
  }
}
