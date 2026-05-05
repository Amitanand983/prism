# PRISM (PR Intelligence System Mechanism)

> A hybrid AI system that transforms code review from a manual, unstructured process into an AI-assisted, risk-aware, and actionable workflow.

---

## 🧠 What You Are Building

A full-stack Next.js web app where a user pastes any public GitHub PR URL and receives a structured intelligence report — before they even open the diff.

The system uses **two-stage hybrid intelligence**:
- Stage 1: Deterministic heuristics (rules engine) extracts risk signals from PR metadata
- Stage 2: LLM reasoning uses those signals + the diff to produce structured JSON output

The output is not free-form text. It is always a typed JSON object rendered as a visual report.

---

## 📁 Complete Folder Structure

```
github-pr-intelligence/
│
├── app/
│   ├── page.tsx                        # Home page — PR URL input + report display
│   ├── layout.tsx                      # Root layout, fonts, metadata
│   ├── globals.css                     # Global styles + Tailwind base
│   └── api/
│       └── analyze-pr/
│           └── route.ts                # POST endpoint — full pipeline orchestration
│
├── components/
│   ├── PRInput.tsx                     # URL input field + submit button
│   ├── ReportCard.tsx                  # Full report container
│   ├── MetaBanner.tsx                  # PR title, author, branch, stats
│   ├── RiskMeter.tsx                   # Visual risk score (color coded 1-10)
│   ├── SummarySection.tsx              # Semantic summary block
│   ├── CriticalFiles.tsx               # Critical files list with risk badges
│   ├── BlindSpots.tsx                  # Reviewer blind spots list
│   ├── DependencyImpact.tsx            # Dependency impact section
│   ├── AutoComments.tsx                # Auto-generated review comments
│   ├── ReviewStrategy.tsx              # Step-by-step review plan
│   ├── LoadingState.tsx                # Skeleton loader while analyzing
│   └── ErrorState.tsx                  # Error display component
│
├── lib/
│   ├── parser.ts                       # GitHub PR URL parser
│   ├── github.ts                       # GitHub REST API calls
│   ├── heuristics.ts                   # Deterministic risk engine
│   ├── prompt.ts                       # Prompt builder
│   └── ai/
│       ├── index.ts                    # AI provider router (reads AI_PROVIDER env)
│       ├── groq.ts                     # Groq implementation (default)
│       ├── openai.ts                   # OpenAI implementation
│       ├── claude.ts                   # Anthropic Claude implementation
│       └── gemini.ts                   # Google Gemini implementation
│
├── types/
│   └── index.ts                        # All TypeScript interfaces
│
├── .env.local                          # API keys — never commit
├── .env.example                        # Template — commit this
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🗂️ Types — Single Source of Truth

### `types/index.ts`

```typescript
export interface PRMeta {
  pr_title: string
  pr_url: string
  author: string
  base_branch: string
  head_branch: string
  files_changed: number
  additions: number
  deletions: number
  analyzed_at: string
}

export interface RiskAssessment {
  score: number                            // 1-10 final weighted score
  heuristic_score: number                  // from rules engine
  llm_score: number                        // from LLM
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  reason: string
}

export interface CriticalFile {
  file: string
  reason: string
  risk_contribution: "LOW" | "MEDIUM" | "HIGH"
}

export interface AutoComment {
  file: string
  line_hint: string                        // e.g. "around the token validation block"
  comment: string                          // ready-to-post GitHub review comment
  severity: "INFO" | "WARNING" | "CRITICAL"
}

export interface ReviewStep {
  step: number
  action: string
  target: string
  reason: string
}

export interface PRAnalysisReport {
  meta: PRMeta
  summary: string
  risk: RiskAssessment
  critical_files: CriticalFile[]
  reviewer_blind_spots: string[]
  dependency_impact: string
  auto_comments: AutoComment[]
  review_strategy: ReviewStep[]
}

export interface HeuristicSignals {
  sensitive_files: string[]
  change_size: "SMALL" | "MEDIUM" | "LARGE" | "MASSIVE"
  high_risk_patterns: string[]
  heuristic_score: number
  flags: string[]
}

export interface GitHubFile {
  filename: string
  status: string
  additions: number
  deletions: number
  changes: number
  patch?: string
}

