import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import type {
  AdministrativeType,
  CreateSchoolDto,
  EducationNetwork,
  SchoolDto,
  SchoolStatus,
  UpdateSchoolDto,
} from './school.dto'

type DatabaseRecord =
  Record<string, unknown>

const SCHOOL_SELECT = [
  'id',
  'organization_id',
  'inep_code',
  'name',
  'short_name',
  'education_network',
  'administrative_type',
  'principal_name',
  'email',
  'phone',
  'website',
  'postal_code',
  'address',
  'number',
  'complement',
  'district',
  'city',
  'state',
  'country',
  'status',
  'created_at',
  'updated_at',
].join(',')

const SCHOOL_STATUSES:
  SchoolStatus[] = [
    'active',
    'inactive',
    'pending',
    'suspended',
    'archived',
  ]

const EDUCATION_NETWORKS:
  EducationNetwork[] = [
    'municipal',
    'state',
    'federal',
    'private',
    'community',
    'other',
  ]

const ADMINISTRATIVE_TYPES:
  AdministrativeType[] = [
    'public',
    'private',
    'philanthropic',
    'community',
    'other',
  ]

function createSchoolClient():
  SupabaseClient {
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

function isRecord(
  value: unknown,
): value is DatabaseRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function readRequiredString(
  record: DatabaseRecord,
  key: string,
): string {
  const value = record[key]

  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new Error(
      `Campo obrigatório ausente na escola: ${key}.`,
    )
  }

  return value.trim()
}

function readOptionalString(
  record: DatabaseRecord,
  key: string,
): string | null {
  const value = record[key]

  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    return null
  }

  return value.trim()
}

function readSchoolStatus(
  record: DatabaseRecord,
): SchoolStatus {
  const value = record.status

  if (
    typeof value !== 'string' ||
    !SCHOOL_STATUSES.includes(
      value as SchoolStatus,
    )
  ) {
    throw new Error(
      'Status inválido retornado para a escola.',
    )
  }

  return value as SchoolStatus
}

function readEducationNetwork(
  record: DatabaseRecord,
): EducationNetwork {
  const value =
    record.education_network

  if (
    typeof value !== 'string' ||
    !EDUCATION_NETWORKS.includes(
      value as EducationNetwork,
    )
  ) {
    throw new Error(
      'Rede de ensino inválida retornada para a escola.',
    )
  }

  return value as EducationNetwork
}

function readAdministrativeType(
  record: DatabaseRecord,
): AdministrativeType {
  const value =
    record.administrative_type

  if (
    typeof value !== 'string' ||
    !ADMINISTRATIVE_TYPES.includes(
      value as AdministrativeType,
    )
  ) {
    throw new Error(
      'Tipo administrativo inválido retornado para a escola.',
    )
  }

  return value as AdministrativeType
}

function parseSchool(
  value: unknown,
): SchoolDto | null {
  if (!isRecord(value)) {
    return null
  }

  return {
    id:
      readRequiredString(
        value,
        'id',
      ),

    organization_id:
      readRequiredString(
        value,
        'organization_id',
      ),

    inep_code:
      readOptionalString(
        value,
        'inep_code',
      ),

    name:
      readRequiredString(
        value,
        'name',
      ),

    short_name:
      readOptionalString(
        value,
        'short_name',
      ),

    education_network:
      readEducationNetwork(value),

    administrative_type:
      readAdministrativeType(value),

    principal_name:
      readOptionalString(
        value,
        'principal_name',
      ),

    email:
      readOptionalString(
        value,
        'email',
      ),

    phone:
      readOptionalString(
        value,
        'phone',
      ),

    website:
      readOptionalString(
        value,
        'website',
      ),

    postal_code:
      readOptionalString(
        value,
        'postal_code',
      ),

    address:
      readOptionalString(
        value,
        'address',
      ),

    number:
      readOptionalString(
        value,
        'number',
      ),

    complement:
      readOptionalString(
        value,
        'complement',
      ),

    district:
      readOptionalString(
        value,
        'district',
      ),

    city:
      readOptionalString(
        value,
        'city',
      ),

    state:
      readOptionalString(
        value,
        'state',
      ),

    country:
      readRequiredString(
        value,
        'country',
      ),

    status:
      readSchoolStatus(value),

    created_at:
      readRequiredString(
        value,
        'created_at',
      ),

    updated_at:
      readRequiredString(
        value,
        'updated_at',
      ),
  }
}

