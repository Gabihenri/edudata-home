import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  requireSessionUser,
} from '@/lib/auth/session'

export const dynamic =
  'force-dynamic'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const PLATFORM_ROLES =
  new Set([
    'platform_admin',
    'super_admin',
  ])

const MANAGER_ROLES =
  new Set([
    'platform_admin',
    'super_admin',
    'institution_admin',
    'regional_manager',
    'supervisor',
    'principal',
    'vice_principal',
  ])

const ROLE_ALIASES:
  Record<string, string> = {
    admin:
      'platform_admin',

    platform_admin:
      'platform_admin',

    super_admin:
      'super_admin',

    superadmin:
      'super_admin',

    superadministrador:
      'super_admin',

    institution_admin:
      'institution_admin',

    institutional_admin:
      'institution_admin',

    admin_institucional:
      'institution_admin',

    administrador_institucional:
      'institution_admin',

    regional_manager:
      'regional_manager',

    gestor_regional:
      'regional_manager',

    supervisor:
      'supervisor',

    principal:
      'principal',

    director:
      'principal',

    diretor:
      'principal',

    vice_principal:
      'vice_principal',

    vice_director:
      'vice_principal',

    vice_diretor:
      'vice_principal',

    coordinator:
      'coordinator',

    coordenador:
      'coordinator',

    teacher:
      'teacher',

    professor:
      'teacher',

    student:
      'student',

    aluno:
      'student',
  }

const ROLE_LABELS:
  Record<string, string> = {
    platform_admin:
      'Administrador da Plataforma',

    super_admin:
      'Superadministrador EduData IA',

    institution_admin:
      'Administrador Institucional',

    regional_manager:
      'Gestor Regional',

    supervisor:
      'Supervisor',

    principal:
      'Diretor',

    vice_principal:
      'Vice-diretor',

    coordinator:
      'Coordenador',

    teacher:
      'Professor',

    student:
      'Estudante',
  }

type DatabaseRecord =
  Record<string, unknown>

type Membership = {
  id: string

  organizationId: string
  schoolId: string | null

  role: string
  status: string

  hierarchyLevel: number
  scopeType: string

  accessStartsAt: string | null
  accessEndsAt: string | null
}

type OrganizationOption = {
  id: string
  name: string
}

type SchoolOption = {
  id: string

  organizationId: string

  name: string
  shortName: string | null

  city: string | null
  state: string | null

  status: string
}

type CalendarContext = {
  id: string

  organization: {
    id: string
    name: string
  }

  school: {
    id: string
    name: string
    shortName: string | null
    city: string | null
    state: string | null
  }

  role: string
  roleLabel: string

  hierarchyLevel: number
  scopeType: string

  canManage: boolean
}

function createAdminClient():
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
    typeof value ===
      'object' &&
    value !== null &&
    !Array.isArray(
      value,
    )
  )
}

