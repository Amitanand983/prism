import { z } from "zod"

export const aiOutputSchema = z.object({
  summary: z.string().min(1),
  llm_score: z.number().min(1).max(10),
  risk_reason: z.string().min(1),
  critical_files: z
    .array(
      z.object({
        file: z.string().min(1),
        reason: z.string().min(1),
        risk_contribution: z.enum(["LOW", "MEDIUM", "HIGH"]),
      }),
    )
    .default([]),
  reviewer_blind_spots: z.array(z.string().min(1)).default([]),
  dependency_impact: z.string().default(""),
  auto_comments: z
    .array(
      z.object({
        file: z.string().min(1),
        line_hint: z.string().min(1),
        comment: z.string().min(1),
        severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
      }),
    )
    .default([]),
  review_strategy: z
    .array(
      z.object({
        step: z.number().int().min(1),
        action: z.string().min(1),
        target: z.string().min(1),
        reason: z.string().min(1),
      }),
    )
    .default([]),
})

export type AIOutput = z.infer<typeof aiOutputSchema>
