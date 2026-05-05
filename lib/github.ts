import type { GitHubFile, GitHubPRData, GitHubReview, GitHubReviewComment } from "@/types"

const BASE = "https://api.github.com"
const MAX_FILE_PAGES = 10

function githubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  return headers
}

async function fetchGitHub<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: githubHeaders(),
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    const body = await res.text()
    const detail = body ? `: ${body.slice(0, 240)}` : ""
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}${detail}`)
  }

  return res.json() as Promise<T>
}

export async function fetchPRData(owner: string, repo: string, prNumber: number): Promise<GitHubPRData> {
  return fetchGitHub<GitHubPRData>(`/repos/${owner}/${repo}/pulls/${prNumber}`)
}

export async function fetchPRFiles(owner: string, repo: string, prNumber: number): Promise<GitHubFile[]> {
  const files: GitHubFile[] = []

  for (let page = 1; page <= MAX_FILE_PAGES; page += 1) {
    const batch = await fetchGitHub<GitHubFile[]>(
      `/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100&page=${page}`,
    )

    files.push(...batch)

    if (batch.length < 100) break
  }

  return files
}

export async function fetchPRReviews(owner: string, repo: string, prNumber: number): Promise<GitHubReview[]> {
  return fetchGitHub<GitHubReview[]>(`/repos/${owner}/${repo}/pulls/${prNumber}/reviews`)
}

export async function fetchPRReviewComments(
  owner: string,
  repo: string,
  prNumber: number,
): Promise<GitHubReviewComment[]> {
  return fetchGitHub<GitHubReviewComment[]>(`/repos/${owner}/${repo}/pulls/${prNumber}/comments`)
}

export function buildDiffContent(files: GitHubFile[]): string {
  return files
    .map((file) => {
      const patch = file.patch ?? "(binary file, renamed file, or patch unavailable)"
      return `### ${file.filename} (+${file.additions} -${file.deletions})\n${patch}`
    })
    .join("\n\n---\n\n")
}
