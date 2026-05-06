import type { RepoContext, RepoContextFile } from "@/types"

interface Props {
  context?: RepoContext
}

export default function RepoContextPanel({ context }: Props) {
  if (!context) return null

  const groups: Array<{ title: string; files: RepoContextFile[] }> = [
    { title: "Manifests", files: context.manifests },
    { title: "Docs", files: context.docs },
    { title: "Nearby files", files: context.nearby_files },
    { title: "Related tests", files: context.related_tests },
    { title: "Similar files", files: context.similar_files },
  ].filter((group) => group.files.length > 0)

  if (!groups.length && !context.imports.length && !context.notes.length) return null

  const previewFiles = [
    ...context.related_tests.map((file) => ({ ...file, group: "Test" })),
    ...context.manifests.map((file) => ({ ...file, group: "Manifest" })),
    ...context.nearby_files.map((file) => ({ ...file, group: "Nearby" })),
    ...context.similar_files.map((file) => ({ ...file, group: "Similar" })),
    ...context.docs.map((file) => ({ ...file, group: "Doc" })),
  ].slice(0, 5)
  const totalFiles = groups.reduce((sum, group) => sum + group.files.length, 0)

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Repo Context Lite</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-white">Context evidence snapshot</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Small sample of repo evidence used by PRISM. Full snippets stay hidden to keep the report focused.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 text-xs">
          <Metric label="files" value={totalFiles} />
          <Metric label="imports" value={context.imports.length} />
          <Metric label="notes" value={context.notes.length} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.55fr)]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Representative files</p>
          {previewFiles.length > 0 ? (
            <div className="space-y-2">
              {previewFiles.map((file) => (
                <div key={`${file.group}-${file.path}`} className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {file.group}
                  </span>
                  <span className="truncate font-mono text-xs text-blue-300">{file.path}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs leading-5 text-slate-500">No representative files were captured.</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Signals</p>
          <div className="space-y-2">
            {context.imports.slice(0, 4).map((item) => (
              <p key={item} className="truncate font-mono text-xs text-slate-300">
                {item}
              </p>
            ))}
            {context.notes.slice(0, 2).map((note) => (
              <p key={note} className="line-clamp-2 text-xs leading-5 text-slate-400">
                {note}
              </p>
            ))}
            {context.imports.length === 0 && context.notes.length === 0 && (
              <p className="text-xs leading-5 text-slate-500">No import or note signals were captured.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full border border-white/10 bg-slate-950/45 px-2.5 py-1 text-slate-300">
      <span className="font-bold text-white">{value}</span> {label}
    </span>
  )
}
