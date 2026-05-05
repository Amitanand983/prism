interface Props {
  message: string
}

export default function ErrorState({ message }: Props) {
  return (
    <div className="mt-10 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
      <p className="mb-1 font-medium text-red-400">Analysis Failed</p>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  )
}
