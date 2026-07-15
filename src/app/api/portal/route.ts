import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import { requireSessionUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

type AccountType =
  | 'individual'
  | 'corporate'

type NoticeLevel =
  | 'info'
  | 'warning'
  | 'error'

type PortalProfile = {
  role: string | null
  status: string | null
  display_name: string | null
}

type IdentityUser = {
  id: string
  full_name: string | null
  role: string | null
  profile_status: string | null
  onboarding_completed: boolean | null
  active_organization_id: string | null
  active_school_id: string | null
}

type PortalMembership = {
  id: string
  organization_id: string
  school_id: string | null
  role: string
  status: string
  hierarchy_level: number
  scope_type: string
  onboarding_completed: boolean
  access_starts_at: string | null
  access_ends_at: string | null
}

type PortalOrganization = {
  id: string
  name: string
}

type PortalSchool = {
  id: string
  organization_id: string
  name: string
  short_name: string | null
  city: string | null
  state: string | null
}

type ProductPermissionRow = {
  product_code: string
  can_access: boolean
}

type PortalNotice = {
  level: NoticeLevel
  code: string
  title: string
  message: string
}

type AuthorizedContext = {
  id: string
  accountType: AccountType

  organization: {
    id: string
    name: string
  } | null

  school: {
    id: string
    name: string
    shortName: string | null
    city: string | null
    state: string | null
  } | null

  role: string
  roleLabel: string
  hierarchyLevel: number
  scopeType: string
  status: string
  onboardingCompleted: boolean
}

type PortalProduct = {
  code: string
  title: string
  description: string
  href: string
  enabled: boolean
  unavailableReason: string | null
}

const PRODUCT_CATALOG = [
  {
    code: 'home',
    title: 'Home EduData IA',
    description:
      'Página institucional e apresentação do ecossistema EduData IA.',
    href: '/',
  },
  {
    code: 'agenda_edi',
    title: 'Agenda Inteligente EDI',
    description:
      'Planejamento, eventos, tarefas, evidências e acompanhamento pedagógico.',
    href: '/agenda',
  },
  {
    code: 'professor_digital',
    title: 'Professor Digital',
    description:
      'Ambiente inteligente de apoio ao trabalho docente.',
    href: '/professor-digital',
  },
  {
    code: 'analytics',
    title: 'EduData Analytics',
    description:
      'Indicadores, tendências, alertas e apoio à tomada de decisão.',
    href: '/analytics',
  },
  {
    code: 'academy',
    title: 'EduData Academy',
    description:
      'Cursos, formações e trilhas de desenvolvimento profissional.',
    href: '/academy',
  },
  {
    code: 'sgpa',
    title: 'SGPA',
    description:
      'Gestão pedagógica, acompanhamento e automações institucionais.',
    href: '/sgpa',
  },
  {
    code: 'observatory',
    title: 'Observatório da Educação',
    description:
      'Dados públicos, indicadores e análises educacionais.',
    href: '/observatorio',
  },
  {
    code: 'community',
    title: 'Comunidade EduData IA',
    description:
      'Compartilhamento de práticas, projetos e colaboração profissional.',
    href: '/comunidade',
  },
  {
    code: 'backoffice',
    title: 'BackOffice',
    description:
      'Gestão administrativa, institucional e operacional da plataforma.',
    href: '/backoffice',
  },
  {
    code: 'experience_manager',
    title: 'Experience Manager',
    description:
      'Gestão da Home, conteúdos, identidade visual e produtos em destaque.',
    href: '/experience-manager',
  },
] as const

const ROLE_ALIASES:
  Record<string, string> = {
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

    regional_manager:
      'regional_manager',
    gestor_regional:
      'regional_manager',

    institution_admin:
      'institution_admin',
    admin_institucional:
      'institution_admin',
    administrador_institucional:
      'institution_admin',

    platform_admin:
      'platform_admin',
    admin:
      'platform_admin',

    super_admin:
      'super_admin',
  }

const ROLE_LABELS:
  Record<string, string> = {
    student:
      'Estudante',

    teacher:
      'Professor',

    coordinator:
      'Coordenador',

    vice_principal:
      'Vice-diretor',

    principal:
      'Diretor',

    supervisor:
      'Supervisor',

    regional_manager:
      'Gestor Regional',

    institution_admin:
      'Administrador Institucional',

    platform_admin:
      'Administrador da Plataforma',

    super_admin:
      'Superadministrador EduData IA',
  }

const INDIVIDUAL_ROLES =
  new Set([
    'student',
    'teacher',
  ])

const PLATFORM_ROLES =
  new Set([
    'platform_admin',
    'super_admin',
  ])

function createPortalClient():
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

function normalizeOptionalText(
  value: string | null,
): string | null {
  const normalizedValue =
    value?.trim()

  return normalizedValue || null
}

function normalizeRole(
  value:
    | string
    | null
    | undefined,
): string | null {
  if (!value) {
    return null
  }

  const normalizedValue =
    value
      .trim()
      .toLowerCase()
      .replace(
        /[\s-]+/g,
        '_',
      )

  return (
    ROLE_ALIASES[
      normalizedValue
    ] ??
    normalizedValue
  )
}

function getRoleLabel(
  role: string,
): string {
  return (
    ROLE_LABELS[role] ??
    role
  )
}

function isActiveStatus(
  value:
    | string
    | null
    | undefined,
): boolean {
  return (
    value
      ?.trim()
      .toLowerCase() ===
    'active'
  )
}

function isMembershipValid(
  membership:
    PortalMembership,
): boolean {
  if (
    !isActiveStatus(
      membership.status,
    )
  ) {
    return false
  }

  const now =
    Date.now()

  if (
    membership
      .access_starts_at
  ) {
    const startsAt =
      new Date(
        membership
          .access_starts_at,
      ).getTime()

    if (
      !Number.isNaN(
        startsAt,
      ) &&
      startsAt > now
    ) {
      return false
    }
  }

  if (
    membership
      .access_ends_at
  ) {
    const endsAt =
      new Date(
        membership
          .access_ends_at,
      ).getTime()

    if (
      !Number.isNaN(
        endsAt,
      ) &&
      endsAt < now
    ) {
      return false
    }
  }

  return true
}

function createCorporateContext(
  membership:
    PortalMembership,

  organizations:
    Map<
      string,
      PortalOrganization
    >,

  schools:
    Map<
      string,
      PortalSchool
    >,
): AuthorizedContext {
  const organization =
    organizations.get(
      membership
        .organization_id,
    )

  const school =
    membership.school_id
      ? schools.get(
          membership.school_id,
        )
      : undefined

  const role =
    normalizeRole(
      membership.role,
    ) ?? 'teacher'

  return {
    id:
      membership.id,

    accountType:
      'corporate',

    organization: {
      id:
        membership
          .organization_id,

      name:
        organization?.name ??
        'Instituição não identificada',
    },

    school:
      school
        ? {
            id:
              school.id,

            name:
              school.name,

            shortName:
              school.short_name,

            city:
              school.city,

            state:
              school.state,
          }
        : null,

    role,

    roleLabel:
      getRoleLabel(role),

    hierarchyLevel:
      membership
        .hierarchy_level,

    scopeType:
      membership
        .scope_type,

    status:
      membership.status,

    onboardingCompleted:
      membership
        .onboarding_completed,
  }
}

function createIndividualContext(
  userId: string,
  role: string,
  status: string,
  onboardingCompleted: boolean,
): AuthorizedContext {
  return {
    id:
      `individual:${userId}`,

    accountType:
      'individual',

    organization:
      null,

    school:
      null,

    role,

    roleLabel:
      `${getRoleLabel(
        role,
      )} individual`,

    hierarchyLevel:
      role === 'student'
        ? 5
        : 10,

    scopeType:
      'self',

    status,

    onboardingCompleted,
  }
}

function createPlatformContext(
  userId: string,
  role: string,
  status: string,
  onboardingCompleted: boolean,
): AuthorizedContext {
  return {
    id:
      `platform:${userId}`,

    accountType:
      'corporate',

    organization: {
      id:
        'edudata-platform',

      name:
        'EduData IA Platform',
    },

    school:
      null,

    role,

    roleLabel:
      getRoleLabel(role),

    hierarchyLevel:
      role === 'super_admin'
        ? 100
        : 90,

    scopeType:
      'platform',

    status,

    onboardingCompleted,
  }
}

function contextMatchesRequest(
  context:
    AuthorizedContext,

  request: {
    organizationId:
      string | null

    schoolId:
      string | null

    role:
      string | null
  },
): boolean {
  if (
    request
      .organizationId &&
    context
      .organization
      ?.id !==
      request
        .organizationId
  ) {
    return false
  }

  if (
    request.schoolId &&
    context.school?.id !==
      request.schoolId
  ) {
    return false
  }

  if (
    request.role &&
    context.role !==
      request.role
  ) {
    return false
  }

  return true
}

function selectPreferredContext(
  contexts:
    AuthorizedContext[],

  identityUser:
    IdentityUser | null,
): AuthorizedContext | null {
  if (
    contexts.length === 0
  ) {
    return null
  }

  const preferred =
    contexts.find(
      (context) => {
        if (
          identityUser
            ?.active_organization_id &&
          context.organization
            ?.id !==
            identityUser
              .active_organization_id
        ) {
          return false
        }

        if (
          identityUser
            ?.active_school_id &&
          context.school
            ?.id !==
            identityUser
              .active_school_id
        ) {
          return false
        }

        return Boolean(
          identityUser
            ?.active_organization_id ||
          identityUser
            ?.active_school_id,
        )
      },
    )

  return (
    preferred ??
    contexts[0]
  )
}

function createProducts(
  enabledCodes:
    Set<string>,

  options: {
    contextIsActive:
      boolean

    isSuperAdmin:
      boolean
  },
): PortalProduct[] {
  return PRODUCT_CATALOG.map(
    (product) => {
      const enabled =
        product.code ===
          'home' ||
        (
          options
            .contextIsActive &&
          (
            options
              .isSuperAdmin ||
            enabledCodes.has(
              product.code,
            )
          )
        )

      let unavailableReason:
        string | null =
          null

      if (!enabled) {
        unavailableReason =
          options
            .contextIsActive
            ? 'Produto não liberado para o perfil ativo.'
            : 'Perfil ou vínculo institucional pendente.'
      }

      return {
        ...product,
        enabled,
        unavailableReason,
      }
    },
  )
}

function getErrorStatus(
  error: unknown,
): number {
  if (
    !(error instanceof Error)
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
      'não autorizado',
    ) ||
    message.includes(
      'unauthorized',
    )
  ) {
    return 401
  }

  if (
    message.includes(
      'sem permissão',
    ) ||
    message.includes(
      'proibido',
    ) ||
    message.includes(
      'forbidden',
    )
  ) {
    return 403
  }

  return 500
}

