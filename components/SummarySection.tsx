interface Props {
  summary: string
}

export default function SummarySection({ summary }: Props) {
  return (
    <div className="h-full rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Semantic Summary</p>
      <p className="break-words text-base leading-8 text-slate-200">{summary}</p>
    </div>
  )
}
