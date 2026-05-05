import type { ReviewStep } from "@/types"

interface Props {
  steps: ReviewStep[]
}

export default function ReviewStrategy({ steps }: Props) {
  if (!steps.length) return null

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Review Strategy</p>
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={`${step.step}-${step.target}`} className="flex gap-4 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/20 text-xs font-bold text-blue-200">
              {step.step}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{step.action}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                <span className="font-mono text-blue-300">{step.target}</span>: {step.reason}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
