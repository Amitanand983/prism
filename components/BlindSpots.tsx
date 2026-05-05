interface Props {
  spots: string[]
}

export default function BlindSpots({ spots }: Props) {
  if (!spots.length) return null

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-400">Reviewer Blind Spots</p>
      <ul className="space-y-2">
        {spots.map((spot) => (
          <li key={spot} className="flex gap-3 text-sm leading-6 text-gray-300">
            <span className="mt-0.5 flex-shrink-0 text-orange-400">-</span>
            {spot}
          </li>
        ))}
      </ul>
    </div>
  )
}
