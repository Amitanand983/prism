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
      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-300">Signed in</p>
            <p className="mt-1 text-sm text-gray-300">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={loading}
            className="rounded-xl border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sign out
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-green-400">{message}</p>}
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-300">Email OTP sign in</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Save your PR analysis history</h2>
        <p className="mt-1 text-sm text-gray-400">Enter your email and verify the OTP before analyzing a PR.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder:text-gray-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="button"
          onClick={sendOtp}
          disabled={loading || !email.trim()}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-700"
        >
          {otpSent ? "Resend OTP" : "Send OTP"}
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
            className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder:text-gray-500 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="button"
            onClick={verifyOtp}
            disabled={loading || !otp.trim()}
            className="rounded-xl bg-green-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-gray-700"
          >
            Verify
          </button>
        </div>
      )}

      {message && <p className="mt-3 text-sm text-green-400">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </section>
  )
}
