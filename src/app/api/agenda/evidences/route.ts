import { NextResponse } from 'next/server'

import {
  isAccessDeniedError,
  requireFeatureAccess,
  serializeAccessDeniedError,
} from '@/lib/access/guards/require-feature-access'
import { requireSessionUser } from '@/lib/auth/session'
import type {
  AgendaEvidenceType,
  CreateAgendaEvidenceInput,
} from '@/lib/agenda/repository/evidences.repository'
import { evidencesService } from '@/lib/agenda/services/evidences.service'

export const dynamic = 'force-dynamic'

type CreateEvidenceRequestBody = {
  title?: string
  description?: string | null

  evidenceType?: string

  fileUrl?: string | null
  externalUrl?: string | null

  planningId?: string | null
  eventId?: string | null
  schoolId?: string | null

  containsIdentifiableMinor?: boolean

  guardianAuthorizationConfirmed?: boolean
  authorizationReference?: string | null

  privacyNoticeVersion?: string | null

  storageBucket?: string | null
  storagePath?: string | null

  originalFileName?: string | null
  fileMimeType?: string | null
  fileSizeBytes?: number | null
}

function normalizeOptionalText(
  value: unknown,
): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value.trim()

  return normalizedValue || null
}

function normalizeBoolean(
  value: unknown,
): boolean {
  return value === true
}

function normalizeFileSize(
  value: unknown,
): number | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null
  }

  if (typeof value !== 'number') {
    return Number.NaN
  }

  return value
}

function normalizeEvidenceType(
  value: unknown,
): AgendaEvidenceType {
  if (typeof value !== 'string') {
    return 'texto'
  }

  const normalizedValue =
    value.trim().toLowerCase()

  if (
    normalizedValue === 'texto' ||
    normalizedValue === 'imagem' ||
    normalizedValue === 'pdf' ||
    normalizedValue === 'link'
  ) {
    return normalizedValue
  }

  return normalizedValue as AgendaEvidenceType
}

function getErrorStatus(
  error: unknown,
): number {
  if (error instanceof SyntaxError) {
    return 400
  }

  if (!(error instanceof Error)) {
    return 500
  }

  const message =
    error.message.toLowerCase()

  if (
    message.includes('não autenticado') ||
    message.includes('não autorizado')
  ) {
    return 401
  }

  if (
    message.includes('obrigatório') ||
    message.includes('obrigatória') ||
    message.includes('inválido') ||
    message.includes('inválida') ||
    message.includes('informe') ||
    message.includes('envie') ||
    message.includes('confirme') ||
    message.includes('autorização') ||
    message.includes('bucket') ||
    message.includes('caminho') ||
    message.includes('tamanho')
  ) {
    return 400
  }

  if (
    message.includes('não encontrada')
  ) {
    return 404
  }

  return 500
}

function createErrorResponse(
  error: unknown,
  fallbackMessage: string,
) {
  if (isAccessDeniedError(error)) {
    return NextResponse.json(
      serializeAccessDeniedError(error),
      {
        status: 403,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  }

  const message =
    error instanceof Error
      ? error.message
      : fallbackMessage

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status: getErrorStatus(error),
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}

export async function GET(
  request: Request,
) {
  try {
    const user =
      await requireSessionUser()

    await requireFeatureAccess({
      userId: user.id,
      featureCode: 'evidences.text',
      options: {
        includeUsage: false,
      },
    })

    const { searchParams } =
      new URL(request.url)

    const planningId =
      normalizeOptionalText(
        searchParams.get('planningId'),
      )

    const eventId =
      normalizeOptionalText(
        searchParams.get('eventId'),
      )

    const evidenceType =
      normalizeOptionalText(
        searchParams.get('evidenceType'),
      )

    let data =
      await evidencesService.listByUserId(
        user.id,
      )

    if (planningId) {
      data = data.filter(
        (evidence) =>
          evidence.planning_id ===
          planningId,
      )
    }

    if (eventId) {
      data = data.filter(
        (evidence) =>
          evidence.event_id === eventId,
      )
    }

    if (evidenceType) {
      data = data.filter(
        (evidence) =>
          evidence.evidence_type ===
          evidenceType,
      )
    }

    return NextResponse.json(
      {
        success: true,
        total: data.length,
        data,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    return createErrorResponse(
      error,
      'Não foi possível carregar as evidências.',
    )
  }
}

export async function POST(
  request: Request,
) {
  try {
    const user =
      await requireSessionUser()

    const body =
      (await request.json()) as CreateEvidenceRequestBody

    const evidenceType =
      normalizeEvidenceType(
        body.evidenceType,
      )

    const requiredFeature =
      evidenceType === 'imagem' ||
      evidenceType === 'pdf'
        ? 'evidences.upload'
        : 'evidences.text'

    await requireFeatureAccess({
      userId: user.id,
      featureCode: requiredFeature,
      options: {
        includeUsage: true,
      },
    })

    const containsIdentifiableMinor =
      normalizeBoolean(
        body.containsIdentifiableMinor,
      )

    const guardianAuthorizationConfirmed =
      normalizeBoolean(
        body.guardianAuthorizationConfirmed,
      )

    const authorizationConfirmedAt =
      containsIdentifiableMinor &&
      guardianAuthorizationConfirmed
        ? new Date().toISOString()
        : null

    const authorizationConfirmedBy =
      containsIdentifiableMinor &&
      guardianAuthorizationConfirmed
        ? user.id
        : null

    const input: CreateAgendaEvidenceInput = {
      title:
        typeof body.title === 'string'
          ? body.title
          : '',

      description:
        normalizeOptionalText(
          body.description,
        ),

      evidence_type:
        evidenceType,

      file_url:
        normalizeOptionalText(
          body.fileUrl,
        ),

      external_url:
        normalizeOptionalText(
          body.externalUrl,
        ),

      planning_id:
        normalizeOptionalText(
          body.planningId,
        ),

      event_id:
        normalizeOptionalText(
          body.eventId,
        ),

      school_id:
        normalizeOptionalText(
          body.schoolId,
        ),

      user_id: user.id,

      contains_identifiable_minor:
        containsIdentifiableMinor,

      guardian_authorization_confirmed:
        guardianAuthorizationConfirmed,

      authorization_reference:
        normalizeOptionalText(
          body.authorizationReference,
        ),

      authorization_confirmed_at:
        authorizationConfirmedAt,

      authorization_confirmed_by:
        authorizationConfirmedBy,

      privacy_notice_version:
        normalizeOptionalText(
          body.privacyNoticeVersion,
        ) ??
        'edi-protecao-menores-v1.0',

      storage_bucket:
        normalizeOptionalText(
          body.storageBucket,
        ),

      storage_path:
        normalizeOptionalText(
          body.storagePath,
        ),

      original_file_name:
        normalizeOptionalText(
          body.originalFileName,
        ),

      file_mime_type:
        normalizeOptionalText(
          body.fileMimeType,
        ),

      file_size_bytes:
        normalizeFileSize(
          body.fileSizeBytes,
        ),
    }

    const data =
      await evidencesService.create(
        input,
      )

    return NextResponse.json(
      {
        success: true,

        message:
          containsIdentifiableMinor
            ? 'Evidência criada com registro da autorização do responsável.'
            : 'Evidência criada com sucesso.',

        data,
      },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    return createErrorResponse(
      error,
      'Não foi possível criar a evidência.',
    )
  }
}