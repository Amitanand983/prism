interface Props {
  message: string
}

export default function ErrorState({ message }: Props) {
  return (
    <div className="mt-10 rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-center shadow-2xl shadow-red-950/20 backdrop-blur-xl">
      <p className="mb-1 font-semibold text-red-200">Analysis Failed</p>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  )
}
