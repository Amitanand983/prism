import { NextRequest, NextResponse } from "next/server"
import { verifyLoginOtp } from "@/lib/auth"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: unknown; otp?: unknown }
    const email = typeof body.email === "string" ? body.email.trim() : ""
    const otp = typeof body.otp === "string" ? body.otp.trim() : ""

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and login code are required." }, { status: 400 })
    }

    const user = await verifyLoginOtp(email, otp)

    return NextResponse.json({ user })
  } catch (error: unknown) {
    console.error("verify otp error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not verify login code." },
      { status: 400 },
    )
  }
}
