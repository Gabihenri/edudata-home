import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  isAccessDeniedError,
  requireFeatureAccess,
  serializeAccessDeniedError,
} from '@/lib/access/guards/require-feature-access'

import {
  EvidencesRepository,
  type AgendaEvidenceMetadata,
  type AgendaEvidenceType,
  type CreateAgendaEvidenceInput,
} from '@/lib/agenda/repository/evidences.repository'

import {
  EvidencesService,
} from '@/lib/agenda/services/evidences.service'

import {
  requireSessionUser,
} from '@/lib/auth/session'

export const dynamic =
  'force-dynamic'

type UnknownRecord =
  Record<string, unknown>

type CreateEvidenceRequestBody = {
  title?: unknown
  description?: unknown

  evidenceType?: unknown

  fileUrl?: unknown
  externalUrl?: unknown

  planningId?: unknown
  eventId?: unknown

  lessonId?: unknown
  objectiveId?: unknown
  classId?: unknown

  reflectionId?: unknown
  academicPeriodId?: unknown

  organizationId?: unknown
  schoolId?: unknown

  containsIdentifiableMinor?: unknown

  guardianAuthorizationConfirmed?: unknown
  authorizationReference?: unknown

  privacyNoticeVersion?: unknown

  storageBucket?: unknown
  storagePath?: unknown

  originalFileName?: unknown
  fileMimeType?: unknown
  fileSizeBytes?: unknown

  metadata?: unknown
}

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

const DEFAULT_PRIVACY_NOTICE_VERSION =
  'edi-protecao-menores-v1.0'

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value ===
      'object' &&
    value !== null &&
    !Array.isArray(
      value,
    )
  )
}

function getAccessToken(
  request: NextRequest,
): string {
  const accessToken =
    request.cookies.get(
      'sb-access-token',
    )?.value ??
    request.cookies.get(
      'access_token',
    )?.value

  if (!accessToken) {
    throw new Error(
      'Usuário não autenticado.',
    )
  }

  return accessToken
}

function createAuthenticatedClient(
  accessToken: string,
): SupabaseClient {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const anonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (
    !url ||
    !anonKey
  ) {
    throw new Error(
      'Variáveis públicas do Supabase não configuradas.',
    )
  }

  return createClient(
    url,
    anonKey,
    {
      global: {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      },

      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,

        detectSessionInUrl:
          false,
      },
    },
  )
}

function createEvidencesService(
  request: NextRequest,
): EvidencesService {
  const accessToken =
    getAccessToken(
      request,
    )

  const client =
    createAuthenticatedClient(
      accessToken,
    )

  const repository =
    new EvidencesRepository(
      client,
    )

  return new EvidencesService(
    repository,
  )
}

async function readRequestBody(
  request: NextRequest,
): Promise<
  CreateEvidenceRequestBody
> {
  let body: unknown

  try {
    body =
      await request.json()
  } catch {
    throw new Error(
      'O corpo da requisição é inválido.',
    )
  }

  if (!isRecord(body)) {
    throw new Error(
      'O corpo da requisição é inválido.',
    )
  }

  return body as
    CreateEvidenceRequestBody
}