function asRecords(
  value: unknown,
): DatabaseRecord[] {
  if (
    !Array.isArray(
      value,
    )
  ) {
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

  for (
    const key of keys
  ) {
    const value =
      record[key]

    if (
      typeof value ===
        'string' &&
      value.trim()
    ) {
      return value.trim()
    }
  }

  return null
}

function readNumber(
  record:
    | DatabaseRecord
    | null
    | undefined,

  keys: string[],

  fallback: number,
): number {
  if (!record) {
    return fallback
  }

  for (
    const key of keys
  ) {
    const value =
      record[key]

    if (
      typeof value ===
        'number' &&
      Number.isFinite(
        value,
      )
    ) {
      return value
    }

    if (
      typeof value ===
        'string' &&
      value.trim()
    ) {
      const parsedValue =
        Number(
          value,
        )

      if (
        Number.isFinite(
          parsedValue,
        )
      ) {
        return parsedValue
      }
    }
  }

  return fallback
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
      .normalize(
        'NFD',
      )
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
      .split('_')
      .filter(Boolean)
      .map(
        part =>
          part
            .charAt(0)
            .toUpperCase() +
          part.slice(1),
      )
      .join(' ')
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

function isMembershipActive(
  membership:
    Membership,
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
      .accessStartsAt
  ) {
    const startsAt =
      new Date(
        membership
          .accessStartsAt,
      ).getTime()

    if (
      Number.isFinite(
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
        membership
          .accessEndsAt,
      ).getTime()

    if (
      Number.isFinite(
        endsAt,
      ) &&
      endsAt < now
    ) {
      return false
    }
  }

  return true
}

function parseMembership(
  record:
    DatabaseRecord,
): Membership | null {
  const id =
    readString(
      record,
      ['id'],
    )

  const organizationId =
    readString(
      record,
      [
        'organization_id',
      ],
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
      ) ??
      'pending',

    hierarchyLevel:
      readNumber(
        record,
        [
          'hierarchy_level',
        ],
        10,
      ),

    scopeType:
      readString(
        record,
        ['scope_type'],
      ) ??
      'self',

    accessStartsAt:
      readString(
        record,
        [
          'access_starts_at',
        ],
      ),

    accessEndsAt:
      readString(
        record,
        [
          'access_ends_at',
        ],
      ),
  }
}

function parseOrganization(
  record:
    DatabaseRecord,
): OrganizationOption | null {
  const id =
    readString(
      record,
      ['id'],
    )

  const name =
    readString(
      record,
      ['name'],
    )

  if (
    !id ||
    !name
  ) {
    return null
  }

  return {
    id,
    name,
  }
}

function parseSchool(
  record:
    DatabaseRecord,
): SchoolOption | null {
  const id =
    readString(
      record,
      ['id'],
    )

  const organizationId =
    readString(
      record,
      [
        'organization_id',
      ],
    )

  const name =
    readString(
      record,
      ['name'],
    )

  if (
    !id ||
    !organizationId ||
    !name
  ) {
    return null
  }

  return {
    id,

    organizationId,

    name,

    shortName:
      readString(
        record,
        ['short_name'],
      ),

    city:
      readString(
        record,
        ['city'],
      ),

    state:
      readString(
        record,
        ['state'],
      ),

    status:
      readString(
        record,
        ['status'],
      ) ??
      'active',
  }
}

function normalizeOptionalUuid(
  value:
    | string
    | null,
  fieldName: string,
): string | null {
  const normalizedValue =
    value?.trim() ??
    ''

  if (!normalizedValue) {
    return null
  }

  if (
    !UUID_PATTERN.test(
      normalizedValue,
    )
  ) {
    throw new Error(
      `${fieldName} possui formato inválido.`,
    )
  }

  return normalizedValue
}

function normalizeSearch(
  value:
    | string
    | null,
): string | null {
  const normalizedValue =
    value
      ?.trim()
      .replace(
        /\s+/g,
        ' ',
      ) ??
    ''

  if (!normalizedValue) {
    return null
  }

  if (
    normalizedValue.length >
    120
  ) {
    throw new Error(
      'A busca não pode ultrapassar 120 caracteres.',
    )
  }

  return normalizedValue
}

function normalizeLimit(
  value:
    | string
    | null,
): number {
  if (!value) {
    return 50
  }

  const parsedValue =
    Number(
      value,
    )

  if (
    !Number.isInteger(
      parsedValue,
    ) ||
    parsedValue < 1 ||
    parsedValue > 100
  ) {
    throw new Error(
      'O limite deve estar entre 1 e 100.',
    )
  }

  return parsedValue
}

function getMembershipForSchool(
  memberships:
    Membership[],

  school:
    SchoolOption,
): Membership | null {
  const schoolMembership =
    memberships
      .filter(
        membership =>
          membership
            .schoolId ===
          school.id,
      )
      .sort(
        (
          firstMembership,
          secondMembership,
        ) =>
          secondMembership
            .hierarchyLevel -
          firstMembership
            .hierarchyLevel,
      )[0]

  if (schoolMembership) {
    return schoolMembership
  }

  return (
    memberships
      .filter(
        membership =>
          membership
            .organizationId ===
            school
              .organizationId &&
          membership
            .schoolId ===
            null,
      )
      .sort(
        (
          firstMembership,
          secondMembership,
        ) =>
          secondMembership
            .hierarchyLevel -
          firstMembership
            .hierarchyLevel,
      )[0] ??
    null
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
      'não autorizado',
    ) ||
    message.includes(
      'forbidden',
    )
  ) {
    return 403
  }

  if (
    message.includes(
      'inválido',
    ) ||
    message.includes(
      'inválida',
    ) ||
    message.includes(
      'deve estar',
    ) ||
    message.includes(
      'não pode',
    )
  ) {
    return 400
  }

  return 500
}

