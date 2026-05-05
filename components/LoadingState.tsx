export default function LoadingState() {
  return (
    <div className="mt-10 space-y-6 animate-pulse">
      <div className="h-24 rounded-3xl border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/20 backdrop-blur-xl" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="h-48 rounded-3xl border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/20 backdrop-blur-xl" />
        <div className="h-48 rounded-3xl border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/20 backdrop-blur-xl md:col-span-2" />
      </div>
      <div className="h-36 rounded-3xl border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/20 backdrop-blur-xl" />
      <div className="h-36 rounded-3xl border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/20 backdrop-blur-xl" />
      <p className="pt-2 text-center text-sm text-slate-400">Analyzing PR with AI...</p>
    </div>
  )
}
