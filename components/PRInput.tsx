"use client"

import { useState } from "react"

interface Props {
  loading: boolean
  onAnalyze: (url: string) => void
}

export default function PRInput({ loading, onAnalyze }: Props) {
  const [url, setUrl] = useState("")

  function handleSubmit() {
    const trimmed = url.trim()
    if (!trimmed || loading) return
    onAnalyze(trimmed)
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.045] p-3 shadow-2xl shadow-black/25 backdrop-blur-xl sm:flex-row">
      <input
        type="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") handleSubmit()
        }}
        placeholder="https://github.com/owner/repo/pull/123"
        className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 font-mono text-sm text-white shadow-inner shadow-black/20 outline-none transition placeholder:font-sans placeholder:text-slate-600 focus:border-blue-400/60 focus:ring-4 focus:ring-blue-500/10"
        disabled={loading}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !url.trim()}
        className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/40 transition hover:scale-[1.01] hover:from-blue-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none"
      >
        {loading ? "Analyzing..." : "Analyze PR"}
      </button>
    </div>
  )
}
