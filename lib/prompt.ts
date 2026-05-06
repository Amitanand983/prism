import type { GitHubPRData, HeuristicSignals, RepoContext } from "@/types"

const MAX_DIFF_CHARS = 14000

export function buildPrompt(pr: GitHubPRData, signals: HeuristicSignals, diff: string, repoContext?: RepoContext): string {
  const diffForPrompt =
    diff.length > MAX_DIFF_CHARS ? `${diff.slice(0, MAX_DIFF_CHARS)}\n\n[diff truncated for length]` : diff

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

## Heuristic Signals
Change size: ${signals.change_size}
Heuristic risk score: ${signals.heuristic_score}/10
Sensitive files detected: ${signals.sensitive_files.join(", ") || "none"}
Risk flags: ${signals.flags.join(", ") || "none"}
High risk patterns: ${signals.high_risk_patterns.join(", ") || "none"}

---

## Diff Content
${diffForPrompt}

---

## Repo Context Lite
${formatRepoContext(repoContext)}

---

## Instructions
Return ONLY a valid JSON object. No markdown. No explanation. No preamble.

Tone and scoring guidance:
- Be direct and evidence-based, not alarmist.
- Score the reviewed implementation as it exists in the diff, not the worst possible version of the feature.
- If a PR touches sensitive behavior but the implementation is small, well-contained, and tested, say that clearly.
- Distinguish between user/business impact of the bug being fixed and residual risk in the proposed change.
- Avoid fear-mongering language. Prefer "review focus", "residual risk", and "validated by tests" over dramatic wording.

The JSON must follow this exact structure:
{
  "summary": "2-3 sentence semantic summary of what actually changed and why",
  "llm_score": 1,
  "risk_reason": "Why you assigned this score, specific to this diff",
  "critical_files": [
    {
      "file": "exact/file/path.ts",
      "reason": "Specific reason this file needs attention",
      "risk_contribution": "HIGH"
    }
  ],
  "risk_explanations": [
    {
      "subject": "Specific risk area or file",
      "file": "optional/exact/file/path",
      "why_this_matters": "Explain in reviewer-friendly language why this risk matters",
      "reviewer_guidance": "Concrete thing a reviewer should verify",
      "severity": "HIGH"
    }
  ],
  "reviewer_blind_spots": [
    "Specific, concrete thing a reviewer might miss"
  ],
  "dependency_impact": "What other parts of the codebase or downstream systems may be affected",
  "auto_comments": [
    {
      "file": "exact/file/path.ts",
      "line_hint": "around the specific block or function name",
      "comment": "Ready-to-post GitHub review comment. Be specific and actionable.",
      "severity": "WARNING"
    }
  ],
  "review_strategy": [
    {
      "step": 1,
      "action": "What to do",
      "target": "Which file or area",
      "reason": "Why start here"
    }
  ],
  "review_checklist": [
    {
      "task": "Concrete verification task for the reviewer",
      "reason": "Why this task matters",
      "file": "optional/exact/file/path",
      "priority": "HIGH"
    }
  ]
}

Rules:
- llm_score must be a number from 1 to 10.
- risk_contribution must be one of LOW, MEDIUM, HIGH.
- severity must be one of INFO, WARNING, CRITICAL.
- risk_explanations severity must be one of LOW, MEDIUM, HIGH, CRITICAL.
- review_checklist priority must be one of LOW, MEDIUM, HIGH.
- risk_explanations should teach reviewers why each important risk matters in practical terms.
- review_checklist should contain 4-7 concrete tasks a reviewer can execute.
- reviewer_blind_spots must be specific to THIS diff, not generic advice.
- auto_comments must reference actual files from the diff.
- review_strategy should have 3-5 steps ordered by priority.
- Return nothing except the JSON object.`
}

function formatRepoContext(context?: RepoContext) {
  if (!context) {
    return "No additional repository context was available."
  }

  const sections = [
    formatContextFiles("Manifests and build files", context.manifests),
    formatContextFiles("README and documentation", context.docs),
    formatContextFiles("Nearby files", context.nearby_files),
    formatContextFiles("Related tests", context.related_tests),
    formatContextFiles("Similar files", context.similar_files),
    context.imports.length ? `Imports observed in changed files:\n${context.imports.map((item) => `- ${item}`).join("\n")}` : "",
    context.notes.length ? `Context notes:\n${context.notes.map((item) => `- ${item}`).join("\n")}` : "",
  ].filter(Boolean)

  return sections.length ? sections.join("\n\n") : "No additional repository context was available."
}

function formatContextFiles(title: string, files: RepoContext["manifests"]) {
  if (!files.length) return ""

  return `${title}:\n${files
    .map((file) => {
      const snippet = file.snippet ? `\nSnippet:\n${file.snippet}` : ""
      return `- ${file.path}: ${file.reason}${snippet}`
    })
    .join("\n")}`
}
