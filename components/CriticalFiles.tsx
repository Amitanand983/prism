import type { CriticalFile } from "@/types"

interface Props {
  files: CriticalFile[]
}

const RISK_COLORS: Record<CriticalFile["risk_contribution"], string> = {
  HIGH: "border-red-500/30 bg-red-500/10 text-red-400",
  MEDIUM: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  LOW: "border-green-500/30 bg-green-500/10 text-green-400",
}

export default function CriticalFiles({ files }: Props) {
  if (!files.length) return null

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-400">Critical Files</p>
      <div className="space-y-3">
        {files.map((file) => (
          <div key={`${file.file}-${file.reason}`} className="flex items-start gap-3">
            <span className={`flex-shrink-0 rounded border px-2 py-0.5 text-xs font-medium ${RISK_COLORS[file.risk_contribution]}`}>
              {file.risk_contribution}
            </span>
            <div>
              <p className="font-mono text-sm text-blue-300">{file.file}</p>
              <p className="mt-0.5 text-xs leading-5 text-gray-400">{file.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