export async function GET(
  request: NextRequest,
) {
  try {
    const user =
      await requireSessionUser()

    const client =
      createPortalClient()

    const requestedContext = {
      organizationId:
        normalizeOptionalText(
          request.nextUrl
            .searchParams
            .get(
              'organizationId',
            ),
        ),

      schoolId:
        normalizeOptionalText(
          request.nextUrl
            .searchParams
            .get(
              'schoolId',
            ),
        ),

      role:
        normalizeRole(
          request.nextUrl
            .searchParams
            .get('role'),
        ),
    }

    const hasContextRequest =
      Boolean(
        requestedContext
          .organizationId ||
        requestedContext
          .schoolId ||
        requestedContext
          .role,
      )

    const [
      profileResult,
      identityUserResult,
      membershipsResult,
    ] = await Promise.all([
      client
        .from(
          'user_profiles',
        )
        .select(
          [
            'role',
            'status',
            'display_name',
          ].join(','),
        )
        .eq(
          'user_id',
          user.id,
        )
        .maybeSingle(),

      client
        .from('users')
        .select(
          [
            'id',
            'full_name',
            'role',
            'profile_status',
            'onboarding_completed',
            'active_organization_id',
            'active_school_id',
          ].join(','),
        )
        .eq(
          'id',
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
            'onboarding_completed',
            'access_starts_at',
            'access_ends_at',
          ].join(','),
        )
        .eq(
          'user_id',
          user.id,
        )
        .order(
          'hierarchy_level',
          {
            ascending:
              false,
          },
        ),
    ])

    if (
      profileResult.error
    ) {
      throw new Error(
        `Erro ao consultar perfil: ${profileResult.error.message}`,
      )
    }

    if (
      identityUserResult.error
    ) {
      throw new Error(
        `Erro ao consultar identidade: ${identityUserResult.error.message}`,
      )
    }

    if (
      membershipsResult.error
    ) {
      throw new Error(
        `Erro ao consultar vínculos institucionais: ${membershipsResult.error.message}`,
      )
    }

    const profile =
      profileResult.data as
        | PortalProfile
        | null

    const identityUser =
      identityUserResult.data as
        | IdentityUser
        | null

    const allMemberships =
      (
        membershipsResult.data ??
        []
      ) as PortalMembership[]

    const activeMemberships =
      allMemberships.filter(
        isMembershipValid,
      )

    const organizationIds = [
      ...new Set(
        activeMemberships.map(
          (membership) =>
            membership
              .organization_id,
        ),
      ),
    ]

    const schoolIds = [
      ...new Set(
        activeMemberships
          .map(
            (membership) =>
              membership.school_id,
          )
          .filter(
            (
              schoolId,
            ): schoolId is string =>
              Boolean(schoolId),
          ),
      ),
    ]

    const organizations =
      new Map<
        string,
        PortalOrganization
      >()

    const schools =
      new Map<
        string,
        PortalSchool
      >()

    if (
      organizationIds.length >
      0
    ) {
      const {
        data,
        error,
      } = await client
        .from(
          'organizations',
        )
        .select(
          'id, name',
        )
        .in(
          'id',
          organizationIds,
        )

      if (error) {
        throw new Error(
          `Erro ao consultar instituições: ${error.message}`,
        )
      }

      for (
        const organization of
        (
          data ?? []
        ) as PortalOrganization[]
      ) {
        organizations.set(
          organization.id,
          organization,
        )
      }
    }

    if (
      schoolIds.length > 0
    ) {
      const {
        data,
        error,
      } = await client
        .from('schools')
        .select(
          [
            'id',
            'organization_id',
            'name',
            'short_name',
            'city',
            'state',
          ].join(','),
        )
        .in(
          'id',
          schoolIds,
        )

      if (error) {
        throw new Error(
          `Erro ao consultar escolas: ${error.message}`,
        )
      }

      for (
        const school of
        (
          data ?? []
        ) as PortalSchool[]
      ) {
        schools.set(
          school.id,
          school,
        )
      }
    }

    const profileStatus =
      (
        profile?.status ??
        identityUser
          ?.profile_status ??
        'pending'
      )
        .trim()
        .toLowerCase()

    const onboardingCompleted =
      Boolean(
        identityUser
          ?.onboarding_completed ??
        false,
      )

    const registeredRole =
      normalizeRole(
        profile?.role ??
        identityUser?.role,
      )

    const notices:
      PortalNotice[] = []

    const contexts:
      AuthorizedContext[] =
        activeMemberships.map(
          (membership) =>
            createCorporateContext(
              membership,
              organizations,
              schools,
            ),
        )

    const hasPlatformAccess =
      Boolean(
        registeredRole &&
        PLATFORM_ROLES.has(
          registeredRole,
        ) &&
        isActiveStatus(
          profileStatus,
        ),
      )

    if (
      hasPlatformAccess &&
      registeredRole
    ) {
      contexts.unshift(
        createPlatformContext(
          user.id,
          registeredRole,
          profileStatus,
          onboardingCompleted,
        ),
      )
    }

    if (
      contexts.length === 0
    ) {
      let individualRole =
        registeredRole ??
        'teacher'

      if (
        !INDIVIDUAL_ROLES.has(
          individualRole,
        )
      ) {
        notices.push({
          level:
            'warning',

          code:
            'INSTITUTIONAL_ROLE_WITHOUT_MEMBERSHIP',

          title:
            'Perfil institucional não autorizado',

          message:
            'O perfil informado depende de um vínculo institucional ativo. Acesso mantido como usuário individual.',
        })

        individualRole =
          'teacher'
      }

      contexts.push(
        createIndividualContext(
          user.id,
          individualRole,
          profileStatus,
          onboardingCompleted,
        ),
      )
    }

    let activeContext =
      selectPreferredContext(
        contexts,
        identityUser,
      )

    if (
      hasContextRequest
    ) {
      const requested =
        contexts.find(
          (context) =>
            contextMatchesRequest(
              context,
              requestedContext,
            ),
        )

      if (requested) {
        activeContext =
          requested
      } else {
        notices.push({
          level:
            'error',

          code:
            'UNAUTHORIZED_CONTEXT',

          title:
            'Acesso não autorizado',

          message:
            'Você não possui cadastro ativo para o perfil, instituição ou unidade solicitada.',
        })
      }
    }

    if (
      allMemberships.length >
        0 &&
      activeMemberships.length ===
        0
    ) {
      notices.push({
        level:
          'warning',

        code:
          'NO_ACTIVE_MEMBERSHIP',

        title:
          'Vínculo institucional inativo',

        message:
          'Existe um cadastro institucional, mas ele está pendente, suspenso, expirado ou ainda não foi aprovado.',
      })
    }

    if (
      !isActiveStatus(
        profileStatus,
      ) &&
      activeContext
        ?.accountType ===
        'individual'
    ) {
      notices.push({
        level:
          'warning',

        code:
          'PROFILE_PENDING',

        title:
          'Perfil pendente',

        message:
          'Conclua ou aguarde a aprovação do cadastro para liberar todos os recursos do plano individual.',
      })
    }

    if (!activeContext) {
      throw new Error(
        'Não foi possível determinar o contexto de acesso.',
      )
    }

    const contextIsActive =
      isActiveStatus(
        activeContext.status,
      )

    const enabledCodes =
      new Set<string>()

    if (
      contextIsActive &&
      activeContext.role
    ) {
      const {
        data,
        error,
      } = await client
        .from(
          'identity_product_permissions',
        )
        .select(
          'product_code, can_access',
        )
        .eq(
          'role_code',
          activeContext.role,
        )
        .eq(
          'can_access',
          true,
        )

      if (error) {
        throw new Error(
          `Erro ao consultar permissões dos produtos: ${error.message}`,
        )
      }

      for (
        const permission of
        (
          data ?? []
        ) as ProductPermissionRow[]
      ) {
        if (
          permission.can_access
        ) {
          enabledCodes.add(
            permission
              .product_code,
          )
        }
      }
    }

    const products =
      createProducts(
        enabledCodes,
        {
          contextIsActive,

          isSuperAdmin:
            activeContext.role ===
            'super_admin',
        },
      )

    const displayName =
      profile
        ?.display_name?.trim() ||
      identityUser
        ?.full_name?.trim() ||
      user.email ||
      'Usuário EduData IA'

    return NextResponse.json(
      {
        success:
          true,

        user: {
          id:
            user.id,

          email:
            user.email ??
            null,

          displayName,

          profileStatus,

          onboardingCompleted,
        },

        accountType:
          activeContext
            .accountType,

        activeContext,

        authorizedContexts:
          contexts,

        onboardingRequired:
          !activeContext
            .onboardingCompleted,

        notices,

        products,
      },
      {
        status:
          200,

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
        success:
          false,

        error:
          message,

        notices:
          [],

        products:
          [],
      },
      {
        status:
          getErrorStatus(
            error,
          ),

        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      },
    )
  }
}