import path from "path"
import type { GitHubFile, GitHubPRData, GitHubReview, GitHubReviewComment, RepoContext, RepoContextFile } from "@/types"

const BASE = "https://api.github.com"
const MAX_FILE_PAGES = 10
const MAX_CONTEXT_SNIPPET_CHARS = 900
const MAX_CONTEXT_CHANGED_FILES = 8
const MAX_CONTEXT_DIRS = 6

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

async function fetchGitHubOptional<T>(pathName: string): Promise<T | null> {
  const res = await fetch(`${BASE}${pathName}`, {
    headers: githubHeaders(),
    next: { revalidate: 0 },
  })

  if (!res.ok) return null

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

interface GitHubContentFile {
  type: "file"
  name: string
  path: string
  content?: string
  encoding?: string
}

interface GitHubContentDirectoryItem {
  type: "file" | "dir" | "symlink" | "submodule"
  name: string
  path: string
}

export async function fetchRepoContext(owner: string, repo: string, pr: GitHubPRData, files: GitHubFile[]): Promise<RepoContext> {
  const ref = pr.base.ref
  const changedFiles = files.slice(0, MAX_CONTEXT_CHANGED_FILES)
  const dirs = unique(changedFiles.map((file) => path.posix.dirname(file.filename)).filter((dir) => dir !== ".")).slice(
    0,
    MAX_CONTEXT_DIRS,
  )

  const [manifests, docs, directoryListings, relatedTests] = await Promise.all([
    fetchContextFileGroup(owner, repo, ref, [
      "package.json",
      "pnpm-lock.yaml",
      "yarn.lock",
      "package-lock.json",
      "pom.xml",
      "build.gradle",
      "build.gradle.kts",
      "requirements.txt",
      "pyproject.toml",
      "go.mod",
    ]),
    fetchContextFileGroup(owner, repo, ref, ["README.md", "readme.md", "docs/README.md", "CONTRIBUTING.md"]),
    Promise.all(dirs.map((dir) => fetchRepoDirectory(owner, repo, dir, ref))),
    fetchRelatedTests(owner, repo, ref, changedFiles),
  ])

  const directoryItems = directoryListings.flat()
  const nearbyFiles = await fetchNearbyFiles(owner, repo, ref, changedFiles, directoryItems)
  const similarFiles = await fetchSimilarFiles(owner, repo, ref, changedFiles, directoryItems)
  const imports = extractImports(files)

  return {
    manifests,
    docs,
    nearby_files: nearbyFiles,
    related_tests: relatedTests,
    similar_files: similarFiles,
    imports,
    notes: [
      relatedTests.length
        ? `Found ${relatedTests.length} likely related test file${relatedTests.length === 1 ? "" : "s"}.`
        : "No likely related test file was found in sampled repository context.",
      nearbyFiles.length
        ? `Fetched ${nearbyFiles.length} nearby file${nearbyFiles.length === 1 ? "" : "s"} from changed directories.`
        : "No nearby files were fetched from changed directories.",
    ],
  }
}

async function fetchRepoFile(owner: string, repo: string, filePath: string, ref: string): Promise<RepoContextFile | null> {
  const encodedPath = encodePath(filePath)
  const file = await fetchGitHubOptional<GitHubContentFile>(
    `/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`,
  )

  if (!file || file.type !== "file" || !file.content || file.encoding !== "base64") return null

  return {
    path: file.path,
    reason: "Fetched as repository context",
    snippet: trimSnippet(Buffer.from(file.content, "base64").toString("utf8")),
  }
}

async function fetchRepoDirectory(owner: string, repo: string, dirPath: string, ref: string) {
  const encodedPath = encodePath(dirPath)
  const suffix = encodedPath ? `/${encodedPath}` : ""
  const result = await fetchGitHubOptional<GitHubContentDirectoryItem[]>(
    `/repos/${owner}/${repo}/contents${suffix}?ref=${encodeURIComponent(ref)}`,
  )

  return Array.isArray(result) ? result : []
}

async function fetchContextFileGroup(owner: string, repo: string, ref: string, paths: string[]) {
  const results = await Promise.all(paths.map((filePath) => fetchRepoFile(owner, repo, filePath, ref)))

  return results.filter((file): file is RepoContextFile => Boolean(file)).map((file) => ({
    ...file,
    reason: "Project-level context file",
  }))
}

async function fetchNearbyFiles(
  owner: string,
  repo: string,
  ref: string,
  changedFiles: GitHubFile[],
  directoryItems: GitHubContentDirectoryItem[],
) {
  const changedFileNames = new Set(changedFiles.map((file) => file.filename))
  const extensions = new Set(changedFiles.map((file) => path.posix.extname(file.filename)).filter(Boolean))
  const candidates = directoryItems
    .filter((item) => item.type === "file")
    .filter((item) => !changedFileNames.has(item.path))
    .filter((item) => extensions.has(path.posix.extname(item.path)))
    .slice(0, 6)
  const results = await Promise.all(candidates.map((item) => fetchRepoFile(owner, repo, item.path, ref)))

  return results.filter((file): file is RepoContextFile => Boolean(file)).map((file) => ({
    ...file,
    reason: "Neighboring file in a changed directory",
  }))
}

async function fetchSimilarFiles(
  owner: string,
  repo: string,
  ref: string,
  changedFiles: GitHubFile[],
  directoryItems: GitHubContentDirectoryItem[],
) {
  const changedFileNames = new Set(changedFiles.map((file) => file.filename))
  const baseNames = new Set(changedFiles.map((file) => normalizeBaseName(path.posix.basename(file.filename))))
  const candidates = directoryItems
    .filter((item) => item.type === "file")
    .filter((item) => !changedFileNames.has(item.path))
    .filter((item) => baseNames.has(normalizeBaseName(item.name)))
    .slice(0, 6)
  const results = await Promise.all(candidates.map((item) => fetchRepoFile(owner, repo, item.path, ref)))

  return results.filter((file): file is RepoContextFile => Boolean(file)).map((file) => ({
    ...file,
    reason: "Similar filename near a changed file",
  }))
}

async function fetchRelatedTests(owner: string, repo: string, ref: string, changedFiles: GitHubFile[]) {
  const candidates = unique(changedFiles.flatMap((file) => testCandidatesFor(file.filename))).slice(0, 12)
  const results = await Promise.all(candidates.map((candidate) => fetchRepoFile(owner, repo, candidate, ref)))

  return results.filter((file): file is RepoContextFile => Boolean(file)).map((file) => ({
    ...file,
    reason: "Likely test file related to changed code",
  }))
}

function testCandidatesFor(filePath: string) {
  const dir = path.posix.dirname(filePath)
  const ext = path.posix.extname(filePath)
  const name = path.posix.basename(filePath, ext)
  const candidates = [
    `${dir}/${name}.test${ext}`,
    `${dir}/${name}.spec${ext}`,
    `${dir}/__tests__/${name}.test${ext}`,
    `${dir}/__tests__/${name}.spec${ext}`,
    `${dir}/${name}Test${ext}`,
  ]

  if (filePath.includes("/src/main/")) {
    candidates.push(filePath.replace("/src/main/", "/src/test/").replace(`${name}${ext}`, `${name}Test${ext}`))
  }

  if (filePath.startsWith("src/")) {
    candidates.push(`test/${filePath.slice("src/".length)}`, `tests/${filePath.slice("src/".length)}`)
  }

  return candidates
}

function extractImports(files: GitHubFile[]) {
  const imports = new Set<string>()

  for (const file of files) {
    for (const line of file.patch?.split("\n") ?? []) {
      const cleaned = line.replace(/^[+-]/, "").trim()
      if (/^(import|from|const .* require|require\(|#include|using |package )/.test(cleaned)) {
        imports.add(cleaned.slice(0, 180))
      }
    }
  }

  return [...imports].slice(0, 24)
}

function normalizeBaseName(name: string) {
  return name
    .replace(/\.(test|spec|stories|controller|service|helper|util|utils|component|module|schema|config)/gi, "")
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
}

function trimSnippet(value: string) {
  return value.length > MAX_CONTEXT_SNIPPET_CHARS
    ? `${value.slice(0, MAX_CONTEXT_SNIPPET_CHARS)}\n[truncated]`
    : value
}

function encodePath(filePath: string) {
  return filePath
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/")
}

function unique<T>(values: T[]) {
  return [...new Set(values)]
}

export function buildDiffContent(files: GitHubFile[]): string {
  return files
    .map((file) => {
      const patch = file.patch ?? "(binary file, renamed file, or patch unavailable)"
      return `### ${file.filename} (+${file.additions} -${file.deletions})\n${patch}`
    })
    .join("\n\n---\n\n")
}
