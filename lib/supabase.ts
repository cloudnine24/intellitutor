import { createClient } from "@supabase/supabase-js"

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseAnonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

// Client for browser usage (with better error handling)
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
)

// Admin client for server-side operations (only if service key is available)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== "https://placeholder.supabase.co")
}

// Database types
export interface DatabaseFile {
  id: string
  name: string
  type: string
  size: number
  subject: string
  status: "processing" | "completed" | "error"
  progress: number
  extracted_text?: string
  tags: string[]
  storage_path?: string
  created_at: string
  updated_at: string
}

export interface DocumentChunk {
  id: string
  file_id: string
  chunk_text: string
  chunk_index: number
  embedding?: number[]
  metadata: Record<string, any>
  created_at: string
}

export interface AnalysisResult {
  id: string
  file_id: string
  action_type: "quiz" | "flashcards" | "chat"
  model_used: string
  analysis_text: string
  created_at: string
}
