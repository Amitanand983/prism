import type { ParsedPRUrl } from "@/types"

export function parsePRUrl(url: string): ParsedPRUrl {
  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    throw new Error("Invalid GitHub PR URL. Expected: https://github.com/owner/repo/pull/123")
  }

  if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") {
    throw new Error("Only github.com pull request URLs are supported")
  }

  const [owner, repo, pullSegment, prNumber] = parsed.pathname.split("/").filter(Boolean)
  const numericPrNumber = Number(prNumber)

  if (!owner || !repo || pullSegment !== "pull" || !Number.isInteger(numericPrNumber) || numericPrNumber < 1) {
    throw new Error("Invalid GitHub PR URL. Expected: https://github.com/owner/repo/pull/123")
  }

  return {
    owner,
    repo,
    pr_number: numericPrNumber,
  }
}
