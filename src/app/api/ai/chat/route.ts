import { NextResponse } from "next/server";
import { z } from "zod";
import { getTripDetail } from "@/lib/queries/trips";
import { buildTripAIContext, formatTripContextForPrompt } from "@/lib/ai/context";
import { callAI, AIConfigError, AIRequestError } from "@/lib/ai/client";

const requestSchema = z.object({
  tripId: z.string().min(1),
  question: z.string().min(1).max(1000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(10)
    .optional(),
});

const SYSTEM_PROMPT = `You are "Travel Copilot", an assistant embedded in a travel agent's trip budgeting tool.
You help the agent understand and reason about ONE trip's numbers so they can decide what to do next.

RULES:
- All authoritative totals (base cost, contingency, service fee, selling price, profit, margin) are provided to you below and were computed by the app's deterministic engine - treat them as ground truth.
- You may do simple illustrative arithmetic to answer "what if" questions (e.g. "what if markup were 20%?"), but always make clear these are estimates for discussion, not saved changes. The agent must apply any change through the app itself.
- Never invent supplier prices, costs, or cost items that are not present in the data given to you.
- Answer in the same language the agent used (Indonesian or English). Keep answers concise and actionable - a travel agent is reading this on the clock.`;

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
    const answer = await callAI([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Trip data:\n${formatTripContextForPrompt(context)}` },
      ...(parsedBody.data.history ?? []),
      { role: "user", content: parsedBody.data.question },
    ]);

    return NextResponse.json({ answer });
  } catch (err) {
    if (err instanceof AIConfigError) {
      return NextResponse.json({ error: err.message, code: "AI_NOT_CONFIGURED" }, { status: 503 });
    }
    if (err instanceof AIRequestError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("AI chat failed", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
