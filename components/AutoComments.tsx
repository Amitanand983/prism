import type { AutoComment } from "@/types"

interface Props {
  comments: AutoComment[]
}

const SEVERITY_STYLES: Record<AutoComment["severity"], string> = {
  CRITICAL: "border-red-500/30 bg-red-500/10 text-red-400",
  WARNING: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  INFO: "border-blue-500/30 bg-blue-500/10 text-blue-400",
}

export default function AutoComments({ comments }: Props) {
  if (!comments.length) return null

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-400">Auto-Generated Review Comments</p>
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={`${comment.file}-${comment.line_hint}-${comment.comment}`} className={`rounded-xl border p-4 ${SEVERITY_STYLES[comment.severity]}`}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded bg-gray-950/40 px-2 py-0.5 text-xs font-semibold">{comment.severity}</span>
              <span className="font-mono text-xs text-gray-300">{comment.file}</span>
              <span className="text-xs text-gray-500">{comment.line_hint}</span>
            </div>
            <p className="text-sm leading-6 text-gray-200">{comment.comment}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
