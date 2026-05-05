import type { ReviewConcern } from "@/types"

interface Props {
  concerns: ReviewConcern[]
}

export default function ReviewConcerns({ concerns }: Props) {
  if (!concerns.length) return null

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Active Review Context</p>
        <p className="mt-1 text-sm text-slate-500">
          Existing reviewer questions or comments found on the PR. These are context, not automatic risk flags.
        </p>
      </div>

      <div className="space-y-3">
        {concerns.map((concern) => (
          <div key={`${concern.author}-${concern.file ?? concern.state}-${concern.concern}`} className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/55 p-4">
            <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2 text-xs">
              <span className="break-all font-medium text-slate-300">@{concern.author}</span>
              <span className="rounded border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 uppercase text-blue-300">
                {concern.source}
              </span>
              {concern.state && <span className="text-slate-500">{concern.state.replaceAll("_", " ").toLowerCase()}</span>}
            </div>
            {concern.file && <p className="mb-2 break-all font-mono text-xs leading-5 text-blue-300">{concern.file}</p>}
            <p className="break-words text-sm leading-6 text-slate-300">{concern.concern}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
