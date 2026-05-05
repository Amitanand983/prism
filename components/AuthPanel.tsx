"use client"

import { useState } from "react"
import type { AuthUser } from "@/lib/supabase"

interface Props {
  user: AuthUser | null
  onAuthChange: (user: AuthUser | null) => void
}

export default function AuthPanel({ user, onAuthChange }: Props) {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function sendOtp() {
    const trimmedEmail = email.trim()
    if (!trimmedEmail || loading) return

    setLoading(true)
    setError(null)
    setMessage(null)

    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmedEmail }),
    })
    const data = (await res.json()) as { error?: string }

    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? "Could not send login code.")
      return
    }

    setOtpSent(true)
    setMessage("Check your email for the OTP code.")
  }

  async function verifyOtp() {
    const trimmedEmail = email.trim()
    const trimmedOtp = otp.trim()
    if (!trimmedEmail || !trimmedOtp || loading) return

    setLoading(true)
    setError(null)
    setMessage(null)

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmedEmail, otp: trimmedOtp }),
    })
    const data = (await res.json()) as { user?: AuthUser; error?: string }

    setLoading(false)

    if (!res.ok || !data.user) {
      setError(data.error ?? "Could not verify login code.")
      return
    }

    setOtp("")
    setOtpSent(false)
    onAuthChange(data.user)
    setMessage("You're signed in.")
  }

  async function signOut() {
    setLoading(true)
    setError(null)
    setMessage(null)
    await fetch("/api/auth/logout", { method: "POST" })
    onAuthChange(null)
    setLoading(false)
  }

  if (user) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-sm font-bold text-emerald-200">
              {user.email.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Signed in</p>
              <p className="mt-1 text-sm text-slate-300">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={loading}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sign out
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-emerald-300">{message}</p>}
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </section>
    )
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Email OTP sign in</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Save every review briefing</h2>
          <p className="mt-2 text-sm text-slate-400">Use your email to unlock PR analysis and private history.</p>
        </div>
        <span className="w-fit rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
          No password needed
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-sm text-white shadow-inner shadow-black/20 outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 focus:ring-4 focus:ring-blue-500/10"
          disabled={loading}
        />
        <button
          type="button"
          onClick={sendOtp}
          disabled={loading || !email.trim()}
          className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/40 transition hover:scale-[1.01] hover:from-blue-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none"
        >
          {loading ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
        </button>
      </div>

      {otpSent && (
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") verifyOtp()
            }}
            placeholder="Enter OTP code"
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-sm tracking-[0.35em] text-white shadow-inner shadow-black/20 outline-none transition placeholder:tracking-normal placeholder:text-slate-600 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-500/10"
            disabled={loading}
          />
          <button
            type="button"
            onClick={verifyOtp}
            disabled={loading || !otp.trim()}
            className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/30 transition hover:scale-[1.01] hover:from-emerald-500 hover:to-teal-400 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </div>
      )}

      {message && (
        <p className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}
    </section>
  )
}
