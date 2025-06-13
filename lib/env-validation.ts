// Environment variable validation utility

/**
 * Validates required environment variables and returns their status
 */
export function validateEnvironment(): {
  isValid: boolean
  supabase: {
    isConfigured: boolean
    url: string | null
    anonKey: string | null
    serviceKey: string | null
  }
  groq: {
    isConfigured: boolean
    apiKey: string | null
  }
  missingVariables: string[]
} {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const groqApiKey = process.env.GROQ_API_KEY

  const missingVariables: string[] = []

  if (!supabaseUrl) missingVariables.push("NEXT_PUBLIC_SUPABASE_URL")
  if (!supabaseAnonKey) missingVariables.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  if (!supabaseServiceKey) missingVariables.push("SUPABASE_SERVICE_ROLE_KEY")
  if (!groqApiKey) missingVariables.push("GROQ_API_KEY")

  const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey)
  const groqConfigured = !!groqApiKey

  return {
    isValid: supabaseConfigured && groqConfigured,
    supabase: {
      isConfigured: supabaseConfigured,
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceKey: supabaseServiceKey,
    },
    groq: {
      isConfigured: groqConfigured,
      apiKey: groqApiKey,
    },
    missingVariables,
  }
}

/**
 * Gets a descriptive message about the environment configuration status
 */
export function getEnvironmentStatusMessage(): string {
  const { isValid, missingVariables } = validateEnvironment()

  if (isValid) {
    return "✅ Environment is properly configured"
  }

  return `⚠️ Missing environment variables: ${missingVariables.join(", ")}`
}

/**
 * Checks if the application can run in demo mode with limited functionality
 */
export function canRunInDemoMode(): boolean {
  // App can run in demo mode if at least the frontend Supabase variables are set
  const { supabase } = validateEnvironment()
  return supabase.isConfigured
}
