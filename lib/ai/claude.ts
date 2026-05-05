import Anthropic from "@anthropic-ai/sdk"

export async function analyzeWithClaude(prompt: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required when AI_PROVIDER is claude")
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4000,
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }],
  })

  const block = response.content[0]
  return block?.type === "text" ? block.text : ""
}
