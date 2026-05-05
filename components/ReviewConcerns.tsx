import type { ReviewConcern } from "@/types"

interface Props {
  concerns: ReviewConcern[]
}

export default function ReviewConcerns({ concerns }: Props) {
  if (!concerns.length) return null

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Active Review Context</p>
        <p className="mt-1 text-sm text-gray-500">
          Existing reviewer questions or comments found on the PR. These are context, not automatic risk flags.
        </p>
      </div>

      <div className="space-y-3">
        {concerns.map((concern) => (
          <div key={`${concern.author}-${concern.file ?? concern.state}-${concern.concern}`} className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-gray-300">@{concern.author}</span>
              <span className="rounded border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 uppercase text-blue-300">
                {concern.source}
              </span>
              {concern.state && <span className="text-gray-500">{concern.state.replaceAll("_", " ").toLowerCase()}</span>}
            </div>
            {concern.file && <p className="mb-2 truncate font-mono text-xs text-blue-300">{concern.file}</p>}
            <p className="text-sm leading-6 text-gray-300">{concern.concern}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