export interface GitHubPRData {
  title: string
  body: string
  user: { login: string }
  base: { ref: string }
  head: { ref: string }
  additions: number
  deletions: number
  changed_files: number
  html_url: string
}
```

---

## ⚙️ Environment Variables

### `.env.example`

```bash
# GitHub Personal Access Token (required)
# Create at: https://github.com/settings/tokens
# Scopes needed: public_repo (for public PRs)
GITHUB_TOKEN=your_github_personal_access_token

# AI Provider — pick one: groq | openai | claude | gemini
AI_PROVIDER=groq

# Groq API Key (free — default provider)
# Get at: https://console.groq.com
GROQ_API_KEY=your_groq_api_key

# OpenAI (optional)
OPENAI_API_KEY=your_openai_api_key

# Anthropic Claude (optional)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Google Gemini (optional)
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🔧 Implementation — File by File

---

### `lib/parser.ts`

Parse a GitHub PR URL into its components.

Input: `https://github.com/vercel/next.js/pull/12345`
Output: `{ owner: "vercel", repo: "next.js", pr_number: 12345 }`

```typescript
export function parsePRUrl(url: string): { owner: string; repo: string; pr_number: number } {
  const regex = /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/
  const match = url.match(regex)
  if (!match) throw new Error("Invalid GitHub PR URL. Expected: https://github.com/owner/repo/pull/123")
  return {
    owner: match[1],
    repo: match[2],
    pr_number: parseInt(match[3], 10),
  }
}
```

---

### `lib/github.ts`

Fetch PR metadata and all file diffs from GitHub REST API.

```typescript
import { GitHubPRData, GitHubFile } from "@/types"

const BASE = "https://api.github.com"

const headers = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: "application/vnd.github.v3+json",
}

export async function fetchPRData(owner: string, repo: string, pr_number: number): Promise<GitHubPRData> {
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/pulls/${pr_number}`, { headers })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function fetchPRFiles(owner: string, repo: string, pr_number: number): Promise<GitHubFile[]> {
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/pulls/${pr_number}/files?per_page=100`, { headers })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
  return res.json()
}

export function buildDiffContent(files: GitHubFile[]): string {
  return files
    .map((f) => `### ${f.filename} (+${f.additions} -${f.deletions})\n${f.patch ?? "(binary or no patch)"}`)
    .join("\n\n---\n\n")
}
```

---

### `lib/heuristics.ts`

Deterministic rules engine. Runs before the LLM. Produces a score and signals that feed into the prompt.

```typescript
import { GitHubFile, HeuristicSignals } from "@/types"

const SENSITIVE_PATTERNS = [
  { pattern: /auth/i,                          weight: 2, flag: "Authentication logic modified" },
  { pattern: /middleware/i,                     weight: 2, flag: "Middleware modified" },
  { pattern: /config|\.env/i,                  weight: 2, flag: "Configuration file changed" },
  { pattern: /payment|billing|stripe/i,        weight: 3, flag: "Payment logic touched" },
  { pattern: /database|migration|schema/i,     weight: 2, flag: "Database schema modified" },
  { pattern: /security|crypto|jwt|token|password/i, weight: 3, flag: "Security-sensitive code changed" },
  { pattern: /dockerfile|\.github|ci|cd|deploy/i,  weight: 1, flag: "Infrastructure/CI config changed" },
  { pattern: /test|spec/i,                     weight: -1, flag: "Test files included (reduces risk)" },
]

export function runHeuristics(
  files: GitHubFile[],
  additions: number,
  deletions: number
): HeuristicSignals {
  let score = 0
  const sensitive_files: string[] = []
  const high_risk_patterns: string[] = []
  const flags: string[] = []

  for (const file of files) {
    for (const { pattern, weight, flag } of SENSITIVE_PATTERNS) {
      if (pattern.test(file.filename)) {
        score += weight
        if (weight > 0) {
          sensitive_files.push(file.filename)
          if (!high_risk_patterns.includes(flag)) high_risk_patterns.push(flag)
          if (!flags.includes(flag)) flags.push(flag)
        }
      }
    }
  }

  const total_changes = additions + deletions
  let change_size: HeuristicSignals["change_size"] = "SMALL"
  if (total_changes > 1000)      { score += 3; change_size = "MASSIVE" }
  else if (total_changes > 500)  { score += 2; change_size = "LARGE" }
  else if (total_changes > 100)  { score += 1; change_size = "MEDIUM" }

  if (files.length > 20) score += 2
  else if (files.length > 10) score += 1

  const heuristic_score = Math.min(10, Math.max(1, score))

  return {
    sensitive_files: [...new Set(sensitive_files)],
    change_size,
    high_risk_patterns,
    heuristic_score,
    flags,
  }
}
```

---

### `lib/prompt.ts`

Build the two-stage structured prompt. LLM receives PR metadata + heuristic signals + diff.

```typescript
import { GitHubPRData, HeuristicSignals } from "@/types"

