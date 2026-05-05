import { NextRequest, NextResponse } from "next/server"
import { analyzeWithAI, parseAIResponse } from "@/lib/ai"
import { buildDiffContent, fetchPRData, fetchPRFiles, fetchPRReviewComments, fetchPRReviews } from "@/lib/github"
import { runHeuristics } from "@/lib/heuristics"
import { parsePRUrl } from "@/lib/parser"
import { buildPrompt } from "@/lib/prompt"
import type {
  GitHubFile,
  GitHubReview,
  GitHubReviewComment,
  ImpactMapEntry,
  PRAnalysisReport,
  ReviewConcern,
  RiskAssessment,
} from "@/types"

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

const IMPACT_AREAS = [
  {
    area: "REST API Flow",
    pattern: /(rest\/resource-server|controller|restcontroller|resourceserver|spring)/i,
    description: "Server-side behavior or data returned to the UI may change.",
    review_focus: "Validate request handling, response shape, auth boundaries, and error paths.",
  },
  {
    area: "Component Domain Logic",
    pattern: /(component|components)/i,
    description: "Component creation, update, merge, or visibility behavior may change.",
    review_focus: "Check omitted fields, explicit field updates, permissions, moderation paths, and persisted state.",
  },
  {
    area: "User Interface",
    pattern: /^(app|pages|components|src\/components|src\/app|src\/pages)\//i,
    description: "Screens, report sections, or user interactions may change.",
    review_focus: "Check visual states, empty states, loading states, and responsive layout.",
  },
  {
    area: "AI Analysis Logic",
    pattern: /^(lib\/ai|src\/lib\/ai|prompts|lib\/prompt|src\/lib\/prompt)/i,
    description: "The model prompt, provider behavior, or parsed AI output may change.",
    review_focus: "Confirm output schema stability, prompt quality, and failure handling.",
  },
  {
    area: "GitHub Integration",
    pattern: /(github|pulls|repos|octokit)/i,
    description: "PR fetching, file metadata, or GitHub API behavior may change.",
    review_focus: "Check API limits, pagination, token usage, and public/private PR handling.",
  },
  {
    area: "Risk & Heuristics",
    pattern: /(heuristic|risk|score|analysis)/i,
    description: "Risk scoring or review prioritization may change.",
    review_focus: "Compare scores on small, medium, and sensitive PRs for expected weighting.",
  },
  {
    area: "Configuration & Build",
    pattern: /(^|\/)(\.github|\.env|package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|next\.config|tsconfig|eslint|tailwind|postcss|dockerfile|docker-compose|vercel)\b/i,
    description: "Build, lint, deployment, dependency, or environment behavior may change.",
    review_focus: "Run local checks and confirm required environment variables are documented.",
  },
  {
    area: "Tests",
    pattern: /(\.test\.|\.spec\.|__tests__|\/tests?\/)/i,
    description: "Automated coverage or expected behavior may change.",
    review_focus: "Confirm tests cover the changed behavior and still run reliably.",
  },
  {
    area: "Documentation",
    pattern: /(^|\/)(readme|docs?|changelog|license|\.mdx?)\b/i,
    description: "Developer or user-facing guidance may change.",
    review_focus: "Check that docs match the implemented behavior and setup steps.",
  },
] as const

function buildImpactMap(files: GitHubFile[]): ImpactMapEntry[] {
  const groups = new Map<string, ImpactMapEntry>()
  const diffText = files.map((file) => `${file.filename}\n${file.patch ?? ""}`).join("\n")
  const touchesVisibility = /visbility|visibility/i.test(diffText)
  const touchesPatch = /patch|partial update|containsKey|requestBody/i.test(diffText)

  for (const file of files) {
    const matchedArea = classifyImpactArea(file, touchesVisibility) ?? {
      area: "Core Code",
      description: "Shared application logic may change.",
      review_focus: "Review callers, edge cases, and whether tests cover the changed path.",
    }

    const existing = groups.get(matchedArea.area) ?? {
      area: matchedArea.area,
      description: matchedArea.description,
      review_focus: matchedArea.review_focus,
      flow: buildAffectedFlow(matchedArea.area, touchesVisibility, touchesPatch),
      signals: buildImpactSignals(file, touchesVisibility, touchesPatch),
      files: [],
      additions: 0,
      deletions: 0,
      changes: 0,
    }

    existing.files.push(file.filename)
    existing.additions += file.additions
    existing.deletions += file.deletions
    existing.changes += file.changes
    existing.signals = unique([...existing.signals, ...buildImpactSignals(file, touchesVisibility, touchesPatch)])
    groups.set(matchedArea.area, existing)
  }

  return [...groups.values()].sort((a, b) => b.changes - a.changes)
}

