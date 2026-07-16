import {
  NextResponse,
} from 'next/server'
import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import { requireSessionUser } from '@/lib/auth/session'
import { requireOrganizationAdministrator } from '@/lib/organization/organization.authorization'

export const dynamic =
  'force-dynamic'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

function createDiagnosticClient():
  SupabaseClient {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL não configurada.',
    )
  }

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY não configurada.',
    )
  }

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )
}

function getErrorStatus(
  error: unknown,
): number {
  if (!(error instanceof Error)) {
    return 500
  }

  const message =
    error.message.toLowerCase()

  if (
    message.includes(
      'não autenticado',
    ) ||
    message.includes(
      'não autorizado',
    ) ||
    message.includes(
      'unauthorized',
    )
  ) {
    return 401
  }

  return 500
}

export async function GET() {
  try {
    const user =
      await requireSessionUser()

    const client =
      createDiagnosticClient()

    const [
      profileResult,
      membershipsResult,
    ] = await Promise.all([
      client
        .from('user_profiles')
        .select(
          [
            'user_id',
            'role',
            'status',
            'display_name',
            'onboarding_completed',
          ].join(','),
        )
        .eq(
          'user_id',
          user.id,
        )
        .maybeSingle(),

      client
        .from(
          'organization_members',
        )
        .select(
          [
            'id',
            'organization_id',
            'school_id',
            'role',
            'status',
            'hierarchy_level',
            'scope_type',
            'can_manage_users',
            'can_manage_products',
            'access_starts_at',
            'access_ends_at',
          ].join(','),
        )
        .eq(
          'user_id',
          user.id,
        ),
    ])

    if (profileResult.error) {
      throw new Error(
        `Erro ao consultar perfil: ${profileResult.error.message}`,
      )
    }

    if (
      membershipsResult.error
    ) {
      throw new Error(
        `Erro ao consultar vínculos: ${membershipsResult.error.message}`,
      )
    }

    let authorization:
      Awaited<
        ReturnType<
          typeof requireOrganizationAdministrator
        >
      > | null = null

    let authorizationError:
      string | null = null

    try {
      authorization =
        await requireOrganizationAdministrator()
    } catch (error) {
      authorizationError =
        error instanceof Error
          ? error.message
          : 'Falha desconhecida na autorização.'
    }

    return NextResponse.json(
      {
        success: true,

        session: {
          user_id: user.id,
          email:
            typeof user.email ===
            'string'
              ? user.email
              : null,
        },

        profile:
          profileResult.data ??
          null,

        memberships:
          membershipsResult.data ??
          [],

        authorization:
          authorization
            ? {
                role:
                  authorization.role,

                status:
                  authorization.status,

                is_platform_administrator:
                  authorization.isPlatformAdministrator,

                organization_ids:
                  authorization.organizationIds,

                school_ids:
                  authorization.schoolIds,

                memberships:
                  authorization.memberships,
              }
            : null,

        authorization_error:
          authorizationError,
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[INSTITUTION_ACCESS_DIAGNOSTIC_ERROR]',
      error,
    )

    const status =
      getErrorStatus(error)

    return NextResponse.json(
      {
        success: false,
        error:
          status === 401
            ? error instanceof Error
              ? error.message
              : 'Não autenticado.'
            : 'Não foi possível executar o diagnóstico de acesso.',
      },
      {
        status,
        headers: NO_CACHE_HEADERS,
      },
    )
  }
}