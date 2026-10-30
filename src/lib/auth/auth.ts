import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (supabase) {
    return supabase
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Configuração pública do Supabase não configurada.')
  }

  supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  return supabase
}

export async function getCurrentUser(accessToken: string) {
  if (!accessToken?.trim()) {
    throw new Error('Token de acesso não informado.')
  }

  const client = getSupabase()

  const {
    data: { user },
    error,
  } = await client.auth.getUser(accessToken)

  if (error || !user) {
    throw new Error(error?.message ?? 'Não foi possível validar a sessão.')
  }

  return user
}
