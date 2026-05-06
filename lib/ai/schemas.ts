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
  risk_explanations: z
    .array(
      z.object({
        subject: z.string().min(1),
        file: z.string().min(1).optional(),
        why_this_matters: z.string().min(1),
        reviewer_guidance: z.string().min(1),
        severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
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
  review_checklist: z
    .array(
      z.object({
        task: z.string().min(1),
        reason: z.string().min(1),
        file: z.string().min(1).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
      }),
    )
    .default([]),
})

export type AIOutput = z.infer<typeof aiOutputSchema>
