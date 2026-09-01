import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import {
  getCurrentUserRole,
  getSessionUser,
} from '@/lib/auth'
import { EvidencesRepository } from '@/lib/agenda/repository/evidences.repository'
import {
  createSignedUrl,
  STORAGE_BUCKETS,
} from '@/lib/storage'

const SIGNED_URL_EXPIRATION_SECONDS = 120

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type EvidenceFileRouteContext = {
  params: {
    id: string
  }
}

function jsonError(
  error: string,
  status: number,
  code: string,
) {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
    },
    {
      status,
    },
  )
}

function getAccessToken(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie')

  if (!cookieHeader) {
    return null
  }

  const cookies = cookieHeader.split(';').reduce<Record<string, string>>(
    (accumulator, cookie) => {
      const separatorIndex = cookie.indexOf('=')
      if (separatorIndex === -1) return accumulator

      const name = cookie.slice(0, separatorIndex).trim()
      const value = cookie.slice(separatorIndex + 1).trim()

      if (name) accumulator[name] = decodeURIComponent(value)
      return accumulator
    },
    {},
  )

  return cookies['sb-access-token'] ?? cookies.access_token ?? null
}

function createAuthenticatedClient(accessToken: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Variáveis públicas do Supabase não configuradas.',
    )
  }

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

export async function GET(
  request: Request,
  { params }: EvidenceFileRouteContext,
) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return jsonError(
        'Usuário não autenticado.',
        401,
        'AUTH_REQUIRED',
      )
    }

    const evidenceId = params.id?.trim()

    if (!evidenceId || !UUID_PATTERN.test(evidenceId)) {
      return jsonError(
        'Identificador da evidência inválido.',
        400,
        'INVALID_EVIDENCE_ID',
      )
    }

    const accessToken = getAccessToken(request)

    if (!accessToken) {
      return jsonError(
        'Token de acesso não encontrado.',
        401,
        'AUTH_TOKEN_REQUIRED',
      )
    }

    const client = createAuthenticatedClient(accessToken)
    const repository = new EvidencesRepository(client)
    const evidence = await repository.findById(evidenceId)

    if (!evidence) {
      return jsonError(
        'Evidência não encontrada.',
        404,
        'EVIDENCE_NOT_FOUND',
      )
    }

    const currentRole = await getCurrentUserRole()
    const isOwner = evidence.user_id === user.id
    const isSuperAdmin = currentRole === 'super_admin'

    if (!isOwner && !isSuperAdmin) {
      return jsonError(
        'Você não possui permissão para acessar este arquivo.',
        403,
        'EVIDENCE_FILE_ACCESS_DENIED',
      )
    }

    const storageBucket = evidence.storage_bucket?.trim()
    const storagePath = evidence.storage_path?.trim()

    if (!storageBucket || !storagePath) {
      return jsonError(
        'Esta evidência não possui arquivo protegido associado.',
        404,
        'PROTECTED_FILE_NOT_FOUND',
      )
    }

    if (storageBucket !== STORAGE_BUCKETS.EVIDENCES) {
      return jsonError(
        'O arquivo da evidência possui uma referência de armazenamento inválida.',
        409,
        'INVALID_STORAGE_BUCKET',
      )
    }

    const evidenceOwnerId = evidence.user_id?.trim()

    if (
      !evidenceOwnerId ||
      !storagePath.startsWith(`${evidenceOwnerId}/`)
    ) {
      return jsonError(
        'O arquivo da evidência possui um caminho de armazenamento inválido.',
        409,
        'INVALID_STORAGE_PATH',
      )
    }

    const result = await createSignedUrl({
      bucket: STORAGE_BUCKETS.EVIDENCES,
      path: storagePath,
      expiresIn: SIGNED_URL_EXPIRATION_SECONDS,
    })

    return NextResponse.json({
      success: true,
      data: {
        signedUrl: result.signedUrl,
        expiresIn: result.expiresIn,
        evidenceId: evidence.id,
        fileName: evidence.original_file_name,
        mimeType: evidence.file_mime_type,
      },
    })
  } catch (error) {
    console.error(
      'Erro ao gerar URL assinada da evidência:',
      error,
    )

    return jsonError(
      'Não foi possível gerar o acesso temporário ao arquivo.',
      500,
      'SIGNED_URL_GENERATION_FAILED',
    )
  }
}