function parseSchoolList(
  value: unknown,
): SchoolDto[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map(
    (item, index) => {
      const school =
        parseSchool(item)

      if (!school) {
        throw new Error(
          `Escola inválida retornada na posição ${index}.`,
        )
      }

      return school
    },
  )
}

function normalizeNullableText(
  value: string | undefined,
): string | null {
  if (
    value === undefined ||
    !value.trim()
  ) {
    return null
  }

  return value.trim()
}

function hasOwnField(
  value: object,
  key: string,
): boolean {
  return Object.prototype.hasOwnProperty.call(
    value,
    key,
  )
}

class SchoolRepository {
  private get client(): SupabaseClient {
    return createSchoolClient()
  }

  async findAll():
    Promise<SchoolDto[]> {
    const { data, error } =
      await this.client
        .from('schools')
        .select(SCHOOL_SELECT)
        .order('name', {
          ascending: true,
        })

    if (error) {
      throw new Error(
        `Erro ao listar escolas: ${error.message}`,
      )
    }

    return parseSchoolList(data)
  }

  async findByOrganizationId(
    organizationId: string,
  ): Promise<SchoolDto[]> {
    const { data, error } =
      await this.client
        .from('schools')
        .select(SCHOOL_SELECT)
        .eq(
          'organization_id',
          organizationId,
        )
        .order('name', {
          ascending: true,
        })

    if (error) {
      throw new Error(
        `Erro ao listar escolas da organização: ${error.message}`,
      )
    }

    return parseSchoolList(data)
  }

