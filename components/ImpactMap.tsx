import type { ImpactMapEntry } from "@/types"

interface Props {
  impacts: ImpactMapEntry[]
}

const MAX_VISIBLE_FILES = 4

export default function ImpactMap({ impacts }: Props) {
  if (!impacts.length) return null

  const totalChanges = impacts.reduce((sum, impact) => sum + impact.changes, 0)

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Impact Map</p>
        <p className="mt-1 text-sm text-slate-500">
          A grouped view of what this PR is likely to affect and where reviewers should focus.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {impacts.map((impact) => {
          const share = Math.max(percent(impact.changes, totalChanges), 3)
          const hiddenFileCount = Math.max(impact.files.length - MAX_VISIBLE_FILES, 0)

          return (
            <div key={impact.area} className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="break-words font-semibold text-white">{impact.area}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{impact.description}</p>
                </div>
                <span className="shrink-0 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-300">
                  {impact.files.length} {impact.files.length === 1 ? "file" : "files"}
                </span>
              </div>

              <div className="mb-3">
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>Change weight</span>
                  <span>
                    <span className="text-emerald-300">+{impact.additions}</span>
                    <span className="mx-1">/</span>
                    <span className="text-red-300">-{impact.deletions}</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${share}%` }} />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Review focus</p>
                <p className="text-sm leading-6 text-slate-300">{impact.review_focus}</p>
              </div>

              {impact.flow.length > 0 && (
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Affected flow</p>
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-300">
                    {impact.flow.map((step, index) => (
                      <span key={step} className="flex min-w-0 items-center gap-2">
                        <span className="break-all rounded-lg border border-white/10 bg-slate-950/60 px-2 py-1 font-mono">
                          {step}
                        </span>
                        {index < impact.flow.length - 1 && <span className="text-slate-600">-&gt;</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {impact.signals.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {impact.signals.map((signal) => (
                    <span
                      key={signal}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-400"
                    >
                      {signal}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 space-y-1">
                {impact.files.slice(0, MAX_VISIBLE_FILES).map((file) => (
                  <p key={file} className="break-all font-mono text-xs leading-5 text-blue-300">
                    {file}
                  </p>
                ))}
                {hiddenFileCount > 0 && <p className="text-xs text-slate-500">+{hiddenFileCount} more files</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function percent(value: number, total: number) {
  if (total <= 0) return 0
  return Math.round((value / total) * 100)
}
