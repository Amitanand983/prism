import { analyzeWithClaude } from "./claude"
import { analyzeWithGemini } from "./gemini"
import { analyzeWithGroq } from "./groq"
import { analyzeWithOpenAI } from "./openai"
import { aiOutputSchema, type AIOutput } from "./schemas"

type AIProvider = "groq" | "openai" | "claude" | "gemini"

function getProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? "groq"

  if (provider === "groq" || provider === "openai" || provider === "claude" || provider === "gemini") {
    return provider
  }

  throw new Error(`Unsupported AI_PROVIDER "${provider}". Use groq, openai, claude, or gemini.`)
}

export async function analyzeWithAI(prompt: string): Promise<string> {
  switch (getProvider()) {
    case "openai":
      return analyzeWithOpenAI(prompt)
    case "claude":
      return analyzeWithClaude(prompt)
    case "gemini":
      return analyzeWithGemini(prompt)
    case "groq":
      return analyzeWithGroq(prompt)
  }
}

export function parseAIResponse(raw: string): AIOutput {
  const cleaned = raw.replace(/```json|```/g, "").trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error("AI provider returned invalid JSON")
  }

  const result = aiOutputSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(`AI response did not match the expected report schema: ${result.error.message}`)
  }

  return result.data
}
