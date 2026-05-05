interface Props {
  impact: string
}

export default function DependencyImpact({ impact }: Props) {
  if (!impact) return null

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Dependency Impact</p>
      <p className="text-sm leading-7 text-slate-300">{impact}</p>
    </div>
  )
}
