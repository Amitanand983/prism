export default function LoadingState() {
  return (
    <div className="mt-10 space-y-6 animate-pulse">
      <div className="h-24 rounded-2xl border border-gray-800 bg-gray-900" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="h-48 rounded-2xl border border-gray-800 bg-gray-900" />
        <div className="h-48 rounded-2xl border border-gray-800 bg-gray-900 md:col-span-2" />
      </div>
      <div className="h-36 rounded-2xl border border-gray-800 bg-gray-900" />
      <div className="h-36 rounded-2xl border border-gray-800 bg-gray-900" />
      <p className="pt-2 text-center text-sm text-gray-500">Analyzing PR with AI...</p>
    </div>
  )
}
