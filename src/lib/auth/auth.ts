import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (supabase) {
    return supabase
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Variáveis do Supabase não configuradas.')
  }

  supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return supabase
}

export async function getCurrentUser(accessToken: string) {
  const client = getSupabase()

  const {
    data: { user },
    error,
  } = await client.auth.getUser(accessToken)

  if (error) {
    throw new Error(error.message)
  }

  return user
}