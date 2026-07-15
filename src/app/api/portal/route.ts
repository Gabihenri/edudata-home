import { NextResponse } from 'next/server'
import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import { requireSessionUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

type PortalProfile = {
  role: string
  status: string
  display_name: string | null
  onboarding_completed: boolean
}

type PortalMembership = {
  organization_id: string
  school_id: string | null
  role: string
  status: string
  hierarchy_level: number
}

type ProductPermissionRow = {
  product_code: string
  can_access: boolean
}

type PortalProduct = {
  code: string
  title: string
  description: string
  href: string
  icon: string
  enabled: boolean
}

const PRODUCT_CATALOG = [
  {
    code: 'home',
    title: 'Home EduData IA',
    description:
      'Acesse a página institucional da EduData IA.',
    href: '/',
    icon: '🏠',
  },
  {
    code: 'agenda_edi',
    title: 'Agenda Inteligente EDI',
    description:
      'Planejamento, eventos, tarefas, evidências e acompanhamento pedagógico.',
    href: '/agenda',
    icon: '📅',
  },
  {
    code: 'professor_digital',
    title: 'Professor Digital',
    description:
      'Ambiente inteligente de apoio ao trabalho docente.',
    href: '/professor-digital',
    icon: '👨‍🏫',
  },
  {
    code: 'analytics',
    title: 'EduData Analytics',
    description:
      'Indicadores, tendências, alertas e apoio à tomada de decisão.',
    href: '/analytics',
    icon: '📊',
  },
  {
    code: 'academy',
    title: 'EduData Academy',
    description:
      'Cursos, formações e trilhas de desenvolvimento profissional.',
    href: '/academy',
    icon: '🎓',
  },
  {
    code: 'sgpa',
    title: 'SGPA',
    description:
      'Gestão pedagógica, acompanhamento e automações institucionais.',
    href: '/sgpa',
    icon: '🏫',
  },
  {
    code: 'observatory',
    title: 'Observatório da Educação',
    description:
      'Dados públicos, indicadores e análises educacionais.',
    href: '/observatorio',
    icon: '🌎',
  },
  {
    code: 'community',
    title: 'Comunidade EduData IA',
    description:
      'Compartilhamento de práticas, projetos e colaboração.',
    href: '/comunidade',
    icon: '👥',
  },
  {
    code: 'backoffice',
    title: 'BackOffice',
    description:
      'Gestão administrativa, institucional e operacional da plataforma.',
    href: '/backoffice',
    icon: '⚙️',
  },
  {
    code: 'experience_manager',
    title: 'Experience Manager',
    description:
      'Gestão da Home, conteúdos, identidade visual e produtos em destaque.',
    href: '/experience-manager',
    icon: '🧩',
  },
] as const

const ROLE_ALIASES: Record<string, string> = {
  student: 'student',
  aluno: 'student',
  estudante: 'student',

  teacher: 'teacher',
  professor: 'teacher',

  coordinator: 'coordinator',
  coordenador: 'coordinator',

  vice_principal: 'vice_principal',
  vice_diretor: 'vice_principal',

  principal: 'principal',
  director: 'principal',
  diretor: 'principal',

  supervisor: 'supervisor',

  regional_manager: 'regional_manager',
  gestor_regional: 'regional_manager',

  institution_admin: 'institution_admin',
  admin_institucional: 'institution_admin',
  administrador: 'institution_admin',

  platform_admin: 'platform_admin',
  admin: 'platform_admin',

  super_admin: 'super_admin',
}

function createPortalClient(): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

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

function normalizeRole(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null
  }

  const normalizedValue = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

  return (
    ROLE_ALIASES[normalizedValue] ??
    normalizedValue
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
    message.includes('não autenticado') ||
    message.includes('não autorizado') ||
    message.includes('unauthorized')
  ) {
    return 401
  }

  if (
    message.includes('sem permissão') ||
    message.includes('proibido') ||
    message.includes('forbidden')
  ) {
    return 403
  }

  return 500
}

function createProducts(
  enabledCodes: Set<string>,
  isSuperAdmin: boolean,
): PortalProduct[] {
  return PRODUCT_CATALOG.map(
    (product) => {
      const enabled =
        product.code === 'home' ||
        isSuperAdmin ||
        enabledCodes.has(product.code)

      return {
        ...product,
        enabled,
      }
    },
  )
}

export async function GET() {
  try {
    const user =
      await requireSessionUser()

    const client =
      createPortalClient()

    const [
      profileResult,
      membershipResult,
    ] = await Promise.all([
      client
        .from('user_profiles')
        .select(
          [
            'role',
            'status',
            'display_name',
            'onboarding_completed',
          ].join(','),
        )
        .eq('user_id', user.id)
        .maybeSingle(),

      client
        .from('organization_members')
        .select(
          [
            'organization_id',
            'school_id',
            'role',
            'status',
            'hierarchy_level',
          ].join(','),
        )
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order(
          'hierarchy_level',
          {
            ascending: false,
          },
        )
        .limit(1)
        .maybeSingle(),
    ])

    if (profileResult.error) {
      throw new Error(
        `Erro ao consultar perfil: ${profileResult.error.message}`,
      )
    }

    if (membershipResult.error) {
      throw new Error(
        `Erro ao consultar vínculo institucional: ${membershipResult.error.message}`,
      )
    }

    const profile =
      profileResult.data as PortalProfile | null

    const membership =
      membershipResult.data as PortalMembership | null

    const roleCode =
      normalizeRole(
        membership?.role ??
        profile?.role,
      )

    const profileIsActive =
      profile?.status === 'active'

    const enabledCodes =
      new Set<string>()

    if (
      profileIsActive &&
      roleCode
    ) {
      const {
        data: permissionRows,
        error: permissionsError,
      } = await client
        .from(
          'identity_product_permissions',
        )
        .select(
          'product_code, can_access',
        )
        .eq(
          'role_code',
          roleCode,
        )
        .eq(
          'can_access',
          true,
        )

      if (permissionsError) {
        throw new Error(
          `Erro ao consultar permissões dos produtos: ${permissionsError.message}`,
        )
      }

      for (
        const permission of
        (permissionRows ?? []) as ProductPermissionRow[]
      ) {
        if (permission.can_access) {
          enabledCodes.add(
            permission.product_code,
          )
        }
      }
    }

    const isSuperAdmin =
      profileIsActive &&
      roleCode === 'super_admin'

    const products =
      createProducts(
        enabledCodes,
        isSuperAdmin,
      )

    return NextResponse.json(
      {
        success: true,

        user: {
          id: user.id,
          email:
            user.email ?? null,
          displayName:
            profile?.display_name ??
            user.email ??
            'Usuário',
          role: roleCode,
          profileStatus:
            profile?.status ??
            'pending',
          onboardingCompleted:
            profile?.onboarding_completed ??
            false,
        },

        membership: membership
          ? {
              organizationId:
                membership.organization_id,
              schoolId:
                membership.school_id,
              role:
                normalizeRole(
                  membership.role,
                ),
              hierarchyLevel:
                membership.hierarchy_level,
              status:
                membership.status,
            }
          : null,

        onboardingRequired:
          !profile ||
          !profile.onboarding_completed,

        products,
      },
      {
        status: 200,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      },
    )
  } catch (error) {
    console.error(
      '[PORTAL_GET_ERROR]',
      error,
    )

    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao carregar o portal.'

    return NextResponse.json(
      {
        success: false,
        error: message,
        products: [],
      },
      {
        status: getErrorStatus(error),
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      },
    )
  }
}