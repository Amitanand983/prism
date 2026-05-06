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
  const showHistoryPanel = Boolean(user && !report && !loading)

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
    <main className="relative min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:72px_72px]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-sm font-black text-blue-200 shadow-lg shadow-blue-950/30">
              PI
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-white sm:text-base">
                PRISM
                <span className="hidden text-slate-400 lg:inline"> (PR Intelligence System Mechanism)</span>
              </h1>
              <p className="text-xs text-slate-400">PR Intelligence System Mechanism</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
            Production-ready analysis workspace
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12 sm:py-16">
        {!report && !loading && !error && (
          <section className="mx-auto mb-12 max-w-4xl text-center sm:mb-14">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-200 shadow-lg shadow-blue-950/30">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
              GitHub PR analysis
            </div>
            <h2 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              Know the risk before
              <span className="block bg-gradient-to-r from-blue-200 via-cyan-200 to-slate-100 bg-clip-text text-transparent">
                you review.
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
              Paste a public GitHub pull request link to generate a risk score, review plan, blind spots, and
              ready-to-use reviewer comments.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3 text-xs text-slate-400">
              {["Risk scoring", "Impact map", "Review strategy", "Saved history"].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  {item}
                </span>
              ))}
            </div>
          </section>
        )}

        <AuthPanel user={user} onAuthChange={handleAuthChange} />

        {!authLoading && user && (
          <div
            className={`mt-8 grid items-start gap-6 ${
              showHistoryPanel ? "lg:grid-cols-[minmax(0,1fr)_320px]" : "grid-cols-1"
            }`}
          >
            <div className="min-w-0">
              <PRInput loading={loading} onAnalyze={handleAnalyze} />
              {loading && <LoadingState />}
              {error && <ErrorState message={error} />}
              {report && <ReportCard report={report} />}
            </div>
            {showHistoryPanel && (
              <aside className="lg:sticky lg:top-24">
                <HistoryList history={history} loading={historyLoading} error={historyError} onSelect={setReport} />
              </aside>
            )}
          </div>
        )}

        {!authLoading && !user && (
          <p className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center text-sm text-slate-400 shadow-2xl shadow-black/20 backdrop-blur-xl">
            Sign in to analyze PRs and save your history.
          </p>
        )}

        {!authLoading && !user && error && <ErrorState message={error} />}
      </div>
    </main>
  )
}
