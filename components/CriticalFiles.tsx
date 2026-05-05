import type { CriticalFile } from "@/types"

interface Props {
  files: CriticalFile[]
}

const RISK_COLORS: Record<CriticalFile["risk_contribution"], string> = {
  HIGH: "border-red-500/30 bg-red-500/10 text-red-300",
  MEDIUM: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  LOW: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
}

export default function CriticalFiles({ files }: Props) {
  if (!files.length) return null

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Critical Files</p>
      <div className="space-y-3">
        {files.map((file) => (
          <div key={`${file.file}-${file.reason}`} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <span className={`flex-shrink-0 rounded-full border px-2 py-1 text-xs font-bold ${RISK_COLORS[file.risk_contribution]}`}>
              {file.risk_contribution}
            </span>
            <div>
              <p className="font-mono text-sm text-blue-300">{file.file}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{file.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
