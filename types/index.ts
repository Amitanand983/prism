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
  score: number
  heuristic_score: number
  llm_score: number
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  reason: string
}

export interface CriticalFile {
  file: string
  reason: string
  risk_contribution: "LOW" | "MEDIUM" | "HIGH"
}

export interface ImpactMapEntry {
  area: string
  description: string
  review_focus: string
  flow: string[]
  signals: string[]
  files: string[]
  additions: number
  deletions: number
  changes: number
}

export interface ReviewConcern {
  author: string
  source: "review" | "comment"
  state?: string
  file?: string
  concern: string
}

export interface AutoComment {
  file: string
  line_hint: string
  comment: string
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
  impact_map: ImpactMapEntry[]
  active_review_concerns: ReviewConcern[]
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

export interface GitHubReview {
  user: { login: string }
  state: string
  body: string | null
  submitted_at: string | null
}

export interface GitHubReviewComment {
  user: { login: string }
  path: string
  body: string
  created_at: string
}

export interface GitHubPRData {
  title: string
  body: string | null
  user: { login: string }
  base: { ref: string }
  head: { ref: string }
  additions: number
  deletions: number
  changed_files: number
  html_url: string
}

export interface ParsedPRUrl {
  owner: string
  repo: string
  pr_number: number
}
