import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import nodemailer from "nodemailer"
import { createAdminSupabaseClient, type AuthUser } from "@/lib/supabase"

const SESSION_COOKIE = "prism_session"
const OTP_TTL_MINUTES = 10
const SESSION_TTL_DAYS = 30

function requiredEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`${name} is required. Add it to your environment variables.`)
  }

  return value
}

function authSecret() {
  return requiredEnv("AUTH_SESSION_SECRET", process.env.AUTH_SESSION_SECRET)
}

function hashValue(value: string) {
  return createHash("sha256").update(`${authSecret()}:${value}`).digest("hex")
}

function isSecureSmtp() {
  return (process.env.SMTP_SECURE ?? "true").toLowerCase() !== "false"
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function isSameHash(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)

  return left.length === right.length && timingSafeEqual(left, right)
}

export function getSessionCookieName() {
  return SESSION_COOKIE
}

export async function sendLoginOtp(email: string) {
  const normalizedEmail = normalizeEmail(email)
  const otp = randomInt(100000, 1000000).toString()
  const supabase = createAdminSupabaseClient()
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString()

  const { error: insertError } = await supabase.from("email_otps").insert({
    email: normalizedEmail,
    otp_hash: hashValue(otp),
    expires_at: expiresAt,
  })

  if (insertError) {
    console.error("otp insert error:", insertError)
    throw new Error("Could not create login code.")
  }

  const transporter = nodemailer.createTransport({
    host: requiredEnv("SMTP_HOST", process.env.SMTP_HOST),
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: isSecureSmtp(),
    auth: {
      user: requiredEnv("SMTP_USER", process.env.SMTP_USER),
      pass: requiredEnv("SMTP_PASSWORD", process.env.SMTP_PASSWORD),
    },
  })

  await transporter.sendMail({
    from: requiredEnv("SMTP_FROM", process.env.SMTP_FROM),
    to: normalizedEmail,
    subject: "Your PRISM login code",
    text: `Your PRISM login code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    html: `<p>Your PRISM login code is <strong>${otp}</strong>.</p><p>It expires in ${OTP_TTL_MINUTES} minutes.</p>`,
  })
}

export async function verifyLoginOtp(email: string, otp: string) {
  const normalizedEmail = normalizeEmail(email)
  const trimmedOtp = otp.trim()

  if (!/^\d{6}$/.test(trimmedOtp)) {
    throw new Error("Enter the 6-digit login code.")
  }

  const supabase = createAdminSupabaseClient()
  const { data: otpRows, error: otpError } = await supabase
    .from("email_otps")
    .select("id, otp_hash, expires_at")
    .eq("email", normalizedEmail)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)

  if (otpError) {
    console.error("otp lookup error:", otpError)
    throw new Error("Could not verify login code.")
  }

  const latestOtp = otpRows?.[0]
  if (!latestOtp || new Date(latestOtp.expires_at).getTime() < Date.now()) {
    throw new Error("Login code has expired. Request a new one.")
  }

  if (!isSameHash(latestOtp.otp_hash, hashValue(trimmedOtp))) {
    throw new Error("Invalid login code.")
  }

  const { data: existingUser, error: userLookupError } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", normalizedEmail)
    .maybeSingle()

  if (userLookupError) {
    console.error("user lookup error:", userLookupError)
    throw new Error("Could not sign you in.")
  }

  const user =
    existingUser ??
    (
      await supabase
        .from("users")
        .insert({ email: normalizedEmail })
        .select("id, email")
        .single()
    ).data

  if (!user) {
    throw new Error("Could not create user account.")
  }

  await supabase.from("email_otps").update({ consumed_at: new Date().toISOString() }).eq("id", latestOtp.id)

  const sessionToken = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)

  const { error: sessionError } = await supabase.from("user_sessions").insert({
    user_id: user.id,
    session_hash: hashValue(sessionToken),
    expires_at: expiresAt.toISOString(),
  })

  if (sessionError) {
    console.error("session insert error:", sessionError)
    throw new Error("Could not create login session.")
  }

  ;(await cookies()).set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  })

  return user satisfies AuthUser
}

export async function getCurrentUser() {
  const sessionToken = (await cookies()).get(SESSION_COOKIE)?.value
  if (!sessionToken) return null

  const supabase = createAdminSupabaseClient()
  const { data: session, error: sessionError } = await supabase
    .from("user_sessions")
    .select("user_id, expires_at")
    .eq("session_hash", hashValue(sessionToken))
    .maybeSingle()

  if (sessionError || !session || new Date(session.expires_at).getTime() < Date.now()) {
    return null
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email")
    .eq("id", session.user_id)
    .maybeSingle()

  if (userError || !user) {
    return null
  }

  return user
}

export async function clearCurrentSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value

  if (sessionToken) {
    await createAdminSupabaseClient().from("user_sessions").delete().eq("session_hash", hashValue(sessionToken))
  }

  cookieStore.delete(SESSION_COOKIE)
}
