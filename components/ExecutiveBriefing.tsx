import type { PRAnalysisReport } from "@/types"

interface Props {
  report: PRAnalysisReport
}

const RISK_ACCENT: Record<PRAnalysisReport["risk"]["level"], string> = {
  LOW: "from-emerald-500/20 to-emerald-400/5 text-emerald-200 border-emerald-400/20",
  MEDIUM: "from-yellow-500/20 to-yellow-400/5 text-yellow-200 border-yellow-400/20",
  HIGH: "from-orange-500/20 to-orange-400/5 text-orange-200 border-orange-400/20",
  CRITICAL: "from-red-500/20 to-red-400/5 text-red-200 border-red-400/20",
}

export default function ExecutiveBriefing({ report }: Props) {
  const topImpact = report.impact_map[0]
  const firstStep = report.review_strategy[0]
  const topCriticalFile = report.critical_files[0]

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">Executive briefing</p>
          <h3 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {report.risk.level === "CRITICAL" || report.risk.level === "HIGH"
              ? "Review this PR with focused attention."
              : "This PR is ready for a structured review."}
          </h3>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">{report.summary}</p>
        </div>

        <div
          className={`min-w-40 rounded-3xl border bg-gradient-to-br p-5 text-center ${RISK_ACCENT[report.risk.level]}`}
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-80">Risk</p>
          <div className="mt-2 text-6xl font-black tracking-tighter">{report.risk.score}</div>
          <p className="text-sm font-bold">/10 {report.risk.level}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <BriefingStat label="Primary Impact" value={topImpact?.area ?? "Core review"} detail={topImpact?.review_focus} />
        <BriefingStat
          label="Start Here"
          value={firstStep?.action ?? "Review changed files"}
          detail={firstStep ? `${firstStep.target}: ${firstStep.reason}` : "Use the impact map to prioritize review order."}
        />
        <BriefingStat
          label="Watch File"
          value={topCriticalFile?.file ?? `${report.meta.files_changed} changed files`}
          detail={topCriticalFile?.reason ?? "No single critical file was isolated by the analysis."}
          mono
        />
      </div>
    </section>
  )
}

function BriefingStat({
  label,
  value,
  detail,
  mono = false,
}: {
  label: string
  value: string
  detail?: string
  mono?: boolean
}) {
  return (
    <div className="min-w-0 rounded-3xl border border-white/10 bg-slate-950/45 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={`mt-2 line-clamp-2 text-sm font-bold text-white ${mono ? "break-all font-mono" : ""}`}>
        {value}
      </p>
      {detail && <p className="mt-2 line-clamp-3 break-words text-xs leading-5 text-slate-400">{detail}</p>}
    </div>
  )
}