function normalizeRequiredText(
  value: unknown,
  fieldName: string,
  maximumLength: number,
): string {
  if (
    typeof value !==
      'string'
  ) {
    throw new Error(
      `${fieldName} possui formato inválido.`,
    )
  }

  const normalizedValue =
    value.trim()

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  if (
    normalizedValue.length >
      maximumLength
  ) {
    throw new Error(
      `${fieldName} não pode ultrapassar ${maximumLength} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeOptionalText(
  value: unknown,
  fieldName: string,
  maximumLength: number,
): string | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null
  }

  if (
    typeof value !==
      'string'
  ) {
    throw new Error(
      `${fieldName} possui formato inválido.`,
    )
  }

  const normalizedValue =
    value.trim()

  if (!normalizedValue) {
    return null
  }

  if (
    normalizedValue.length >
      maximumLength
  ) {
    throw new Error(
      `${fieldName} não pode ultrapassar ${maximumLength} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeOptionalId(
  value: unknown,
  fieldName: string,
): string | null {
  return normalizeOptionalText(
    value,
    fieldName,
    36,
  )
}

function normalizeBoolean(
  value: unknown,
): boolean {
  return value ===
    true
}

function normalizeFileSize(
  value: unknown,
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null
  }

  const normalizedValue =
    typeof value ===
      'number'
      ? value
      : typeof value ===
          'string' &&
        value.trim()
        ? Number(
            value,
          )
        : Number.NaN

  if (
    !Number.isInteger(
      normalizedValue,
    ) ||
    normalizedValue <
      0
  ) {
    throw new Error(
      'O tamanho do arquivo é inválido.',
    )
  }

  return normalizedValue
}

function normalizeEvidenceType(
  value: unknown,
): AgendaEvidenceType {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 'texto'
  }

  if (
    typeof value !==
      'string'
  ) {
    throw new Error(
      'O tipo da evidência possui formato inválido.',
    )
  }

  const normalizedValue =
    value
      .trim()
      .toLowerCase()

  if (
    normalizedValue ===
      'texto' ||
    normalizedValue ===
      'imagem' ||
    normalizedValue ===
      'pdf' ||
    normalizedValue ===
      'link'
  ) {
    return normalizedValue
  }

  throw new Error(
    'Tipo de evidência inválido. Use texto, imagem, pdf ou link.',
  )
}

function normalizeMetadata(
  value: unknown,
): AgendaEvidenceMetadata {
  if (
    value === undefined ||
    value === null
  ) {
    return {}
  }

  if (!isRecord(value)) {
    throw new Error(
      'Os metadados da evidência possuem formato inválido.',
    )
  }

  return value
}

function normalizeOptionalEvidenceType(
  value:
    string | null,
): AgendaEvidenceType | null {
  if (!value) {
    return null
  }

  return normalizeEvidenceType(
    value,
  )
}

function normalizeOptionalBooleanQuery(
  value:
    string | null,
): boolean | null {
  if (!value) {
    return null
  }

  const normalizedValue =
    value
      .trim()
      .toLowerCase()

  if (
    normalizedValue ===
      'true' ||
    normalizedValue ===
      '1'
  ) {
    return true
  }

  if (
    normalizedValue ===
      'false' ||
    normalizedValue ===
      '0'
  ) {
    return false
  }

  throw new Error(
    'O filtro de identificação de menor é inválido.',
  )
}

function getErrorStatus(
  error: unknown,
): number {
  if (
    error instanceof
      SyntaxError
  ) {
    return 400
  }

  if (
    !(error instanceof
      Error)
  ) {
    return 500
  }

  const message =
    error.message
      .toLowerCase()

  if (
    message.includes(
      'não autenticado',
    ) ||
    message.includes(
      'unauthorized',
    )
  ) {
    return 401
  }

  if (
    message.includes(
      'permission denied',
    ) ||
    message.includes(
      'row-level security',
    ) ||
    message.includes(
      'sem permissão',
    ) ||
    message.includes(
      'não autorizado',
    ) ||
    message.includes(
      'não possui acesso',
    ) ||
    message.includes(
      'forbidden',
    )
  ) {
    return 403
  }

  if (
    message.includes(
      'não encontrada',
    ) ||
    message.includes(
      'não encontrado',
    )
  ) {
    return 404
  }

  if (
    message.includes(
      'duplicate',
    ) ||
    message.includes(
      'unique constraint',
    ) ||
    message.includes(
      'já existe',
    )
  ) {
    return 409
  }

  if (
    message.includes(
      'obrigatório',
    ) ||
    message.includes(
      'obrigatória',
    ) ||
    message.includes(
      'inválido',
    ) ||
    message.includes(
      'inválida',
    ) ||
    message.includes(
      'formato',
    ) ||
    message.includes(
      'informe',
    ) ||
    message.includes(
      'envie',
    ) ||
    message.includes(
      'confirme',
    ) ||
    message.includes(
      'autorização',
    ) ||
    message.includes(
      'bucket',
    ) ||
    message.includes(
      'caminho',
    ) ||
    message.includes(
      'tamanho',
    ) ||
    message.includes(
      'não pode ultrapassar',
    )
  ) {
    return 400
  }

  return 500
}

function createErrorResponse(
  error: unknown,
  fallbackMessage: string,
) {
  if (
    isAccessDeniedError(
      error,
    )
  ) {
    return NextResponse.json(
      serializeAccessDeniedError(
        error,
      ),
      {
        status:
          403,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  const status =
    getErrorStatus(
      error,
    )

  const message =
    status >= 500
      ? fallbackMessage
      : error instanceof
          Error
        ? error.message
        : fallbackMessage

  return NextResponse.json(
    {
      success:
        false,

      error:
        message,
    },
    {
      status,

      headers:
        NO_CACHE_HEADERS,
    },
  )
}

export async function GET(
  request: NextRequest,
) {
  try {
    const user =
      await requireSessionUser()

    await requireFeatureAccess({
      userId:
        user.id,

      featureCode:
        'evidences.text',

      options: {
        includeUsage:
          false,
      },
    })

    const searchParams =
      request.nextUrl
        .searchParams

    const service =
      createEvidencesService(
        request,
      )

    const data =
      await service.list({
        userId:
          user.id,

        organizationId:
          normalizeOptionalId(
            searchParams.get(
              'organizationId',
            ),
            'ID da organização',
          ),

        schoolId:
          normalizeOptionalId(
            searchParams.get(
              'schoolId',
            ),
            'ID da escola',
          ),

        planningId:
          normalizeOptionalId(
            searchParams.get(
              'planningId',
            ),
            'ID do planejamento',
          ),

        eventId:
          normalizeOptionalId(
            searchParams.get(
              'eventId',
            ),
            'ID do evento',
          ),

        lessonId:
          normalizeOptionalId(
            searchParams.get(
              'lessonId',
            ),
            'ID da aula',
          ),

        objectiveId:
          normalizeOptionalId(
            searchParams.get(
              'objectiveId',
            ),
            'ID do objetivo',
          ),

        classId:
          normalizeOptionalId(
            searchParams.get(
              'classId',
            ),
            'ID da turma',
          ),

        reflectionId:
          normalizeOptionalId(
            searchParams.get(
              'reflectionId',
            ),
            'ID da reflexão',
          ),

        academicPeriodId:
          normalizeOptionalId(
            searchParams.get(
              'academicPeriodId',
            ),
            'ID do período acadêmico',
          ),

        evidenceType:
          normalizeOptionalEvidenceType(
            searchParams.get(
              'evidenceType',
            ),
          ),

        containsIdentifiableMinor:
          normalizeOptionalBooleanQuery(
            searchParams.get(
              'containsIdentifiableMinor',
            ),
          ),

        search:
          normalizeOptionalText(
            searchParams.get(
              'search',
            ),
            'Pesquisa',
            200,
          ),
      })

    return NextResponse.json(
      {
        success:
          true,

        total:
          data.length,

        data,
      },
      {
        status:
          200,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_EVIDENCES_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar as evidências.',
    )
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const user =
      await requireSessionUser()

    const body =
      await readRequestBody(
        request,
      )

    const evidenceType =
      normalizeEvidenceType(
        body.evidenceType,
      )

    const requiredFeature =
      evidenceType ===
        'imagem' ||
      evidenceType ===
        'pdf'
        ? 'evidences.upload'
        : 'evidences.text'

    await requireFeatureAccess({
      userId:
        user.id,

      featureCode:
        requiredFeature,

      options: {
        includeUsage:
          true,
      },
    })

    /*
     * Política ECA Digital preservada.
     *
     * O cliente informa apenas a declaração e a referência.
     * O servidor determina quem confirmou e quando confirmou.
     */
    const containsIdentifiableMinor =
      normalizeBoolean(
        body
          .containsIdentifiableMinor,
      )

    const guardianAuthorizationConfirmed =
      normalizeBoolean(
        body
          .guardianAuthorizationConfirmed,
      )

    const authorizationConfirmedAt =
      containsIdentifiableMinor &&
      guardianAuthorizationConfirmed
        ? new Date()
            .toISOString()
        : null

    const authorizationConfirmedBy =
      containsIdentifiableMinor &&
      guardianAuthorizationConfirmed
        ? user.id
        : null

    const metadata =
      normalizeMetadata(
        body.metadata,
      )

    const input:
      CreateAgendaEvidenceInput = {
        title:
          normalizeRequiredText(
            body.title,
            'Título da evidência',
            240,
          ),

        description:
          normalizeOptionalText(
            body.description,
            'Descrição',
            5000,
          ),

        evidence_type:
          evidenceType,

        file_url:
          normalizeOptionalText(
            body.fileUrl,
            'URL pública legada do arquivo',
            2000,
          ),

        external_url:
          normalizeOptionalText(
            body.externalUrl,
            'Endereço externo',
            2000,
          ),

        planning_id:
          normalizeOptionalId(
            body.planningId,
            'ID do planejamento',
          ),

        event_id:
          normalizeOptionalId(
            body.eventId,
            'ID do evento',
          ),

        lesson_id:
          normalizeOptionalId(
            body.lessonId,
            'ID da aula',
          ),

        objective_id:
          normalizeOptionalId(
            body.objectiveId,
            'ID do objetivo',
          ),

        class_id:
          normalizeOptionalId(
            body.classId,
            'ID da turma',
          ),

        reflection_id:
          normalizeOptionalId(
            body.reflectionId,
            'ID da reflexão',
          ),

        academic_period_id:
          normalizeOptionalId(
            body.academicPeriodId,
            'ID do período acadêmico',
          ),

        organization_id:
          normalizeOptionalId(
            body.organizationId,
            'ID da organização',
          ),

        school_id:
          normalizeOptionalId(
            body.schoolId,
            'ID da escola',
          ),

        /*
         * O usuário responsável nunca é aceito do cliente.
         */
        user_id:
          user.id,

        contains_identifiable_minor:
          containsIdentifiableMinor,

        guardian_authorization_confirmed:
          guardianAuthorizationConfirmed,

        authorization_reference:
          normalizeOptionalText(
            body.authorizationReference,
            'Referência da autorização',
            1000,
          ),

        authorization_confirmed_at:
          authorizationConfirmedAt,

        authorization_confirmed_by:
          authorizationConfirmedBy,

        privacy_notice_version:
          normalizeOptionalText(
            body.privacyNoticeVersion,
            'Versão da política de privacidade',
            100,
          ) ??
          DEFAULT_PRIVACY_NOTICE_VERSION,

        storage_bucket:
          normalizeOptionalText(
            body.storageBucket,
            'Bucket do arquivo',
            200,
          ),

        storage_path:
          normalizeOptionalText(
            body.storagePath,
            'Caminho do arquivo',
            2000,
          ),

        original_file_name:
          normalizeOptionalText(
            body.originalFileName,
            'Nome original do arquivo',
            500,
          ),

        file_mime_type:
          normalizeOptionalText(
            body.fileMimeType,
            'Tipo MIME do arquivo',
            200,
          ),

        file_size_bytes:
          normalizeFileSize(
            body.fileSizeBytes,
          ),

        metadata: {
          ...metadata,

          source:
            typeof metadata.source ===
              'string'
              ? metadata.source
              : 'agenda-evidences-api',

          createdThrough:
            'authenticated-user-flow',
        },

        created_by:
          user.id,

        updated_by:
          user.id,
      }

    const service =
      createEvidencesService(
        request,
      )

    const data =
      await service.create(
        input,
      )

    return NextResponse.json(
      {
        success:
          true,

        message:
          containsIdentifiableMinor
            ? 'Evidência criada com registro da autorização do responsável.'
            : 'Evidência criada com sucesso.',

        data,
      },
      {
        status:
          201,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_EVIDENCES_POST_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível criar a evidência.',
    )
  }
}