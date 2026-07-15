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

type DatabaseRecord =
  Record<string, unknown>

type PortalMembership = {
  id: string
  organizationId: string
  schoolId: string | null
  role: string
  status: string
  hierarchyLevel: number
  scopeType: string
  onboardingCompleted: boolean
  accessStartsAt: string | null
  accessEndsAt: string | null
}

type PortalNotice = {
  level: NoticeLevel
  code: string
  title: string
  message: string
}

type PortalContext = {
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
    vice_diretor_escolar:
      'vice_principal',

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
  new Set<string>([
    'student',
    'teacher',
  ])

const PLATFORM_ROLES =
  new Set<string>([
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

function isRecord(
  value: unknown,
): value is DatabaseRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function asRecords(
  value: unknown,
): DatabaseRecord[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    isRecord,
  )
}

function readString(
  record:
    | DatabaseRecord
    | null
    | undefined,
  keys: string[],
): string | null {
  if (!record) {
    return null
  }

  for (const key of keys) {
    const value = record[key]

    if (
      typeof value === 'string' &&
      value.trim()
    ) {
      return value.trim()
    }
  }

  return null
}

function readBoolean(
  record:
    | DatabaseRecord
    | null,
  keys: string[],
  fallback = false,
): boolean {
  if (!record) {
    return fallback
  }

  for (const key of keys) {
    const value = record[key]

    if (
      typeof value === 'boolean'
    ) {
      return value
    }
  }

  return fallback
}

function readNumber(
  record:
    | DatabaseRecord
    | null,
  keys: string[],
  fallback = 0,
): number {
  if (!record) {
    return fallback
  }

  for (const key of keys) {
    const value = record[key]

    if (
      typeof value === 'number' &&
      Number.isFinite(value)
    ) {
      return value
    }

    if (
      typeof value === 'string' &&
      value.trim()
    ) {
      const parsed =
        Number(value)

      if (
        Number.isFinite(parsed)
      ) {
        return parsed
      }
    }
  }

  return fallback
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
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )
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
  status:
    | string
    | null
    | undefined,
): boolean {
  return (
    status
      ?.trim()
      .toLowerCase() ===
    'active'
  )
}

function parseMembership(
  record: DatabaseRecord,
): PortalMembership | null {
  const id =
    readString(
      record,
      ['id'],
    )

  const organizationId =
    readString(
      record,
      ['organization_id'],
    )

  const role =
    normalizeRole(
      readString(
        record,
        ['role'],
      ),
    )

  if (
    !id ||
    !organizationId ||
    !role
  ) {
    return null
  }

  return {
    id,

    organizationId,

    schoolId:
      readString(
        record,
        ['school_id'],
      ),

    role,

    status:
      readString(
        record,
        ['status'],
      ) ?? 'pending',

    hierarchyLevel:
      readNumber(
        record,
        ['hierarchy_level'],
        10,
      ),

    scopeType:
      readString(
        record,
        ['scope_type'],
      ) ?? 'self',

    onboardingCompleted:
      readBoolean(
        record,
        ['onboarding_completed'],
        false,
      ),

    accessStartsAt:
      readString(
        record,
        ['access_starts_at'],
      ),

    accessEndsAt:
      readString(
        record,
        ['access_ends_at'],
      ),
  }
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
    membership.accessStartsAt
  ) {
    const startsAt =
      new Date(
        membership.accessStartsAt,
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
    membership.accessEndsAt
  ) {
    const endsAt =
      new Date(
        membership.accessEndsAt,
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

function getOrganizationName(
  record:
    | DatabaseRecord
    | undefined,
): string {
  return (
    readString(
      record,
      [
        'name',
        'display_name',
        'legal_name',
        'organization_name',
      ],
    ) ??
    'Instituição não identificada'
  )
}

function createCorporateContext(
  membership:
    PortalMembership,

  organizations:
    Map<
      string,
      DatabaseRecord
    >,

  schools:
    Map<
      string,
      DatabaseRecord
    >,
): PortalContext {
  const organization =
    organizations.get(
      membership.organizationId,
    )

  const school =
    membership.schoolId
      ? schools.get(
          membership.schoolId,
        )
      : undefined

  const schoolName =
    readString(
      school,
      [
        'name',
        'school_name',
        'display_name',
      ],
    )

  return {
    id:
      membership.id,

    accountType:
      'corporate',

    organization: {
      id:
        membership.organizationId,

      name:
        getOrganizationName(
          organization,
        ),
    },

    school:
      membership.schoolId &&
      schoolName
        ? {
            id:
              membership.schoolId,

            name:
              schoolName,

            shortName:
              readString(
                school,
                [
                  'short_name',
                  'abbreviation',
                ],
              ),

            city:
              readString(
                school,
                ['city'],
              ),

            state:
              readString(
                school,
                ['state'],
              ),
          }
        : null,

    role:
      membership.role,

    roleLabel:
      getRoleLabel(
        membership.role,
      ),

    hierarchyLevel:
      membership.hierarchyLevel,

    scopeType:
      membership.scopeType,

    status:
      membership.status,

    onboardingCompleted:
      membership.onboardingCompleted,
  }
}

function createIndividualContext(
  userId: string,
  role: string,
  status: string,
  onboardingCompleted: boolean,
): PortalContext {
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
): PortalContext {
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
    PortalContext,

  requestedContext: {
    organizationId:
      string | null

    schoolId:
      string | null

    role:
      string | null
  },
): boolean {
  if (
    requestedContext
      .organizationId &&
    context.organization?.id !==
      requestedContext
        .organizationId
  ) {
    return false
  }

  if (
    requestedContext.schoolId &&
    context.school?.id !==
      requestedContext.schoolId
  ) {
    return false
  }

  if (
    requestedContext.role &&
    context.role !==
      requestedContext.role
  ) {
    return false
  }

  return true
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
          options.contextIsActive &&
          (
            options.isSuperAdmin ||
            enabledCodes.has(
              product.code,
            )
          )
        )

      return {
        ...product,

        enabled,

        unavailableReason:
          enabled
            ? null
            : options.contextIsActive
              ? 'Produto não liberado para o perfil ativo.'
              : 'Perfil ou vínculo institucional pendente.',
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
      membershipsResult,
    ] = await Promise.all([
      client
        .from(
          'user_profiles',
        )
        .select('*')
        .eq(
          'user_id',
          user.id,
        )
        .maybeSingle(),

      client
        .from(
          'organization_members',
        )
        .select('*')
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
      membershipsResult.error
    ) {
      throw new Error(
        `Erro ao consultar vínculos: ${membershipsResult.error.message}`,
      )
    }

    const profile =
      isRecord(
        profileResult.data,
      )
        ? profileResult.data
        : null

    const allMemberships =
      asRecords(
        membershipsResult.data,
      )
        .map(
          parseMembership,
        )
        .filter(
          (
            membership,
          ): membership is PortalMembership =>
            membership !== null,
        )

    const activeMemberships =
      allMemberships.filter(
        isMembershipValid,
      )

    const organizationIds = [
      ...new Set(
        activeMemberships.map(
          (membership) =>
            membership
              .organizationId,
        ),
      ),
    ]

    const schoolIds = [
      ...new Set(
        activeMemberships
          .map(
            (membership) =>
              membership.schoolId,
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
        DatabaseRecord
      >()

    const schools =
      new Map<
        string,
        DatabaseRecord
      >()

    if (
      organizationIds.length > 0
    ) {
      const {
        data,
        error,
      } = await client
        .from(
          'organizations',
        )
        .select('*')
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
        asRecords(data)
      ) {
        const id =
          readString(
            organization,
            ['id'],
          )

        if (id) {
          organizations.set(
            id,
            organization,
          )
        }
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
        .select('*')
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
        asRecords(data)
      ) {
        const id =
          readString(
            school,
            ['id'],
          )

        if (id) {
          schools.set(
            id,
            school,
          )
        }
      }
    }

    const registeredRole =
      normalizeRole(
        readString(
          profile,
          [
            'role',
            'requested_role',
          ],
        ),
      )

    const profileStatus =
      (
        readString(
          profile,
          [
            'status',
            'profile_status',
          ],
        ) ??
        (
          profile
            ? 'active'
            : 'pending'
        )
      )
        .trim()
        .toLowerCase()

    const onboardingCompleted =
      readBoolean(
        profile,
        [
          'onboarding_completed',
        ],
        false,
      )

    const notices:
      PortalNotice[] = []

    const contexts:
      PortalContext[] =
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
            'O perfil informado exige vínculo institucional ativo. O acesso foi mantido como usuário individual.',
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
      contexts[0] ?? null

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
      allMemberships.length > 0 &&
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

    if (!activeContext) {
      throw new Error(
        'Contexto de acesso não identificado.',
      )
    }

    const contextIsActive =
      isActiveStatus(
        activeContext.status,
      )

    const enabledCodes =
      new Set<string>()

    if (
      contextIsActive
    ) {
      const {
        data,
        error,
      } = await client
        .from(
          'identity_product_permissions',
        )
        .select('*')
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
          `Erro ao consultar permissões: ${error.message}`,
        )
      }

      for (
        const permission of
        asRecords(data)
      ) {
        const productCode =
          readString(
            permission,
            ['product_code'],
          )

        const canAccess =
          readBoolean(
            permission,
            ['can_access'],
            false,
          )

        if (
          productCode &&
          canAccess
        ) {
          enabledCodes.add(
            productCode,
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

    const metadataName =
      typeof user
        .user_metadata
        ?.full_name ===
        'string'
        ? user
            .user_metadata
            .full_name
            .trim()
        : null

    const displayName =
      readString(
        profile,
        [
          'display_name',
          'full_name',
          'name',
        ],
      ) ??
      metadataName ??
      user.email ??
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

    const status =
      getErrorStatus(error)

    const message =
      status === 401
        ? 'Usuário não autenticado.'
        : status === 403
          ? 'Você não possui permissão para acessar este ambiente.'
          : 'Não foi possível carregar o contexto de acesso. Tente novamente.'

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
        status,

        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      },
    )
  }
}