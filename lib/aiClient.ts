// lib/aiClient.ts
// Groq client + standaardmodel voor je jaarrekening-analyse

import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  throw new Error("🚨 Missing GROQ_API_KEY in environment");
}

// 1. Exporteer de Groq client
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

// 2. Standaardmodel voor je analyseroute
// Je gebruikt nu tijdelijk 8B; dit kun je later eenvoudig aanpassen.
export const DEFAULT_MODEL = "llama-3.3-70b-versatile";
// export const DEFAULT_MODEL = "llama-3.1-8b-instant";

// 3. (Optioneel) kleine helper voor JSON-mode calls
// Handig als je later vaker strikt JSON wilt afdwingen.
export async function chatJson<T = unknown>(opts: {
  system?: string;
  user: string;
  model?: string;
  maxTokens?: number;
}): Promise<T> {
  const { system, user, model = DEFAULT_MODEL, maxTokens = 256 } = opts;

  const completion = await groq.chat.completions.create({
    model,
    temperature: 0,
    max_completion_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      ...(system
        ? [
            {
              role: "system" as const,
              content: system,
            },
          ]
        : []),
      {
        role: "user",
        content: user,
      },
    ],
  });

  const content = completion.choices[0].message.content;
  return JSON.parse(content || "{}");
}
