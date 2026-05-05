import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createAdminSupabaseClient } from "@/lib/supabase"

export const runtime = "nodejs"

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Sign in to view analysis history." }, { status: 401 })
  }

  const { data, error } = await createAdminSupabaseClient()
    .from("pr_analyses")
    .select("id, created_at, pr_url, pr_title, risk_level, risk_score, report")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(25)

  if (error) {
    console.error("history error:", error)

    if (error.code === "42P01" || error.code === "PGRST205") {
      return NextResponse.json(
        { error: "History table is not ready. Run supabase/schema.sql in the Supabase SQL Editor." },
        { status: 500 },
      )
    }

    return NextResponse.json({ error: "Could not load analysis history." }, { status: 500 })
  }

  return NextResponse.json({ history: data })
}