function createErrorResponse(
  error: unknown,
) {
  const status =
    getErrorStatus(
      error,
    )

  const message =
    error instanceof Error
      ? error.message
      : 'Não foi possível carregar os contextos institucionais.'

  return NextResponse.json(
    {
      success: false,
      error: message,
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

    const client =
      createAdminClient()

    const organizationIdFilter =
      normalizeOptionalUuid(
        request.nextUrl
          .searchParams
          .get(
            'organizationId',
          ),
        'Organização',
      )

    const search =
      normalizeSearch(
        request.nextUrl
          .searchParams
          .get(
            'q',
          ),
      )

    const limit =
      normalizeLimit(
        request.nextUrl
          .searchParams
          .get(
            'limit',
          ),
      )

    const {
      data:
        profileData,

      error:
        profileError,
    } =
      await client
        .from(
          'user_profiles',
        )
        .select('*')
        .eq(
          'user_id',
          user.id,
        )
        .maybeSingle()

    if (profileError) {
      throw new Error(
        `Erro ao consultar o perfil: ${profileError.message}`,
      )
    }

    const profile =
      isRecord(
        profileData,
      )
        ? profileData
        : null

    const profileRole =
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

    const isPlatformAdmin =
      Boolean(
        profileRole &&
        PLATFORM_ROLES.has(
          profileRole,
        ) &&
        isActiveStatus(
          profileStatus,
        ),
      )

    const {
      data:
        membershipData,

      error:
        membershipError,
    } =
      await client
        .from(
          'organization_members',
        )
        .select('*')
        .eq(
          'user_id',
          user.id,
        )

    if (membershipError) {
      throw new Error(
        `Erro ao consultar vínculos institucionais: ${membershipError.message}`,
      )
    }

    const memberships =
      asRecords(
        membershipData,
      )
        .map(
          parseMembership,
        )
        .filter(
          (
            membership,
          ): membership is Membership =>
            membership !==
              null &&
            isMembershipActive(
              membership,
            ),
        )

    const permittedOrganizationIds =
      Array.from(
        new Set(
          memberships.map(
            membership =>
              membership
                .organizationId,
          ),
        ),
      )

    if (
      !isPlatformAdmin &&
      permittedOrganizationIds
        .length === 0
    ) {
      return NextResponse.json(
        {
          success: true,

          isPlatformAdmin:
            false,

          total: 0,

          filters: {
            organizationId:
              organizationIdFilter,

            q: search,

            limit,
          },

          organizations: [],

          data: [],
        },
        {
          status: 200,
          headers:
            NO_CACHE_HEADERS,
        },
      )
    }

    if (
      !isPlatformAdmin &&
      organizationIdFilter &&
      !permittedOrganizationIds
        .includes(
          organizationIdFilter,
        )
    ) {
      throw new Error(
        'Organização não autorizada para esta conta.',
      )
    }

    let organizationQuery =
      client
        .from(
          'organizations',
        )
        .select(
          'id,name',
        )
        .order(
          'name',
          {
            ascending:
              true,
          },
        )

    if (
      organizationIdFilter
    ) {
      organizationQuery =
        organizationQuery.eq(
          'id',
          organizationIdFilter,
        )
    } else if (
      !isPlatformAdmin
    ) {
      organizationQuery =
        organizationQuery.in(
          'id',
          permittedOrganizationIds,
        )
    }

    const {
      data:
        organizationData,

      error:
        organizationError,
    } =
      await organizationQuery
        .limit(
          isPlatformAdmin
            ? 500
            : 100,
        )

    if (organizationError) {
      throw new Error(
        `Erro ao consultar organizações: ${organizationError.message}`,
      )
    }

    const organizations =
      asRecords(
        organizationData,
      )
        .map(
          parseOrganization,
        )
        .filter(
          (
            organization,
          ): organization is OrganizationOption =>
            organization !==
            null,
        )

    const organizationMap =
      new Map(
        organizations.map(
          organization => [
            organization.id,
            organization,
          ],
        ),
      )

    let schools:
      SchoolOption[] = []

    if (isPlatformAdmin) {
      let schoolQuery =
        client
          .from(
            'schools',
          )
          .select(`
            id,
            organization_id,
            name,
            short_name,
            city,
            state,
            status
          `)
          .eq(
            'status',
            'active',
          )
          .order(
            'name',
            {
              ascending:
                true,
            },
          )

      if (
        organizationIdFilter
      ) {
        schoolQuery =
          schoolQuery.eq(
            'organization_id',
            organizationIdFilter,
          )
      }

      if (search) {
        schoolQuery =
          schoolQuery.ilike(
            'name',
            `%${search}%`,
          )
      }

      const {
        data:
          schoolData,

        error:
          schoolError,
      } =
        await schoolQuery
          .limit(limit)

      if (schoolError) {
        throw new Error(
          `Erro ao consultar escolas: ${schoolError.message}`,
        )
      }

      schools =
        asRecords(
          schoolData,
        )
          .map(
            parseSchool,
          )
          .filter(
            (
              school,
            ): school is SchoolOption =>
              school !==
              null,
          )
    } else {
      const organizationWideIds =
        Array.from(
          new Set(
            memberships
              .filter(
                membership =>
                  membership
                    .schoolId ===
                  null,
              )
              .map(
                membership =>
                  membership
                    .organizationId,
              )
              .filter(
                organizationId =>
                  !organizationIdFilter ||
                  organizationId ===
                    organizationIdFilter,
              ),
          ),
        )

      const specificSchoolIds =
        Array.from(
          new Set(
            memberships
              .map(
                membership =>
                  membership
                    .schoolId,
              )
              .filter(
                (
                  schoolId,
                ): schoolId is string =>
                  Boolean(
                    schoolId,
                  ),
              ),
          ),
        )

      const collectedSchools =
        new Map<
          string,
          SchoolOption
        >()

      if (
        organizationWideIds
          .length > 0
      ) {
        let organizationSchoolQuery =
          client
            .from(
              'schools',
            )
            .select(`
              id,
              organization_id,
              name,
              short_name,
              city,
              state,
              status
            `)
            .in(
              'organization_id',
              organizationWideIds,
            )
            .eq(
              'status',
              'active',
            )
            .order(
              'name',
              {
                ascending:
                  true,
              },
            )

        if (search) {
          organizationSchoolQuery =
            organizationSchoolQuery
              .ilike(
                'name',
                `%${search}%`,
              )
        }

        const {
          data,
          error,
        } =
          await organizationSchoolQuery
            .limit(limit)

        if (error) {
          throw new Error(
            `Erro ao consultar escolas da organização: ${error.message}`,
          )
        }

        for (
          const record of
          asRecords(data)
        ) {
          const school =
            parseSchool(
              record,
            )

          if (school) {
            collectedSchools.set(
              school.id,
              school,
            )
          }
        }
      }

      if (
        specificSchoolIds
          .length > 0
      ) {
        const {
          data,
          error,
        } =
          await client
            .from(
              'schools',
            )
            .select(`
              id,
              organization_id,
              name,
              short_name,
              city,
              state,
              status
            `)
            .in(
              'id',
              specificSchoolIds,
            )
            .eq(
              'status',
              'active',
            )
            .order(
              'name',
              {
                ascending:
                  true,
              },
            )

        if (error) {
          throw new Error(
            `Erro ao consultar escolas vinculadas: ${error.message}`,
          )
        }

        for (
          const record of
          asRecords(data)
        ) {
          const school =
            parseSchool(
              record,
            )

          if (!school) {
            continue
          }

          if (
            organizationIdFilter &&
            school
              .organizationId !==
              organizationIdFilter
          ) {
            continue
          }

          if (
            search &&
            !school.name
              .toLowerCase()
              .includes(
                search
                  .toLowerCase(),
              )
          ) {
            continue
          }

          collectedSchools.set(
            school.id,
            school,
          )
        }
      }

      schools =
        Array.from(
          collectedSchools
            .values(),
        )
          .sort(
            (
              firstSchool,
              secondSchool,
            ) =>
              firstSchool.name
                .localeCompare(
                  secondSchool
                    .name,
                  'pt-BR',
                ),
          )
          .slice(
            0,
            limit,
          )
    }

    const contexts:
      CalendarContext[] =
        schools
          .map(
            school => {
              const organization =
                organizationMap.get(
                  school
                    .organizationId,
                )

              if (!organization) {
                return null
              }

              const membership =
                isPlatformAdmin
                  ? null
                  : getMembershipForSchool(
                      memberships,
                      school,
                    )

              const role =
                isPlatformAdmin
                  ? profileRole
                  : membership
                      ?.role

              if (!role) {
                return null
              }

              const hierarchyLevel =
                isPlatformAdmin
                  ? role ===
                    'super_admin'
                    ? 100
                    : 90
                  : membership
                      ?.hierarchyLevel ??
                    10

              const scopeType =
                isPlatformAdmin
                  ? 'platform'
                  : membership
                      ?.scopeType ??
                    'school'

              return {
                id:
                  `calendar:${organization.id}:${school.id}:${role}`,

                organization: {
                  id:
                    organization.id,

                  name:
                    organization.name,
                },

                school: {
                  id:
                    school.id,

                  name:
                    school.name,

                  shortName:
                    school.shortName,

                  city:
                    school.city,

                  state:
                    school.state,
                },

                role,

                roleLabel:
                  getRoleLabel(
                    role,
                  ),

                hierarchyLevel,

                scopeType,

                canManage:
                  MANAGER_ROLES.has(
                    role,
                  ),
              }
            },
          )
          .filter(
            (
              context,
            ): context is CalendarContext =>
              context !== null,
          )

    return NextResponse.json(
      {
        success: true,

        isPlatformAdmin,

        total:
          contexts.length,

        filters: {
          organizationId:
            organizationIdFilter,

          q: search,

          limit,
        },

        organizations,

        data:
          contexts,
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[INSTITUTIONAL_CALENDAR_CONTEXTS_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
    )
  }
}