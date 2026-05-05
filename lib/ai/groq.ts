import Groq from "groq-sdk"

export async function analyzeWithGroq(prompt: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is required when AI_PROVIDER is groq")
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 4000,
    response_format: { type: "json_object" },
  })

  return response.choices[0]?.message?.content ?? ""
}