export function buildPrompt(pr: GitHubPRData, signals: HeuristicSignals, diff: string): string {
  const diffTruncated = diff.length > 12000
    ? diff.slice(0, 12000) + "\n\n[diff truncated for length]"
    : diff

  return `You are a senior software engineer conducting a pre-review intelligence briefing on a GitHub Pull Request.

You have been given:
1. PR metadata
2. Pre-computed heuristic signals from a rules engine
3. The actual diff content

Your job is to reason deeply and return a structured JSON report.

---

## PR Metadata
Title: ${pr.title}
Author: ${pr.user.login}
Base branch: ${pr.base.ref}
Head branch: ${pr.head.ref}
Files changed: ${pr.changed_files}
Additions: ${pr.additions} | Deletions: ${pr.deletions}
Description: ${pr.body || "No description provided"}

---

## Heuristic Signals (from rules engine)
Change size: ${signals.change_size}
Heuristic risk score: ${signals.heuristic_score}/10
Sensitive files detected: ${signals.sensitive_files.join(", ") || "none"}
Risk flags: ${signals.flags.join(", ") || "none"}
High risk patterns: ${signals.high_risk_patterns.join(", ") || "none"}

---

## Diff Content
${diffTruncated}

---

## Instructions

Return ONLY a valid JSON object. No markdown. No explanation. No preamble. Raw JSON only.

The JSON must follow this exact structure:

{
  "summary": "2-3 sentence semantic summary of what actually changed and why",
  "llm_score": <number 1-10, your own risk assessment>,
  "risk_reason": "Why you assigned this score, specific to this diff",
  "critical_files": [
    {
      "file": "exact/file/path.ts",
      "reason": "Specific reason this file needs attention",
      "risk_contribution": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "reviewer_blind_spots": [
    "Specific, concrete thing a reviewer might miss — not generic advice"
  ],
  "dependency_impact": "What other parts of the codebase or downstream systems may be affected",
  "auto_comments": [
    {
      "file": "exact/file/path.ts",
      "line_hint": "around the [specific block or function name]",
      "comment": "Ready-to-post GitHub review comment. Be specific and actionable.",
      "severity": "CRITICAL" | "WARNING" | "INFO"
    }
  ],
  "review_strategy": [
    {
      "step": 1,
      "action": "What to do",
      "target": "Which file or area",
      "reason": "Why start here"
    }
  ]
}

Rules:
- reviewer_blind_spots must be specific to THIS diff, not generic advice
- auto_comments must reference actual files from the diff
- review_strategy should have 3-5 steps ordered by priority
- llm_score is your independent assessment (heuristic score is context only)
- Return nothing except the JSON object`
}
```

---

### `lib/ai/groq.ts`

```typescript
import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function analyzeWithGroq(prompt: string): Promise<string> {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 4000,
  })
  return response.choices[0]?.message?.content ?? ""
}
```

---

### `lib/ai/openai.ts`

```typescript
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function analyzeWithOpenAI(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 4000,
  })
  return response.choices[0]?.message?.content ?? ""
}
```

---

### `lib/ai/claude.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function analyzeWithClaude(prompt: string): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  })
  const block = response.content[0]
  return block.type === "text" ? block.text : ""
}
```

---

### `lib/ai/gemini.ts`

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "")

export async function analyzeWithGemini(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })
  const result = await model.generateContent(prompt)
  return result.response.text()
}
```

---

### `lib/ai/index.ts`

AI provider router — reads `AI_PROVIDER` env var and delegates to the right implementation.

```typescript
import { analyzeWithGroq }   from "./groq"
import { analyzeWithOpenAI } from "./openai"
import { analyzeWithClaude } from "./claude"
import { analyzeWithGemini } from "./gemini"

export async function analyzeWithAI(prompt: string): Promise<string> {
  const provider = process.env.AI_PROVIDER ?? "groq"
  switch (provider) {
    case "openai":  return analyzeWithOpenAI(prompt)
    case "claude":  return analyzeWithClaude(prompt)
    case "gemini":  return analyzeWithGemini(prompt)
    case "groq":
    default:        return analyzeWithGroq(prompt)
  }
}

export function parseAIResponse(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/```json|```/g, "").trim()
  return JSON.parse(cleaned)
}
```

