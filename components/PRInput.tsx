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
    <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row">
      <input
        type="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") handleSubmit()
        }}
        placeholder="https://github.com/owner/repo/pull/123"
        className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder:text-gray-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        disabled={loading}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !url.trim()}
        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-700"
      >
        {loading ? "Analyzing..." : "Analyze PR"}
      </button>
    </div>
  )
}
