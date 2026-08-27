export class AIConfigError extends Error {}
export class AIRequestError extends Error {}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function isAIConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY);
}

/**
 * Thin wrapper around any OpenAI-compatible /chat/completions endpoint.
 * Kept deliberately dumb: no retries, no streaming - the callers decide how
 * to interpret and validate the raw text response.
 */
export async function callAI(
  messages: ChatMessage[],
  options: { jsonMode?: boolean } = {},
): Promise<string> {
  if (!isAIConfigured()) {
    throw new AIConfigError("AI is not configured. Set AI_API_KEY to enable the Travel Copilot.");
  }

  const baseUrl = process.env.AI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new AIRequestError("Could not reach the AI service. Please try again.");
  }

  if (!response.ok) {
    throw new AIRequestError(`AI service returned an error (${response.status}).`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new AIRequestError("AI service returned an empty response.");
  }
  return content;
}