---

### `app/api/analyze-pr/route.ts`

Full pipeline — orchestrates all steps end to end.

```typescript
import { NextRequest, NextResponse } from "next/server"
import { parsePRUrl }                from "@/lib/parser"
import { fetchPRData, fetchPRFiles, buildDiffContent } from "@/lib/github"
import { runHeuristics }             from "@/lib/heuristics"
import { buildPrompt }               from "@/lib/prompt"
import { analyzeWithAI, parseAIResponse } from "@/lib/ai"
import { PRAnalysisReport }          from "@/types"

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: "PR URL is required" }, { status: 400 })

    // Step 1: Parse URL
    const { owner, repo, pr_number } = parsePRUrl(url)

    // Step 2: Fetch PR data from GitHub
    const [prData, files] = await Promise.all([
      fetchPRData(owner, repo, pr_number),
      fetchPRFiles(owner, repo, pr_number),
    ])

    // Step 3: Run heuristics engine
    const signals = runHeuristics(files, prData.additions, prData.deletions)

    // Step 4: Build diff content
    const diff = buildDiffContent(files)

    // Step 5: Build prompt and call AI
    const prompt = buildPrompt(prData, signals, diff)
    const rawResponse = await analyzeWithAI(prompt)
    const aiOutput = parseAIResponse(rawResponse)

    // Step 6: Compute final hybrid risk score (weighted average)
    const llm_score = typeof aiOutput.llm_score === "number" ? aiOutput.llm_score : 5
    const heuristic_score = signals.heuristic_score
    const final_score = Math.round((heuristic_score * 0.4) + (llm_score * 0.6))

    const level =
      final_score >= 8 ? "CRITICAL" :
      final_score >= 6 ? "HIGH" :
      final_score >= 4 ? "MEDIUM" : "LOW"

    // Step 7: Assemble final typed report
    const report: PRAnalysisReport = {
      meta: {
        pr_title:      prData.title,
        pr_url:        prData.html_url,
        author:        prData.user.login,
        base_branch:   prData.base.ref,
        head_branch:   prData.head.ref,
        files_changed: prData.changed_files,
        additions:     prData.additions,
        deletions:     prData.deletions,
        analyzed_at:   new Date().toISOString(),
      },
      summary: String(aiOutput.summary ?? ""),
      risk: {
        score: final_score,
        heuristic_score,
        llm_score,
        level,
        reason: String(aiOutput.risk_reason ?? ""),
      },
      critical_files:       Array.isArray(aiOutput.critical_files)       ? aiOutput.critical_files       : [],
      reviewer_blind_spots: Array.isArray(aiOutput.reviewer_blind_spots) ? aiOutput.reviewer_blind_spots : [],
      dependency_impact:    String(aiOutput.dependency_impact ?? ""),
      auto_comments:        Array.isArray(aiOutput.auto_comments)        ? aiOutput.auto_comments        : [],
      review_strategy:      Array.isArray(aiOutput.review_strategy)      ? aiOutput.review_strategy      : [],
    }

    return NextResponse.json(report)

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("analyze-pr error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

---

## 🎨 Frontend — All Components

---

### `app/page.tsx`

```typescript
"use client"

import { useState } from "react"
import PRInput      from "@/components/PRInput"
import ReportCard   from "@/components/ReportCard"
import LoadingState from "@/components/LoadingState"
import ErrorState   from "@/components/ErrorState"
import { PRAnalysisReport } from "@/types"

