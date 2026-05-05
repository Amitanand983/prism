import { NextRequest, NextResponse } from "next/server"
import { analyzeWithAI, parseAIResponse } from "@/lib/ai"
import { buildDiffContent, fetchPRData, fetchPRFiles } from "@/lib/github"
import { runHeuristics } from "@/lib/heuristics"
import { parsePRUrl } from "@/lib/parser"
import { buildPrompt } from "@/lib/prompt"
import type { PRAnalysisReport, RiskAssessment } from "@/types"

export const runtime = "nodejs"
export const maxDuration = 60

function riskLevel(score: number): RiskAssessment["level"] {
  if (score >= 8) return "CRITICAL"
  if (score >= 6) return "HIGH"
  if (score >= 4) return "MEDIUM"
  return "LOW"
}

function publicErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Unknown error"

  if (
    error.message.includes("API_KEY") ||
    error.message.includes("AI_PROVIDER") ||
    error.message.includes("GitHub API error") ||
    error.message.includes("Invalid GitHub PR URL") ||
    error.message.includes("Only github.com")
  ) {
    return error.message
  }

  return "Analysis failed. Please try again with a smaller public PR or check server logs."
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { url?: unknown }
    const url = typeof body.url === "string" ? body.url.trim() : ""

    if (!url) {
      return NextResponse.json({ error: "PR URL is required" }, { status: 400 })
    }

    const { owner, repo, pr_number } = parsePRUrl(url)
    const [prData, files] = await Promise.all([
      fetchPRData(owner, repo, pr_number),
      fetchPRFiles(owner, repo, pr_number),
    ])

    const signals = runHeuristics(files, prData.additions, prData.deletions)
    const prompt = buildPrompt(prData, signals, buildDiffContent(files))
    const aiOutput = parseAIResponse(await analyzeWithAI(prompt))

    const llmScore = aiOutput.llm_score
    const heuristicScore = signals.heuristic_score
    const finalScore = Math.round(heuristicScore * 0.4 + llmScore * 0.6)

    const report: PRAnalysisReport = {
      meta: {
        pr_title: prData.title,
        pr_url: prData.html_url,
        author: prData.user.login,
        base_branch: prData.base.ref,
        head_branch: prData.head.ref,
        files_changed: prData.changed_files,
        additions: prData.additions,
        deletions: prData.deletions,
        analyzed_at: new Date().toISOString(),
      },
      summary: aiOutput.summary,
      risk: {
        score: finalScore,
        heuristic_score: heuristicScore,
        llm_score: llmScore,
        level: riskLevel(finalScore),
        reason: aiOutput.risk_reason,
      },
      critical_files: aiOutput.critical_files,
      reviewer_blind_spots: aiOutput.reviewer_blind_spots,
      dependency_impact: aiOutput.dependency_impact,
      auto_comments: aiOutput.auto_comments,
      review_strategy: aiOutput.review_strategy,
    }

    return NextResponse.json(report)
  } catch (error: unknown) {
    console.error("analyze-pr error:", error)
    return NextResponse.json({ error: publicErrorMessage(error) }, { status: 500 })
  }
}
