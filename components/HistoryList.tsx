"use client"

import type { AnalysisHistoryItem } from "@/lib/supabase"
import type { PRAnalysisReport } from "@/types"

interface Props {
  history: AnalysisHistoryItem[]
  loading: boolean
  error: string | null
  onSelect: (report: PRAnalysisReport) => void
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

export default function HistoryList({ history, loading, error, onSelect }: Props) {
  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">History</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Recent PR analyses</h2>
        </div>
        {loading && (
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">
            Loading...
          </span>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          {error}
        </p>
      )}

      {!loading && !error && history.length === 0 && (
        <p className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-5 text-sm text-slate-400">
          Your saved analyses will appear here after you run one.
        </p>
      )}

      {history.length > 0 && (
        <div className="space-y-3">
          {history.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.report)}
              className="group w-full rounded-2xl border border-white/10 bg-slate-950/55 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-400/50 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-blue-950/20"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-white transition group-hover:text-blue-100">
                    {item.pr_title}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-500">{item.pr_url}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-slate-300">
                    {item.risk_level}
                  </span>
                  <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-1 text-blue-200">
                    {item.risk_score}/10
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">{formatDate(item.created_at)}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
