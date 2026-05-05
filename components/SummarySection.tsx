interface Props {
  summary: string
}

export default function SummarySection({ summary }: Props) {
  return (
    <div className="h-full rounded-2xl border border-gray-800 bg-gray-900 p-6">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">Semantic Summary</p>
      <p className="text-base leading-7 text-gray-200">{summary}</p>
    </div>
  )
}
