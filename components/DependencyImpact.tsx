interface Props {
  impact: string
}

export default function DependencyImpact({ impact }: Props) {
  if (!impact) return null

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">Dependency Impact</p>
      <p className="text-sm leading-6 text-gray-300">{impact}</p>
    </div>
  )
}
