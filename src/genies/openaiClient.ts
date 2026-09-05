import OpenAI from "openai";

/**
 * Helper to call the OpenAI chat API and force JSON output.
 */
export async function callJsonModel({ system, user }: { system: string; user: any }) {
  // Read credentials at request time so a build can complete without secrets.
  // Prefer the local OpenClaw Gateway so a Codex subscription can be used.
  // Fall back to direct OpenAI API-key billing when OpenClaw is not configured.
  const openclawToken = process.env.OPENCLAW_GATEWAY_TOKEN;
  const apiKey = openclawToken || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "No AI credentials configured. Set OPENCLAW_GATEWAY_TOKEN for OpenClaw or OPENAI_API_KEY for direct API access."
    );
  }

  const baseURL = openclawToken
    ? process.env.OPENCLAW_BASE_URL || "http://127.0.0.1:18789/v1"
    : undefined;
  const openai = new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
  const model =
    process.env.OPENAI_MODEL || (openclawToken ? "openclaw/default" : "gpt-4o");

  const response = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: typeof user === "string" ? user : JSON.stringify(user),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  try {
    return JSON.parse(content);
  } catch (err) {
    console.error("Failed to parse JSON from model:", content);
    throw err;
  }
}
