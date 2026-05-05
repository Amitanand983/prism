import type { RiskAssessment } from "@/types"

interface Props {
  risk: RiskAssessment
}

const LEVEL_COLORS: Record<RiskAssessment["level"], { bg: string; border: string; text: string }> = {
  LOW: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400" },
  MEDIUM: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400" },
  HIGH: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
  CRITICAL: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
}

export default function RiskMeter({ risk }: Props) {
  const colors = LEVEL_COLORS[risk.level]

  return (
    <div className={`${colors.bg} ${colors.border} h-full rounded-2xl border p-6`}>
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-400">Risk Score</p>
      <div className="mb-1 flex items-baseline gap-2">
        <span className={`text-6xl font-bold ${colors.text}`}>{risk.score}</span>
        <span className="text-lg text-gray-500">/10</span>
      </div>
      <span className={`${colors.bg} ${colors.text} ${colors.border} mb-4 inline-block rounded-full border px-2 py-1 text-xs font-semibold`}>
        {risk.level}
      </span>
      <p className="text-sm leading-6 text-gray-300">{risk.reason}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-700 pt-4 text-xs text-gray-500">
        <div>
          Heuristic: <span className="font-medium text-gray-300">{risk.heuristic_score}/10</span>
        </div>
        <div>
          LLM: <span className="font-medium text-gray-300">{risk.llm_score}/10</span>
        </div>
      </div>
    </div>
  )
}
