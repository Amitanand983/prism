import { createClient } from "@supabase/supabase-js"
import type { PRAnalysisReport } from "@/types"

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface AnalysisHistoryItem {
  id: string
  created_at: string
  pr_url: string
  pr_title: string
  risk_level: PRAnalysisReport["risk"]["level"]
  risk_score: number
  report: PRAnalysisReport
}

export interface AuthUser {
  id: string
  email: string
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_otps: {
        Row: {
          id: string
          email: string
          otp_hash: string
          expires_at: string
          consumed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          otp_hash: string
          expires_at: string
          consumed_at?: string | null
          created_at?: string
        }
        Update: {
          consumed_at?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_hash: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_hash: string
          expires_at: string
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      pr_analyses: {
        Row: {
          id: string
          user_id: string
          created_at: string
          pr_url: string
          pr_title: string
          risk_level: PRAnalysisReport["risk"]["level"]
          risk_score: number
          report: Json
        }
        Insert: {
          user_id: string
          pr_url: string
          pr_title: string
          risk_level: PRAnalysisReport["risk"]["level"]
          risk_score: number
          report: Json
        }
        Update: {
          user_id?: string
          pr_url?: string
          pr_title?: string
          risk_level?: PRAnalysisReport["risk"]["level"]
          risk_score?: number
          report?: Json
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

function requiredEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`${name} is required. Add it to your environment variables.`)
  }

  return value
}

function normalizeSupabaseUrl(value: string) {
  const url = new URL(value.trim())
  url.pathname = ""
  url.search = ""
  url.hash = ""

  return url.toString().replace(/\/$/, "")
}

export function getSupabaseConfigError() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return "NEXT_PUBLIC_SUPABASE_URL is missing."
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return "SUPABASE_SERVICE_ROLE_KEY is missing."

  return null
}

function getSupabaseUrl() {
  return normalizeSupabaseUrl(requiredEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL))
}

export function createAdminSupabaseClient() {
  return createClient<Database>(
    getSupabaseUrl(),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}
