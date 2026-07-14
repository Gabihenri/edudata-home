import { NextResponse } from 'next/server'

import {
  getCurrentUserRole,
  getSessionUser,
} from '@/lib/auth'
import { evidencesRepository } from '@/lib/agenda/repository'
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

export async function GET(
  _request: Request,
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

    const evidence =
      await evidencesRepository.findById(evidenceId)

    if (!evidence) {
      return jsonError(
        'Evidência não encontrada.',
        404,
        'EVIDENCE_NOT_FOUND',
      )
    }

    const currentRole =
      await getCurrentUserRole()

    const isOwner =
      evidence.user_id === user.id

    const isSuperAdmin =
      currentRole === 'super_admin'

    if (!isOwner && !isSuperAdmin) {
      return jsonError(
        'Você não possui permissão para acessar este arquivo.',
        403,
        'EVIDENCE_FILE_ACCESS_DENIED',
      )
    }

    const storageBucket =
      evidence.storage_bucket?.trim()

    const storagePath =
      evidence.storage_path?.trim()

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

    const evidenceOwnerId =
      evidence.user_id?.trim()

    if (
      !evidenceOwnerId ||
      !storagePath.startsWith(
        `${evidenceOwnerId}/`,
      )
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
      expiresIn:
        SIGNED_URL_EXPIRATION_SECONDS,
    })

    return NextResponse.json({
      success: true,
      data: {
        signedUrl: result.signedUrl,
        expiresIn: result.expiresIn,
        evidenceId: evidence.id,
        fileName:
          evidence.original_file_name,
        mimeType:
          evidence.file_mime_type,
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