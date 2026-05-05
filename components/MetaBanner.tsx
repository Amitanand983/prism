import type { PRMeta } from "@/types"

interface Props {
  meta: PRMeta
}

export default function MetaBanner({ meta }: Props) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <a
            href={meta.pr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-white transition hover:text-blue-400"
          >
            {meta.pr_title}
          </a>
          <p className="mt-1 text-sm text-gray-400">
            by <span className="text-gray-300">{meta.author}</span>
            <span className="mx-2 text-gray-600">/</span>
            <span className="rounded bg-gray-800 px-2 py-0.5 font-mono text-xs">{meta.base_branch}</span>
            <span className="mx-2 text-gray-600">from</span>
            <span className="rounded bg-gray-800 px-2 py-0.5 font-mono text-xs">{meta.head_branch}</span>
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <Stat label="Files" value={meta.files_changed} />
          <Stat label="Additions" value={`+${meta.additions}`} color="text-green-400" />
          <Stat label="Deletions" value={`-${meta.deletions}`} color="text-red-400" />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color = "text-white" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="text-center">
      <div className={`font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}
