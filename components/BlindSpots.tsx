interface Props {
  spots: string[]
}

export default function BlindSpots({ spots }: Props) {
  if (!spots.length) return null

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Reviewer Blind Spots</p>
      <ul className="space-y-2">
        {spots.map((spot) => (
          <li key={spot} className="flex min-w-0 gap-3 rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-sm leading-6 text-slate-300">
            <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-orange-300 shadow-[0_0_12px_rgba(253,186,116,0.6)]" />
            <span className="min-w-0 break-words">{spot}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