export default function Home() {
  const [report,  setReport]  = useState<PRAnalysisReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleAnalyze(url: string) {
    setLoading(true)
    setError(null)
    setReport(null)

    try {
      const res = await fetch("/api/analyze-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Analysis failed")
      setReport(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-3">
          <span className="text-2xl">🔍</span>
          <div>
            <h1 className="text-lg font-semibold text-white">PRISM (PR Intelligence System Mechanism)</h1>
            <p className="text-xs text-gray-400">AI-powered code review briefing</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {!report && !loading && !error && (
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Know your PR before you review it.
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Paste a GitHub PR link. Get a full AI-generated intelligence report —
              risk score, blind spots, auto-comments, and a step-by-step review strategy.
            </p>
          </div>
        )}

        <PRInput onAnalyze={handleAnalyze} loading={loading} />

        {loading && <LoadingState />}
        {error   && <ErrorState message={error} />}
        {report  && <ReportCard report={report} />}
      </div>
    </main>
  )
}
```

---

### `components/PRInput.tsx`

```typescript
"use client"

import { useState } from "react"

interface Props {
  onAnalyze: (url: string) => void
  loading: boolean
}

export default function PRInput({ onAnalyze, loading }: Props) {
  const [url, setUrl] = useState("")

  function handleSubmit() {
    const trimmed = url.trim()
    if (!trimmed) return
    onAnalyze(trimmed)
  }

  return (
    <div className="flex gap-3 max-w-2xl mx-auto">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="https://github.com/owner/repo/pull/123"
        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3
                   text-white placeholder-gray-500 text-sm focus:outline-none
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
        disabled={loading}
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !url.trim()}
        className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed
                   text-white font-medium px-6 py-3 rounded-xl text-sm transition whitespace-nowrap"
      >
        {loading ? "Analyzing..." : "Analyze PR →"}
      </button>
    </div>
  )
}
```

---

### `components/ReportCard.tsx`

```typescript
import { PRAnalysisReport } from "@/types"
import MetaBanner        from "./MetaBanner"
import RiskMeter         from "./RiskMeter"
import SummarySection    from "./SummarySection"
import CriticalFiles     from "./CriticalFiles"
import BlindSpots        from "./BlindSpots"
import DependencyImpact  from "./DependencyImpact"
import AutoComments      from "./AutoComments"
import ReviewStrategy    from "./ReviewStrategy"

interface Props { report: PRAnalysisReport }

export default function ReportCard({ report }: Props) {
  return (
    <div className="mt-10 space-y-6">
      <MetaBanner meta={report.meta} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1"><RiskMeter risk={report.risk} /></div>
        <div className="md:col-span-2"><SummarySection summary={report.summary} /></div>
      </div>
      <ReviewStrategy steps={report.review_strategy} />
      <CriticalFiles files={report.critical_files} />
      <AutoComments comments={report.auto_comments} />
      <BlindSpots spots={report.reviewer_blind_spots} />
      <DependencyImpact impact={report.dependency_impact} />
    </div>
  )
}
```

---

### `components/MetaBanner.tsx`

```typescript
import { PRMeta } from "@/types"

interface Props { meta: PRMeta }

export default function MetaBanner({ meta }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <a href={meta.pr_url} target="_blank" rel="noopener noreferrer"
             className="text-white font-semibold text-lg hover:text-blue-400 transition">
            {meta.pr_title}
          </a>
          <p className="text-gray-400 text-sm mt-1">
            by <span className="text-gray-300">{meta.author}</span>
            {" · "}
            <span className="font-mono text-xs bg-gray-800 px-2 py-0.5 rounded">{meta.base_branch}</span>
            {" ← "}
            <span className="font-mono text-xs bg-gray-800 px-2 py-0.5 rounded">{meta.head_branch}</span>
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <Stat label="Files"     value={meta.files_changed} />
          <Stat label="Additions" value={`+${meta.additions}`} color="text-green-400" />
          <Stat label="Deletions" value={`-${meta.deletions}`} color="text-red-400" />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color = "text-white" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="text-center">
      <div className={`font-semibold ${color}`}>{value}</div>
      <div className="text-gray-500 text-xs">{label}</div>
    </div>
  )
}
```

---

### `components/RiskMeter.tsx`

```typescript
import { RiskAssessment } from "@/types"

interface Props { risk: RiskAssessment }