  async findById(
    schoolId: string,
  ): Promise<SchoolDto | null> {
    const { data, error } =
      await this.client
        .from('schools')
        .select(SCHOOL_SELECT)
        .eq('id', schoolId)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao consultar escola: ${error.message}`,
      )
    }

    return parseSchool(data)
  }

  async findByInepCode(
    inepCode: string,
  ): Promise<SchoolDto | null> {
    const { data, error } =
      await this.client
        .from('schools')
        .select(SCHOOL_SELECT)
        .eq('inep_code', inepCode)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao consultar escola pelo INEP: ${error.message}`,
      )
    }

    return parseSchool(data)
  }

  async create(
    input: CreateSchoolDto,
  ): Promise<SchoolDto> {
    const payload: DatabaseRecord = {
      organization_id:
        input.organization_id,

      inep_code:
        normalizeNullableText(
          input.inep_code,
        ),

      name:
        input.name,

      short_name:
        normalizeNullableText(
          input.short_name,
        ),

      education_network:
        input.education_network,

      administrative_type:
        input.administrative_type,

      principal_name:
        normalizeNullableText(
          input.principal_name,
        ),

      email:
        normalizeNullableText(
          input.email,
        ),

      phone:
        normalizeNullableText(
          input.phone,
        ),

      website:
        normalizeNullableText(
          input.website,
        ),

      postal_code:
        normalizeNullableText(
          input.postal_code,
        ),

      address:
        normalizeNullableText(
          input.address,
        ),

      number:
        normalizeNullableText(
          input.number,
        ),

      complement:
        normalizeNullableText(
          input.complement,
        ),

      district:
        normalizeNullableText(
          input.district,
        ),

      city:
        normalizeNullableText(
          input.city,
        ),

      state:
        normalizeNullableText(
          input.state,
        ),

      country:
        input.country?.trim() ||
        'Brasil',

      status:
        input.status ||
        'active',
    }

    const { data, error } =
      await this.client
        .from('schools')
        .insert(payload)
        .select(SCHOOL_SELECT)
        .single()

    if (error) {
      throw new Error(
        `Erro ao criar escola: ${error.message}`,
      )
    }

    const school =
      parseSchool(data)

    if (!school) {
      throw new Error(
        'A escola foi criada, mas os dados retornados são inválidos.',
      )
    }

    return school
  }

  async updateById(
    schoolId: string,
    input: UpdateSchoolDto,
  ): Promise<SchoolDto> {
    const payload: DatabaseRecord = {}

    if (
      hasOwnField(
        input,
        'organization_id',
      )
    ) {
      payload.organization_id =
        input.organization_id
    }

    if (
      hasOwnField(input, 'name')
    ) {
      payload.name =
        input.name
    }

    if (
      hasOwnField(
        input,
        'inep_code',
      )
    ) {
      payload.inep_code =
        normalizeNullableText(
          input.inep_code,
        )
    }

    if (
      hasOwnField(
        input,
        'short_name',
      )
    ) {
      payload.short_name =
        normalizeNullableText(
          input.short_name,
        )
    }

    if (
      hasOwnField(
        input,
        'education_network',
      )
    ) {
      payload.education_network =
        input.education_network
    }

    if (
      hasOwnField(
        input,
        'administrative_type',
      )
    ) {
      payload.administrative_type =
        input.administrative_type
    }

    if (
      hasOwnField(
        input,
        'principal_name',
      )
    ) {
      payload.principal_name =
        normalizeNullableText(
          input.principal_name,
        )
    }

    if (
      hasOwnField(input, 'email')
    ) {
      payload.email =
        normalizeNullableText(
          input.email,
        )
    }

    if (
      hasOwnField(input, 'phone')
    ) {
      payload.phone =
        normalizeNullableText(
          input.phone,
        )
    }

    if (
      hasOwnField(input, 'website')
    ) {
      payload.website =
        normalizeNullableText(
          input.website,
        )
    }

    if (
      hasOwnField(
        input,
        'postal_code',
      )
    ) {
      payload.postal_code =
        normalizeNullableText(
          input.postal_code,
        )
    }

    if (
      hasOwnField(input, 'address')
    ) {
      payload.address =
        normalizeNullableText(
          input.address,
        )
    }

    if (
      hasOwnField(input, 'number')
    ) {
      payload.number =
        normalizeNullableText(
          input.number,
        )
    }

    if (
      hasOwnField(
        input,
        'complement',
      )
    ) {
      payload.complement =
        normalizeNullableText(
          input.complement,
        )
    }

    if (
      hasOwnField(input, 'district')
    ) {
      payload.district =
        normalizeNullableText(
          input.district,
        )
    }

    if (
      hasOwnField(input, 'city')
    ) {
      payload.city =
        normalizeNullableText(
          input.city,
        )
    }

    if (
      hasOwnField(input, 'state')
    ) {
      payload.state =
        normalizeNullableText(
          input.state,
        )
    }

    if (
      hasOwnField(input, 'country')
    ) {
      payload.country =
        input.country?.trim() ||
        'Brasil'
    }

    if (
      hasOwnField(input, 'status')
    ) {
      payload.status =
        input.status
    }

    const { data, error } =
      await this.client
        .from('schools')
        .update(payload)
        .eq('id', schoolId)
        .select(SCHOOL_SELECT)
        .single()

    if (error) {
      throw new Error(
        `Erro ao atualizar escola: ${error.message}`,
      )
    }

    const school =
      parseSchool(data)

    if (!school) {
      throw new Error(
        'A escola foi atualizada, mas os dados retornados são inválidos.',
      )
    }

    return school
  }

  async archiveById(
    schoolId: string,
  ): Promise<SchoolDto> {
    const { data, error } =
      await this.client
        .from('schools')
        .update({
          status: 'archived',
        })
        .eq('id', schoolId)
        .select(SCHOOL_SELECT)
        .single()

    if (error) {
      throw new Error(
        `Erro ao arquivar escola: ${error.message}`,
      )
    }

    const school =
      parseSchool(data)

    if (!school) {
      throw new Error(
        'A escola foi arquivada, mas os dados retornados são inválidos.',
      )
    }

    return school
  }
}

export const schoolRepository =
  new SchoolRepository()