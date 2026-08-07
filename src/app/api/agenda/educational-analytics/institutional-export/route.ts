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
  requireSessionUser,
} from '@/lib/auth/session'

import {
  buildInstitutionalExport,
  type InstitutionalExportFormat,
} from '@/lib/agenda/educational-analytics/institutional-export.service'

import type {
  InstitutionalReportProfile,
} from '@/lib/agenda/educational-analytics/institutional-report.engine'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const FEATURE_CODE = 'agenda.planning'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

const VALID_PROFILES:
  InstitutionalReportProfile[] = [
    'teacher',
    'coordination',
    'direction',
    'supervision',
    'secretariat',
    'research',
    'technical',
  ]

const VALID_FORMATS:
  InstitutionalExportFormat[] = [
    'json',
    'html',
  ]

function getAccessToken(
  request: NextRequest,
): string {
  const accessToken =
    request.cookies.get('sb-access-token')?.value ??
    request.cookies.get('access_token')?.value

  if (!accessToken) {
    throw new Error('Usuário não autenticado.')
  }

  return accessToken
}

function createAuthenticatedClient(
  accessToken: string,
): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

function normalizeProfile(
  value: string | null,
): InstitutionalReportProfile {
  const profile =
    value?.trim() as
      InstitutionalReportProfile | undefined

  if (
    !profile ||
    !VALID_PROFILES.includes(profile)
  ) {
    throw new Error(
      'Perfil institucional inválido.',
    )
  }

  return profile
}

function normalizeFormat(
  value: string | null,
): InstitutionalExportFormat {
  const format =
    (value?.trim() || 'json') as
      InstitutionalExportFormat

  if (!VALID_FORMATS.includes(format)) {
    throw new Error(
      'Formato de exportação inválido.',
    )
  }

  return format
}

function createErrorResponse(
  error: unknown,
) {
  if (isAccessDeniedError(error)) {
    return NextResponse.json(
      serializeAccessDeniedError(error),
      {
        status: 403,
        headers: NO_CACHE_HEADERS,
      },
    )
  }

  const message =
    error instanceof Error
      ? error.message
      : 'Erro desconhecido.'

  const normalized = message.toLowerCase()

  const status =
    normalized.includes('não autenticado')
      ? 401
      : normalized.includes('inválido') ||
          normalized.includes('obrigatório') ||
          normalized.includes('não foi encontrada') ||
          normalized.includes('não possui')
        ? 400
        : 500

  return NextResponse.json(
    {
      success: false,
      error:
        status >= 500
          ? 'Não foi possível exportar o relatório institucional.'
          : message,
      meta: {
        generatedAt: new Date().toISOString(),
      },
    },
    {
      status,
      headers: NO_CACHE_HEADERS,
    },
  )
}

export async function GET(
  request: NextRequest,
) {
  try {
    const user = await requireSessionUser()

    await requireFeatureAccess({
      userId: user.id,
      featureCode: FEATURE_CODE,
      options: {
        includeUsage: false,
      },
    })

    const runId =
      request.nextUrl.searchParams
        .get('runId')
        ?.trim()

    if (!runId) {
      throw new Error('runId é obrigatório.')
    }

    const profile = normalizeProfile(
      request.nextUrl.searchParams.get('profile'),
    )

    const format = normalizeFormat(
      request.nextUrl.searchParams.get('format'),
    )

    const client = createAuthenticatedClient(
      getAccessToken(request),
    )

    const document =
      await buildInstitutionalExport({
        client,
        userId: user.id,
        runId,
        profile,
        format,
      })

    return new Response(document.content, {
      status: 200,
      headers: {
        ...NO_CACHE_HEADERS,
        'Content-Type': document.mimeType,
        'Content-Disposition':
          `attachment; filename="${document.fileName}"`,
        'X-EduData-Document-Id': document.id,
        'X-EduData-Document-Hash': document.hash,
        'X-EduData-Document-Version': document.version,
        'X-EduData-Review-Required':
          document.requiresHumanReview
            ? 'true'
            : 'false',
        'X-EduData-Approved':
          document.approved
            ? 'true'
            : 'false',
      },
    })
  } catch (error) {
    console.error(
      '[AGENDA_EDUCATIONAL_ANALYTICS_INSTITUTIONAL_EXPORT_ERROR]',
      {
        message:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido.',
        occurredAt:
          new Date().toISOString(),
      },
    )

    return createErrorResponse(error)
  }
}
