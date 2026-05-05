import type { ReviewStep } from "@/types"

interface Props {
  steps: ReviewStep[]
}

export default function ReviewStrategy({ steps }: Props) {
  if (!steps.length) return null

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-400">Review Strategy</p>
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={`${step.step}-${step.target}`} className="flex gap-4">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-blue-600/30 bg-blue-600/20 text-xs font-bold text-blue-400">
              {step.step}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{step.action}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                <span className="font-mono text-blue-400">{step.target}</span>: {step.reason}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
