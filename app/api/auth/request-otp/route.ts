import { NextRequest, NextResponse } from "next/server"
import { sendLoginOtp } from "@/lib/auth"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: unknown }
    const email = typeof body.email === "string" ? body.email.trim() : ""

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }

    await sendLoginOtp(email)

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error("request otp error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send login code." },
      { status: 500 },
    )
  }
}
