import type { RiskExplanation } from "@/types"

interface Props {
  explanations?: RiskExplanation[]
}

const SEVERITY_STYLE: Record<RiskExplanation["severity"], string> = {
  LOW: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  MEDIUM: "border-yellow-400/20 bg-yellow-500/10 text-yellow-200",
  HIGH: "border-orange-400/20 bg-orange-500/10 text-orange-200",
  CRITICAL: "border-red-400/20 bg-red-500/10 text-red-200",
}

export default function WhyThisMatters({ explanations = [] }: Props) {
  if (!explanations.length) return null

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Reviewer education</p>
        <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Why this matters</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Practical explanations that help reviewers understand the risk, not just see a score.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {explanations.map((item) => (
          <article key={`${item.subject}-${item.file ?? item.severity}`} className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <div className="mb-3 flex flex-wrap items-start gap-2">
              <span className={`rounded-full border px-2 py-1 text-xs font-bold ${SEVERITY_STYLE[item.severity]}`}>
                {item.severity}
              </span>
              <div className="min-w-0">
                <h4 className="break-words text-sm font-bold text-white">{item.subject}</h4>
                {item.file && <p className="mt-1 break-all font-mono text-xs text-blue-300">{item.file}</p>}
              </div>
            </div>
            <p className="text-sm leading-6 text-slate-300">{item.why_this_matters}</p>
            <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-xs leading-5 text-slate-400">
              <span className="font-bold text-slate-200">Reviewer action:</span> {item.reviewer_guidance}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
