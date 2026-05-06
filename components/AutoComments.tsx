"use client"

import { useState } from "react"
import type { AutoComment } from "@/types"

interface Props {
  comments: AutoComment[]
}

const SEVERITY_STYLES: Record<AutoComment["severity"], string> = {
  CRITICAL: "border-red-500/30 bg-red-500/10 text-red-300",
  WARNING: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  INFO: "border-blue-500/30 bg-blue-500/10 text-blue-300",
}

export default function AutoComments({ comments }: Props) {
  const [copiedIndex, setCopiedIndex] = useState<number | "all" | null>(null)

  if (!comments.length) return null

  async function copyAllComments() {
    await navigator.clipboard.writeText(comments.map(buildCommentMarkdown).join("\n\n---\n\n"))
    setCopiedIndex("all")
    window.setTimeout(() => setCopiedIndex(null), 1600)
  }

  async function copyComment(comment: AutoComment, index: number) {
    await navigator.clipboard.writeText(buildCommentMarkdown(comment))
    setCopiedIndex(index)
    window.setTimeout(() => setCopiedIndex(null), 1600)
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Auto-Generated Review Comments</p>
          <p className="mt-1 text-sm text-slate-500">Copy these directly into a GitHub review.</p>
        </div>
        <button
          type="button"
          onClick={copyAllComments}
          className="w-fit rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-200 transition hover:border-blue-300/50 hover:bg-blue-500/20"
        >
          {copiedIndex === "all" ? "Copied all" : "Copy all review comments"}
        </button>
      </div>
      <div className="space-y-4">
        {comments.map((comment, index) => (
          <div key={`${comment.file}-${comment.line_hint}-${comment.comment}`} className={`rounded-2xl border p-4 ${SEVERITY_STYLES[comment.severity]}`}>
            <div className="mb-2 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 flex-wrap items-start gap-2">
                <span className="shrink-0 rounded-full border border-white/10 bg-slate-950/40 px-2 py-0.5 text-xs font-bold">
                  {comment.severity}
                </span>
                <span className="min-w-0 break-all font-mono text-xs leading-5 text-slate-300">{comment.file}</span>
                <span className="shrink-0 text-xs text-slate-500">{comment.line_hint}</span>
              </div>
              <button
                type="button"
                onClick={() => copyComment(comment, index)}
                className="shrink-0 rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs font-bold text-slate-300 transition hover:border-blue-400/40 hover:text-blue-200"
              >
                {copiedIndex === index ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-sm leading-6 text-slate-200">{comment.comment}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function buildCommentMarkdown(comment: AutoComment) {
  return [`**${comment.severity}** ${comment.file}`, "", `_${comment.line_hint}_`, "", comment.comment].join("\n")
}
