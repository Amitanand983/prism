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
    <section className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-300">History</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Recent PR analyses</h2>
        </div>
        {loading && <p className="text-sm text-gray-500">Loading...</p>}
      </div>

      {error && (
        <p className="mb-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          {error}
        </p>
      )}

      {!loading && !error && history.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-700 p-4 text-sm text-gray-400">
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
              className="w-full rounded-xl border border-gray-800 bg-gray-950 p-4 text-left transition hover:border-blue-500/70"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-white">{item.pr_title}</p>
                  <p className="mt-1 break-all text-xs text-gray-500">{item.pr_url}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <span className="rounded-full border border-gray-700 px-2 py-1 text-gray-300">{item.risk_level}</span>
                  <span className="rounded-full bg-blue-500/10 px-2 py-1 text-blue-300">{item.risk_score}/10</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500">{formatDate(item.created_at)}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
