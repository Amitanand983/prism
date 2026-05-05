import type { GitHubFile, HeuristicSignals } from "@/types"

const SENSITIVE_PATTERNS = [
  { pattern: /auth/i, weight: 2, flag: "Authentication logic modified" },
  { pattern: /middleware/i, weight: 2, flag: "Middleware modified" },
  { pattern: /config|\.env/i, weight: 2, flag: "Configuration file changed" },
  { pattern: /payment|billing|stripe/i, weight: 3, flag: "Payment logic touched" },
  { pattern: /database|migration|schema/i, weight: 2, flag: "Database schema modified" },
  { pattern: /security|crypto|jwt|token|password/i, weight: 3, flag: "Security-sensitive code changed" },
  { pattern: /dockerfile|\.github|ci|cd|deploy/i, weight: 1, flag: "Infrastructure/CI config changed" },
  { pattern: /test|spec/i, weight: -1, flag: "Test files included" },
]

export function runHeuristics(files: GitHubFile[], additions: number, deletions: number): HeuristicSignals {
  let score = 1
  const sensitiveFiles = new Set<string>()
  const highRiskPatterns = new Set<string>()
  const flags = new Set<string>()
  let testFileCount = 0

  for (const file of files) {
    for (const { pattern, weight, flag } of SENSITIVE_PATTERNS) {
      if (!pattern.test(file.filename)) continue

      score += weight

      if (weight > 0) {
        sensitiveFiles.add(file.filename)
        highRiskPatterns.add(flag)
        flags.add(flag)
      } else {
        testFileCount += 1
      }
    }
  }

  if (testFileCount > 0) {
    flags.add("Test files included")
  }

  const totalChanges = additions + deletions
  let changeSize: HeuristicSignals["change_size"] = "SMALL"

  if (totalChanges > 1000) {
    score += 3
    changeSize = "MASSIVE"
  } else if (totalChanges > 500) {
    score += 2
    changeSize = "LARGE"
  } else if (totalChanges > 100) {
    score += 1
    changeSize = "MEDIUM"
  }

  if (files.length > 20) score += 2
  else if (files.length > 10) score += 1

  if (testFileCount > 0 && testFileCount >= Math.ceil(files.length / 3)) {
    score -= 1
  }

  return {
    sensitive_files: [...sensitiveFiles],
    change_size: changeSize,
    high_risk_patterns: [...highRiskPatterns],
    heuristic_score: Math.min(10, Math.max(1, score)),
    flags: [...flags],
  }
}
