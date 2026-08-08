import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { requireSessionUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
}

type DocumentIdentity = {
  professionalTitle: string | null
  registrationLabel: string | null
  registrationValue: string | null
  city: string | null
  state: string | null
  addressLine: string | null
  footerText: string | null
  showEduDataBrand: boolean
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase não configurado para o EIOS Registry.')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function text(value: unknown, max = 240): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') throw new Error('Campo textual inválido.')
  const normalized = value.trim()
  if (!normalized) return null
  if (normalized.length > max) throw new Error(`Campo não pode ultrapassar ${max} caracteres.`)
  return normalized
}

function parseIdentity(value: unknown): DocumentIdentity {
  const record = typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}

  return {
    professionalTitle: text(record.professionalTitle),
    registrationLabel: text(record.registrationLabel, 80),
    registrationValue: text(record.registrationValue, 120),
    city: text(record.city, 120),
    state: text(record.state, 80),
    addressLine: text(record.addressLine, 300),
    footerText: text(record.footerText, 500),
    showEduDataBrand: record.showEduDataBrand !== false,
  }
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro desconhecido.'
  const normalized = message.toLowerCase()
  const status = normalized.includes('não autenticado')
    ? 401
    : normalized.includes('inválido') || normalized.includes('não pode')
      ? 400
      : 500

  return NextResponse.json(
    {
      success: false,
      error: status >= 500 ? 'Não foi possível processar a identidade documental.' : message,
    },
    { status, headers: NO_CACHE_HEADERS },
  )
}

export async function GET() {
  try {
    const user = await requireSessionUser()
    const client = createAdminClient()

    const { data, error } = await client
      .from('user_profiles')
      .select('display_name,phone,role,metadata')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw new Error(error.message)

    const metadata = data?.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)
      ? data.metadata as Record<string, unknown>
      : {}

    const identity = parseIdentity(metadata.document_identity)

    return NextResponse.json(
      {
        success: true,
        data: {
          mode: 'individual',
          displayName: data?.display_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'Professor',
          email: user.email ?? null,
          phone: data?.phone ?? null,
          role: data?.role ?? 'professor',
          identity,
        },
      },
      { status: 200, headers: NO_CACHE_HEADERS },
    )
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireSessionUser()
    const client = createAdminClient()
    const body = await request.json() as {
      displayName?: unknown
      phone?: unknown
      identity?: unknown
    }

    const { data: current, error: currentError } = await client
      .from('user_profiles')
      .select('metadata')
      .eq('user_id', user.id)
      .maybeSingle()

    if (currentError) throw new Error(currentError.message)

    const currentMetadata = current?.metadata && typeof current.metadata === 'object' && !Array.isArray(current.metadata)
      ? current.metadata as Record<string, unknown>
      : {}

    const nextIdentity = parseIdentity(body.identity)
    const displayName = text(body.displayName, 180)
    const phone = text(body.phone, 60)

    const { error } = await client
      .from('user_profiles')
      .update({
        display_name: displayName,
        phone,
        metadata: {
          ...currentMetadata,
          document_identity: nextIdentity,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (error) throw new Error(error.message)

    return NextResponse.json(
      {
        success: true,
        message: 'Identidade documental atualizada com sucesso.',
        data: {
          displayName,
          phone,
          identity: nextIdentity,
        },
      },
      { status: 200, headers: NO_CACHE_HEADERS },
    )
  } catch (error) {
    return errorResponse(error)
  }
}
