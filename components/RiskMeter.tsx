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
    <div className={`${colors.bg} ${colors.border} h-full rounded-3xl border p-6 shadow-2xl shadow-black/25 backdrop-blur-xl`}>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Evaluated PR Risk</p>
      <div className="mb-1 flex items-baseline gap-2">
        <span className={`text-7xl font-black tracking-tighter ${colors.text}`}>{risk.score}</span>
        <span className="text-lg text-slate-500">/10</span>
      </div>
      <span className={`${colors.bg} ${colors.text} ${colors.border} mb-4 inline-block rounded-full border px-3 py-1 text-xs font-bold`}>
        {risk.level} after analysis
      </span>
      <p className="text-sm leading-6 text-slate-300">{risk.reason}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-xs text-slate-500">
        <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
          Heuristic <span className="block pt-1 font-bold text-slate-200">{risk.heuristic_score}/10</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
          LLM <span className="block pt-1 font-bold text-slate-200">{risk.llm_score}/10</span>
        </div>
      </div>
    </div>
  )
}
