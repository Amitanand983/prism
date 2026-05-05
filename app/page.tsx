"use client"

import { useState } from "react"
import ErrorState from "@/components/ErrorState"
import LoadingState from "@/components/LoadingState"
import PRInput from "@/components/PRInput"
import ReportCard from "@/components/ReportCard"
import type { PRAnalysisReport } from "@/types"

export default function Home() {
  const [report, setReport] = useState<PRAnalysisReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const data = (await res.json()) as PRAnalysisReport | { error?: string }

      if (!res.ok) {
        throw new Error("error" in data ? data.error : "Analysis failed")
      }

      setReport(data as PRAnalysisReport)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900/80">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-sm font-bold text-blue-300">
            PR
          </div>
          <div>
            <h1 className="text-lg font-semibold">PR Intelligence Layer</h1>
            <p className="text-xs text-gray-400">AI-powered code review briefing</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12">
        {!report && !loading && !error && (
          <section className="mb-12 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-blue-300">GitHub PR analysis</p>
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Know your PR before you review it.
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-gray-400">
              Paste a public GitHub pull request link to generate a risk score, review plan, blind spots, and
              ready-to-use reviewer comments.
            </p>
          </section>
        )}

        <PRInput loading={loading} onAnalyze={handleAnalyze} />

        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}
        {report && <ReportCard report={report} />}
      </div>
    </main>
  )
}
