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

function buildOtpEmail(otp: string) {
  const subject = "Your PRISM login code"
  const text = [
    `Your PRISM login code is ${otp}.`,
    "",
    `This code expires in ${OTP_TTL_MINUTES} minutes.`,
    "Use it to sign in to PRISM (PR Intelligence System Mechanism) and continue your PR analysis workflow.",
    "",
    "If you did not request this code, you can safely ignore this email.",
  ].join("\n")
  const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${subject}</title>
  </head>
  <body style="margin:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#e2e8f0;">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;">
      Your PRISM (PR Intelligence System Mechanism) login code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#020617;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border:1px solid rgba(148,163,184,0.18);border-radius:28px;background:linear-gradient(145deg,#0f172a 0%,#020617 100%);overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.35);">
            <tr>
              <td style="padding:28px 28px 0 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <div style="display:inline-block;border:1px solid rgba(96,165,250,0.28);border-radius:16px;background:rgba(59,130,246,0.12);padding:10px 12px;color:#bfdbfe;font-weight:800;font-size:14px;letter-spacing:0.08em;">
                        PRISM
                      </div>
                      <div style="margin-top:8px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;">
                        PR Intelligence System Mechanism
                      </div>
                    </td>
                    <td align="right" style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.16em;">
                      Secure sign in
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 28px 8px 28px;">
                <h1 style="margin:0;color:#f8fafc;font-size:30px;line-height:1.15;font-weight:800;letter-spacing:-0.03em;">
                  Your login code is ready
                </h1>
                <p style="margin:14px 0 0 0;color:#94a3b8;font-size:15px;line-height:1.7;">
                  Enter this one-time code in PRISM (PR Intelligence System Mechanism) to access your saved PR analysis history and continue reviewing pull requests.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px;">
                <div style="border:1px solid rgba(96,165,250,0.26);border-radius:22px;background:rgba(15,23,42,0.88);padding:24px;text-align:center;">
                  <p style="margin:0 0 10px 0;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;">
                    One-time code
                  </p>
                  <div style="font-size:42px;line-height:1;font-weight:900;letter-spacing:0.18em;color:#dbeafe;">
                    ${otp}
                  </div>
                  <p style="margin:14px 0 0 0;color:#94a3b8;font-size:13px;">
                    Expires in <strong style="color:#e2e8f0;">${OTP_TTL_MINUTES} minutes</strong>
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px 28px;">
                <div style="border-radius:18px;background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.18);padding:14px 16px;">
                  <p style="margin:0;color:#fde68a;font-size:13px;line-height:1.6;">
                    If you did not request this email, you can ignore it. Never share this code with anyone.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid rgba(148,163,184,0.12);padding:18px 28px 24px 28px;color:#64748b;font-size:12px;line-height:1.6;">
                Sent by PRISM (PR Intelligence System Mechanism), your AI-powered code review briefing workspace.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { subject, text, html }
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

  const emailContent = buildOtpEmail(otp)

  await transporter.sendMail({
    from: requiredEnv("SMTP_FROM", process.env.SMTP_FROM),
    to: normalizedEmail,
    ...emailContent,
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
