"use client"

import { useCallback, useEffect, useState } from "react"
import AuthPanel from "@/components/AuthPanel"
import ErrorState from "@/components/ErrorState"
import HistoryList from "@/components/HistoryList"
import LoadingState from "@/components/LoadingState"
import PRInput from "@/components/PRInput"
import ReportCard from "@/components/ReportCard"
import type { AnalysisHistoryItem, AuthUser } from "@/lib/supabase"
import type { PRAnalysisReport } from "@/types"

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [report, setReport] = useState<PRAnalysisReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError(null)

    try {
      const res = await fetch("/api/history")
      const data = (await res.json()) as { history?: AnalysisHistoryItem[]; error?: string }

      if (!res.ok) {
        throw new Error(data.error ?? "Could not load analysis history")
      }

      setHistory(data.history ?? [])
    } catch (err: unknown) {
      setHistoryError(err instanceof Error ? err.message : "Could not load analysis history")
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    fetch("/api/auth/session")
      .then((res) => res.json() as Promise<{ user: AuthUser | null }>)
      .then((data) => {
        if (!active) return
        setUser(data.user)
        setAuthLoading(false)
        if (data.user) {
          void loadHistory()
        }
      })
      .catch(() => {
      if (!active) return
      setAuthLoading(false)
      })

    return () => {
      active = false
    }
  }, [loadHistory])

  function handleAuthChange(nextUser: AuthUser | null) {
    setUser(nextUser)
    setError(null)
    setHistoryError(null)
    setReport(null)

    if (nextUser) {
      void loadHistory()
      return
    }

    setHistory([])
  }

  async function handleAnalyze(url: string) {
    if (!user) {
      setError("Sign in with email OTP before analyzing a PR.")
      return
    }

    setLoading(true)
    setError(null)
    setHistoryError(null)
    setReport(null)

    try {
      const res = await fetch("/api/analyze-pr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })
      const data = (await res.json()) as PRAnalysisReport | { error?: string }

      if (!res.ok) {
        throw new Error("error" in data ? data.error : "Analysis failed")
      }

      setReport(data as PRAnalysisReport)
      await loadHistory()
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

        <AuthPanel user={user} onAuthChange={handleAuthChange} />

        {!authLoading && user && (
          <>
            <div className="mt-8">
              <PRInput loading={loading} onAnalyze={handleAnalyze} />
            </div>
            <HistoryList history={history} loading={historyLoading} error={historyError} onSelect={setReport} />
          </>
        )}

        {!authLoading && !user && (
          <p className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 p-5 text-center text-sm text-gray-400">
            Sign in to analyze PRs and save your history.
          </p>
        )}

        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}
        {report && <ReportCard report={report} />}
      </div>
    </main>
  )
}
