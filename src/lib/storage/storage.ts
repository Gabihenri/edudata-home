import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let storageClient: SupabaseClient | null = null

export const STORAGE_BUCKETS = {
  EVIDENCES: 'agenda-evidences',
  DOCUMENTS: 'documents',
  ACADEMY: 'academy-files',
} as const

export type StorageBucket =
  (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS]

export function getStorageClient(): SupabaseClient {
  if (storageClient) {
    return storageClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Variáveis do Supabase Storage não configuradas.',
    )
  }

  storageClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  return storageClient
}

export function sanitizeStorageFileName(fileName: string): string {
  const normalizedName = fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

  return normalizedName || 'arquivo'
}

export function createStoragePath({
  userId,
  folder,
  fileName,
}: {
  userId: string
  folder: string
  fileName: string
}): string {
  const safeUserId = userId.trim()
  const safeFolder = folder
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9/_-]/g, '-')
  const safeFileName = sanitizeStorageFileName(fileName)
  const uniquePrefix = `${Date.now()}-${crypto.randomUUID()}`

  if (!safeUserId) {
    throw new Error('ID do usuário é obrigatório.')
  }

  return `${safeUserId}/${safeFolder}/${uniquePrefix}-${safeFileName}`
}