import type { ReviewChecklistItem } from "@/types"

interface Props {
  items?: ReviewChecklistItem[]
}

const PRIORITY_STYLE: Record<ReviewChecklistItem["priority"], string> = {
  HIGH: "border-red-400/20 bg-red-500/10 text-red-200",
  MEDIUM: "border-yellow-400/20 bg-yellow-500/10 text-yellow-200",
  LOW: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
}

export default function ReviewChecklist({ items = [] }: Props) {
  if (!items.length) return null

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Actionable workflow</p>
        <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Review checklist</h3>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${item.task}-${index}`} className="flex min-w-0 gap-3 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/20 text-xs text-slate-500">
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${PRIORITY_STYLE[item.priority]}`}>
                  {item.priority}
                </span>
                {item.file && <span className="break-all font-mono text-xs text-blue-300">{item.file}</span>}
              </div>
              <p className="mt-2 break-words text-sm font-bold text-white">{item.task}</p>
              <p className="mt-1 break-words text-xs leading-5 text-slate-400">{item.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
