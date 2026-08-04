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

import {
  adaptAgendaEvidenceToEducationalEvidence,
} from '@/lib/eios/evidence-intelligence/adapters/agenda-evidence.adapter'

import {
  evaluateEducationalEvidence,
} from '@/lib/eios/evidence-intelligence/evidence-intelligence.service'

export const dynamic =
  'force-dynamic'

export const runtime =
  'nodejs'

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
    value !==
      null &&
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
      'UsuÃ¡rio nÃ£o autenticado.',
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
      'VariÃ¡veis pÃºblicas do Supabase nÃ£o configuradas.',
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
      'O corpo da requisiÃ§Ã£o Ã© invÃ¡lido.',
    )
  }

  if (!isRecord(body)) {
    throw new Error(
      'O corpo da requisiÃ§Ã£o Ã© invÃ¡lido.',
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
      `${fieldName} possui formato invÃ¡lido.`,
    )
  }

  const normalizedValue =
    value.trim()

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} Ã© obrigatÃ³rio.`,
    )
  }

  if (
    normalizedValue.length >
      maximumLength
  ) {
    throw new Error(
      `${fieldName} nÃ£o pode ultrapassar ${maximumLength} caracteres.`,
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
    value ===
      undefined ||
    value ===
      null ||
    value ===
      ''
  ) {
    return null
  }

  if (
    typeof value !==
      'string'
  ) {
    throw new Error(
      `${fieldName} possui formato invÃ¡lido.`,
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
      `${fieldName} nÃ£o pode ultrapassar ${maximumLength} caracteres.`,
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
    value ===
      undefined ||
    value ===
      null ||
    value ===
      ''
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
      'O tamanho do arquivo Ã© invÃ¡lido.',
    )
  }

  return normalizedValue
}

function normalizeEvidenceType(
  value: unknown,
): AgendaEvidenceType {
  if (
    value ===
      undefined ||
    value ===
      null ||
    value ===
      ''
  ) {
    return 'texto'
  }

  if (
    typeof value !==
      'string'
  ) {
    throw new Error(
      'O tipo da evidÃªncia possui formato invÃ¡lido.',
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
    'Tipo de evidÃªncia invÃ¡lido. Use texto, imagem, pdf ou link.',
  )
}

function normalizeMetadata(
  value: unknown,
): AgendaEvidenceMetadata {
  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return {}
  }

  if (!isRecord(value)) {
    throw new Error(
      'Os metadados da evidÃªncia possuem formato invÃ¡lido.',
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
    'O filtro de identificaÃ§Ã£o de menor Ã© invÃ¡lido.',
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
      'nÃ£o autenticado',
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
      'sem permissÃ£o',
    ) ||
    message.includes(
      'nÃ£o autorizado',
    ) ||
    message.includes(
      'nÃ£o possui acesso',
    ) ||
    message.includes(
      'forbidden',
    )
  ) {
    return 403
  }

  if (
    message.includes(
      'nÃ£o encontrada',
    ) ||
    message.includes(
      'nÃ£o encontrado',
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
      'jÃ¡ existe',
    )
  ) {
    return 409
  }

  if (
    message.includes(
      'obrigatÃ³rio',
    ) ||
    message.includes(
      'obrigatÃ³ria',
    ) ||
    message.includes(
      'invÃ¡lido',
    ) ||
    message.includes(
      'invÃ¡lida',
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
      'autorizaÃ§Ã£o',
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
      'nÃ£o pode ultrapassar',
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
    status >=
      500
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

function createEvidenceIntelligenceResponse({
  data,
  userId,
}: {
  data:
    Awaited<
      ReturnType<
        EvidencesService['create']
      >
    >

  userId:
    string
}) {
  const adaptation =
    adaptAgendaEvidenceToEducationalEvidence({
      evidence:
        data,

      options: {
        teacherId:
          userId,

        occurredAt:
          data.created_at,

        additionalMetadata: {
          integrationSource:
            'agenda-evidences-api',

          integratedAt:
            new Date()
              .toISOString(),
        },
      },
    })

  if (
    !adaptation.success ||
    !adaptation.evidence
  ) {
    return {
      success:
        false,

      processed:
        false,

      evidence:
        null,

      warnings:
        adaptation.warnings,

      errors:
        adaptation.errors,

      requiresHumanReview:
        true,
    }
  }

  try {
    const evaluation =
      evaluateEducationalEvidence({
        evidence:
          adaptation.evidence,

        options: {
          validate:
            true,

          classifyFramework:
            true,

          evaluateQuality:
            true,

          evaluateReliability:
            true,

          detectContradictions:
            false,

          consolidate:
            false,

          linkKnowledgeGraph:
            true,

          allowAutomaticValidation:
            true,

          allowAutomaticClassification:
            true,

          requireHumanReviewForSensitiveData:
            true,

          minimumConfidenceForAutomaticValidation:
            0.75,

          metadata: {
            source:
              'agenda-evidences-api',

            agendaEvidenceId:
              data.id,

            requestedBy:
              userId,
          },
        },
      })

    return {
      success:
        evaluation.success,

      processed:
        true,

      evidence:
        evaluation.evidence,

      validation:
        evaluation.validation,

      frameworkClassifications:
        evaluation.evidence
          .frameworkClassifications,

      quality:
        evaluation.evidence
          .quality,

      reliability:
        evaluation.evidence
          .reliability,

      privacy:
        evaluation.evidence
          .privacy,

      knowledgeGraphNodeId:
        evaluation.evidence
          .knowledgeGraphNodeId,

      knowledgeGraphEdgeIds:
        evaluation.evidence
          .knowledgeGraphEdgeIds,

      warnings: [
        ...adaptation.warnings,
        ...evaluation.warnings,
      ],

      errors:
        evaluation.errors,

      requiresHumanReview:
        adaptation
          .requiresHumanReview ||
        evaluation
          .requiresHumanReview,
    }
  } catch (
    intelligenceError
  ) {
    const message =
      intelligenceError instanceof
        Error
        ? intelligenceError.message
        : 'Erro inesperado ao processar a evidÃªncia no EIOS.'

    console.error(
      '[AGENDA_EVIDENCE_INTELLIGENCE_ERROR]',
      {
        agendaEvidenceId:
          data.id,

        userId,

        message,
      },
    )

    return {
      success:
        false,

      processed:
        false,

      evidence:
        adaptation.evidence,

      warnings:
        adaptation.warnings,

      errors: [
        message,
      ],

      requiresHumanReview:
        true,
    }
  }
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
            'ID da organizaÃ§Ã£o',
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
            'ID da reflexÃ£o',
          ),

        academicPeriodId:
          normalizeOptionalId(
            searchParams.get(
              'academicPeriodId',
            ),
            'ID do perÃ­odo acadÃªmico',
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
  } catch (
    error
  ) {
    console.error(
      '[AGENDA_EVIDENCES_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'NÃ£o foi possÃ­vel carregar as evidÃªncias.',
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
          'TÃ­tulo da evidÃªncia',
          240,
        ),

      description:
        normalizeOptionalText(
          body.description,
          'DescriÃ§Ã£o',
          5000,
        ),

      evidence_type:
        evidenceType,

      file_url:
        normalizeOptionalText(
          body.fileUrl,
          'URL pÃºblica legada do arquivo',
          2000,
        ),

      external_url:
        normalizeOptionalText(
          body.externalUrl,
          'EndereÃ§o externo',
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
          'ID da reflexÃ£o',
        ),

      academic_period_id:
        normalizeOptionalId(
          body.academicPeriodId,
          'ID do perÃ­odo acadÃªmico',
        ),

      organization_id:
        normalizeOptionalId(
          body.organizationId,
          'ID da organizaÃ§Ã£o',
        ),

      school_id:
        normalizeOptionalId(
          body.schoolId,
          'ID da escola',
        ),

      user_id:
        user.id,

      contains_identifiable_minor:
        containsIdentifiableMinor,

      guardian_authorization_confirmed:
        guardianAuthorizationConfirmed,

      authorization_reference:
        normalizeOptionalText(
          body.authorizationReference,
          'ReferÃªncia da autorizaÃ§Ã£o',
          1000,
        ),

      authorization_confirmed_at:
        authorizationConfirmedAt,

      authorization_confirmed_by:
        authorizationConfirmedBy,

      privacy_notice_version:
        normalizeOptionalText(
          body.privacyNoticeVersion,
          'VersÃ£o da polÃ­tica de privacidade',
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

    /*
     * O registro da evidÃªncia jÃ¡ foi persistido com sucesso.
     *
     * O processamento inteligente Ã© executado depois da
     * persistÃªncia para nÃ£o bloquear nem desfazer o cadastro
     * caso o motor produza aviso ou necessite revisÃ£o humana.
     */
    const intelligence =
      createEvidenceIntelligenceResponse({
        data,
        userId:
          user.id,
      })

    return NextResponse.json(
      {
        success:
          true,

        message:
          containsIdentifiableMinor
            ? 'EvidÃªncia criada com registro da autorizaÃ§Ã£o do responsÃ¡vel.'
            : 'EvidÃªncia criada com sucesso.',

        data,

        intelligence,
      },
      {
        status:
          201,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (
    error
  ) {
    console.error(
      '[AGENDA_EVIDENCES_POST_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'NÃ£o foi possÃ­vel criar a evidÃªncia.',
    )
  }
}