function classifyImpactArea(file: GitHubFile, touchesVisibility: boolean) {
  if (/(\.test\.|\.spec\.|__tests__|\/tests?\/|SpecTest)/i.test(file.filename)) {
    return {
      area: "Tests",
      description: "Automated coverage or expected behavior may change.",
      review_focus: "Confirm tests cover the changed behavior and still run reliably.",
    }
  }

  if (touchesVisibility && /(ComponentController|RestControllerHelper|\/component\/)/i.test(file.filename)) {
    return {
      area: "Component Visibility Patch Flow",
      description: "PATCH behavior for component visibility and partial updates is affected.",
      review_focus:
        "Verify omitted visibility is preserved, explicit visibility updates still work, and unrelated PATCH fields keep their existing behavior.",
    }
  }

  return IMPACT_AREAS.find(({ pattern }) => pattern.test(file.filename))
}

function buildAffectedFlow(area: string, touchesVisibility: boolean, touchesPatch: boolean): string[] {
  if (area === "Tests") {
    return ["PATCH scenario setup", "Mock request execution", "Response visibility assertion"]
  }

  if (touchesVisibility && touchesPatch) {
    return [
      "PATCH /api/components/{id}",
      "ComponentController.patchComponent()",
      "RestControllerHelper.updateComponent()",
      "Existing component visibility",
    ]
  }

  if (area === "REST API Flow") {
    return ["Incoming request", "Controller handler", "Helper/service layer", "HTTP response"]
  }

  return []
}

function buildImpactSignals(file: GitHubFile, touchesVisibility: boolean, touchesPatch: boolean): string[] {
  const signals: string[] = []

  if (touchesPatch) signals.push("PATCH semantics")
  if (touchesVisibility) signals.push("visibility field handling")
  if (/RestControllerHelper/i.test(file.filename)) signals.push("shared update helper")
  if (/Controller/i.test(file.filename)) signals.push("request deserialization")
  if (/test|spec/i.test(file.filename)) signals.push("regression coverage")

  return signals
}

function buildReviewConcerns(reviews: GitHubReview[], comments: GitHubReviewComment[]): ReviewConcern[] {
  const reviewConcerns = reviews
    .filter((review) => review.body?.trim())
    .filter((review) => ["CHANGES_REQUESTED", "COMMENTED"].includes(review.state))
    .map((review) => ({
      author: review.user.login,
      source: "review" as const,
      state: review.state,
      concern: summarizeConcern(review.body ?? ""),
    }))

  const commentConcerns = comments
    .filter((comment) => comment.body.trim())
    .map((comment) => ({
      author: comment.user.login,
      source: "comment" as const,
      file: comment.path,
      concern: summarizeConcern(comment.body),
    }))

  return [...reviewConcerns, ...commentConcerns].slice(0, 4)
}

function summarizeConcern(body: string) {
  return body.replace(/\s+/g, " ").trim().slice(0, 220)
}

function unique(values: string[]) {
  return [...new Set(values)]
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { url?: unknown }
    const url = typeof body.url === "string" ? body.url.trim() : ""

    if (!url) {
      return NextResponse.json({ error: "PR URL is required" }, { status: 400 })
    }

    const { owner, repo, pr_number } = parsePRUrl(url)
    const [prData, files, reviews, reviewComments] = await Promise.all([
      fetchPRData(owner, repo, pr_number),
      fetchPRFiles(owner, repo, pr_number),
      fetchPRReviews(owner, repo, pr_number),
      fetchPRReviewComments(owner, repo, pr_number),
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
      impact_map: buildImpactMap(files),
      active_review_concerns: buildReviewConcerns(reviews, reviewComments),
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