const LEVEL_COLORS = {
  LOW:      { bg: "bg-green-500/10",  border: "border-green-500/30",  text: "text-green-400"  },
  MEDIUM:   { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400" },
  HIGH:     { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
  CRITICAL: { bg: "bg-red-500/10",    border: "border-red-500/30",    text: "text-red-400"    },
}

export default function RiskMeter({ risk }: Props) {
  const colors = LEVEL_COLORS[risk.level]
  return (
    <div className={`${colors.bg} border ${colors.border} rounded-2xl p-6 h-full`}>
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-4">Risk Score</p>
      <div className="flex items-baseline gap-2 mb-1">
        <span className={`text-6xl font-bold ${colors.text}`}>{risk.score}</span>
        <span className="text-gray-500 text-lg">/10</span>
      </div>
      <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full
                        ${colors.bg} ${colors.text} border ${colors.border} mb-4`}>
        {risk.level}
      </span>
      <p className="text-gray-300 text-sm leading-relaxed">{risk.reason}</p>
      <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-3 text-xs text-gray-500">
        <div>Heuristic: <span className="text-gray-300 font-medium">{risk.heuristic_score}/10</span></div>
        <div>LLM: <span className="text-gray-300 font-medium">{risk.llm_score}/10</span></div>
      </div>
    </div>
  )
}
```

---

### `components/SummarySection.tsx`

```typescript
interface Props { summary: string }

export default function SummarySection({ summary }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 h-full">
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">Semantic Summary</p>
      <p className="text-gray-200 text-base leading-relaxed">{summary}</p>
    </div>
  )
}
```

---

### `components/ReviewStrategy.tsx`

```typescript
import { ReviewStep } from "@/types"

interface Props { steps: ReviewStep[] }

export default function ReviewStrategy({ steps }: Props) {
  if (!steps.length) return null
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-4">🧭 Review Strategy</p>
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.step} className="flex gap-4">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600/20 border border-blue-600/30
                            flex items-center justify-center text-blue-400 text-xs font-bold">
              {step.step}
            </div>
            <div>
              <p className="text-white text-sm font-medium">{step.action}</p>
              <p className="text-gray-400 text-xs mt-0.5">
                <span className="font-mono text-blue-400">{step.target}</span> — {step.reason}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### `components/CriticalFiles.tsx`

```typescript
import { CriticalFile } from "@/types"

interface Props { files: CriticalFile[] }

const RISK_COLORS = {
  HIGH:   "bg-red-500/10 text-red-400 border-red-500/30",
  MEDIUM: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  LOW:    "bg-green-500/10 text-green-400 border-green-500/30",
}

export default function CriticalFiles({ files }: Props) {
  if (!files.length) return null
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-4">📁 Critical Files</p>
      <div className="space-y-3">
        {files.map((f, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className={`text-xs px-2 py-0.5 rounded border font-medium flex-shrink-0 ${RISK_COLORS[f.risk_contribution]}`}>
              {f.risk_contribution}
            </span>
            <div>
              <p className="font-mono text-sm text-blue-300">{f.file}</p>
              <p className="text-gray-400 text-xs mt-0.5">{f.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### `components/AutoComments.tsx`

```typescript
import { AutoComment } from "@/types"

interface Props { comments: AutoComment[] }

const SEVERITY_STYLES = {
  CRITICAL: "bg-red-500/10 border-red-500/30 text-red-400",
  WARNING:  "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  INFO:     "bg-blue-500/10 border-blue-500/30 text-blue-400",
}
const SEVERITY_ICONS = { CRITICAL: "🚨", WARNING: "⚠️", INFO: "💡" }

export default function AutoComments({ comments }: Props) {
  if (!comments.length) return null
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-4">💬 Auto-Generated Review Comments</p>
      <div className="space-y-4">
        {comments.map((c, i) => (
          <div key={i} className={`border rounded-xl p-4 ${SEVERITY_STYLES[c.severity]}`}>
            <div className="flex items-center gap-2 mb-2">
              <span>{SEVERITY_ICONS[c.severity]}</span>
              <span className="font-mono text-xs text-gray-300">{c.file}</span>
              <span className="text-gray-500 text-xs">· {c.line_hint}</span>
            </div>
            <p className="text-gray-200 text-sm leading-relaxed">{c.comment}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### `components/BlindSpots.tsx`

```typescript
interface Props { spots: string[] }

export default function BlindSpots({ spots }: Props) {
  if (!spots.length) return null
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-4">👁️ Reviewer Blind Spots</p>
      <ul className="space-y-2">
        {spots.map((spot, i) => (
          <li key={i} className="flex gap-3 text-sm text-gray-300">
            <span className="text-orange-400 flex-shrink-0 mt-0.5">→</span>
            {spot}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

### `components/DependencyImpact.tsx`

```typescript
interface Props { impact: string }

export default function DependencyImpact({ impact }: Props) {
  if (!impact) return null
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">🔗 Dependency Impact</p>
      <p className="text-gray-300 text-sm leading-relaxed">{impact}</p>
    </div>
  )
}
```

---

### `components/LoadingState.tsx`

```typescript
export default function LoadingState() {
  return (
    <div className="mt-10 space-y-6 animate-pulse">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl h-24" />
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl h-48" />
        <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-2xl h-48" />
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl h-36" />
      <div className="bg-gray-900 border border-gray-800 rounded-2xl h-36" />
      <p className="text-center text-gray-500 text-sm pt-2">Analyzing PR with AI...</p>
    </div>
  )
}
```

---

### `components/ErrorState.tsx`

```typescript
interface Props { message: string }

export default function ErrorState({ message }: Props) {
  return (
    <div className="mt-10 bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
      <p className="text-red-400 font-medium mb-1">Analysis Failed</p>
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  )
}
```

---

## 📦 Dependencies & Setup

### Install commands

```bash
# 1. Bootstrap Next.js app
npx create-next-app@latest github-pr-intelligence \
  --typescript --tailwind --app --no-src-dir --eslint
cd github-pr-intelligence

# 2. Install AI provider SDKs
npm install groq-sdk openai @anthropic-ai/sdk @google/generative-ai

# 3. Setup env
cp .env.example .env.local
# Fill in GITHUB_TOKEN and GROQ_API_KEY at minimum

# 4. Create all folders
mkdir -p components lib/ai types app/api/analyze-pr

# 5. Run
npm run dev
# Open http://localhost:3000
```

### Key packages

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "groq-sdk": "^0.7.0",
    "openai": "^4.0.0",
    "@anthropic-ai/sdk": "^0.24.0",
    "@google/generative-ai": "^0.15.0"
  }
}
```

---

## 🌐 Deployment on Vercel (Free)

```bash
# Option A: GitHub (recommended)
# 1. Push repo to GitHub
# 2. vercel.com → New Project → Import repo
# 3. Add env variables in Vercel dashboard
# 4. Deploy — live URL in ~60 seconds

# Option B: CLI
npm install -g vercel
vercel --prod
```

**Required env vars to set in Vercel dashboard:**
- `GITHUB_TOKEN`
- `AI_PROVIDER` = `groq`
- `GROQ_API_KEY`

---

## 🏗️ Full Architecture Flow

```
User pastes PR URL
        │
        ▼
POST /api/analyze-pr
        │
        ├─ 1. parsePRUrl()           → owner, repo, pr_number
        │
        ├─ 2. fetchPRData()          → PR title, author, branches, stats
        │   + fetchPRFiles()         → file list + patch diffs (parallel)
        │
        ├─ 3. runHeuristics()        → heuristic_score + risk signals
        │      - pattern matching on filenames
        │      - change size scoring
        │      - file count scoring
        │
        ├─ 4. buildDiffContent()     → formatted diff string
        │
        ├─ 5. buildPrompt()          → structured prompt (metadata + signals + diff)
        │
        ├─ 6. analyzeWithAI()        → raw LLM response (JSON string)
        │      routes to: Groq / OpenAI / Claude / Gemini
        │
        ├─ 7. parseAIResponse()      → typed JS object
        │
        └─ 8. Hybrid score merge     → final_score = (heuristic×0.4) + (llm×0.6)
               Assemble PRAnalysisReport
        │
        ▼
Frontend renders report:
  MetaBanner → RiskMeter + SummarySection
  ReviewStrategy → CriticalFiles
  AutoComments → BlindSpots → DependencyImpact
```

---

## 🔑 Minimum Keys to Get Started

| Key | Where | Required |
|---|---|---|
| `GITHUB_TOKEN` | github.com/settings/tokens → public_repo scope | ✅ |
| `GROQ_API_KEY` | console.groq.com | ✅ (default) |
| `OPENAI_API_KEY` | platform.openai.com | Optional |
| `ANTHROPIC_API_KEY` | console.anthropic.com | Optional |
| `GEMINI_API_KEY` | aistudio.google.com | Optional |

---

## ✅ What This Demonstrates to Evaluators

- Hybrid AI system design — not just an LLM wrapper
- Two-stage reasoning pipeline (heuristics → LLM)
- Structured prompt engineering with constrained JSON output
- Multi-provider AI abstraction with env-based switching
- Full-stack TypeScript with strict types end-to-end
- Clean component architecture with separation of concerns
- Real-world developer tooling solving a real pain point
- Deployed live product with working demo
