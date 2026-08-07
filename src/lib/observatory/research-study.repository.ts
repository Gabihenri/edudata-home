import type { SupabaseClient } from '@supabase/supabase-js'

const TABLE = 'observatory_research_studies'

function required(value: string | null | undefined, field: string): string {
  const normalized = value?.trim()
  if (!normalized) throw new Error(`${field} é obrigatório.`)
  return normalized
}

export async function listResearchStudies({
  client,
  userId,
}: {
  client: SupabaseClient
  userId: string
}) {
  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .eq('user_id', required(userId, 'userId'))
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(`Não foi possível carregar os estudos: ${error.message}`)
  return data ?? []
}

export async function insertResearchStudy({
  client,
  userId,
  input,
}: {
  client: SupabaseClient
  userId: string
  input: Record<string, unknown>
}) {
  const normalizedUserId = required(userId, 'userId')
  const { data, error } = await client
    .from(TABLE)
    .insert({
      ...input,
      id: `observatory-study:${crypto.randomUUID()}`,
      contract_version: 'observatory-study-v1',
      user_id: normalizedUserId,
      author_user_id: normalizedUserId,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Não foi possível registrar o estudo: ${error.message}`)
  return data
}
