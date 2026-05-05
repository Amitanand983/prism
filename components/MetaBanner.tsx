import type { PRMeta } from "@/types"

interface Props {
  meta: PRMeta
}

export default function MetaBanner({ meta }: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <a
            href={meta.pr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block break-words text-xl font-bold tracking-tight text-white transition hover:text-blue-200"
          >
            {meta.pr_title}
          </a>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
            by <span className="text-slate-200">{meta.author}</span>
            <span className="text-slate-600">/</span>
            <span className="max-w-full break-all rounded-lg border border-white/10 bg-slate-950/60 px-2 py-1 font-mono text-xs text-slate-300">
              {meta.base_branch}
            </span>
            <span className="text-slate-600">from</span>
            <span className="max-w-full break-all rounded-lg border border-white/10 bg-slate-950/60 px-2 py-1 font-mono text-xs text-slate-300">
              {meta.head_branch}
            </span>
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-3 gap-3 text-sm lg:min-w-72">
          <Stat label="Files" value={meta.files_changed} />
          <Stat label="Additions" value={`+${meta.additions}`} color="text-emerald-300" />
          <Stat label="Deletions" value={`-${meta.deletions}`} color="text-red-300" />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color = "text-white" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-center">
      <div className={`font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  )
}
