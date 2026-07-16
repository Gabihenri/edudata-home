import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import type {
  SchoolRegistryDto,
  SchoolRegistrySearchItemDto,
  SchoolRegistrySearchQueryDto,
} from './school-registry.dto'

type DatabaseRecord =
  Record<string, unknown>

interface SchoolRegistrySearchData {
  total: number
  data: SchoolRegistrySearchItemDto[]
}

const REGISTRY_SELECT = [
  'id',
  'inep_code',
  'name',
  'state',
  'city',
  'service_restriction',
  'location',
  'differentiated_location',
  'administrative_category',
  'address',
  'phone',
  'administrative_dependency',
  'private_school_category',
  'public_authority_partner',
  'education_council_regulation',
  'school_size',
  'education_stages',
  'other_educational_offerings',
  'latitude',
  'longitude',
  'source_file',
  'imported_at',
  'created_at',
  'updated_at',
].join(',')

const SEARCH_SELECT = [
  'id',
  'inep_code',
  'name',
  'state',
  'city',
  'location',
  'address',
  'phone',
  'administrative_category',
  'administrative_dependency',
  'latitude',
  'longitude',
].join(',')

function createRegistryClient():
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
      `Campo obrigatório ausente no cadastro nacional: ${key}.`,
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

function readOptionalNumber(
  record: DatabaseRecord,
  key: string,
): number | null {
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
    const numericValue =
      Number(value)

    if (
      Number.isFinite(
        numericValue,
      )
    ) {
      return numericValue
    }
  }

  return null
}

function parseRegistryItem(
  value: unknown,
): SchoolRegistrySearchItemDto | null {
  if (!isRecord(value)) {
    return null
  }

  return {
    id:
      readRequiredString(
        value,
        'id',
      ),

    inep_code:
      readRequiredString(
        value,
        'inep_code',
      ),

    name:
      readRequiredString(
        value,
        'name',
      ),

    state:
      readOptionalString(
        value,
        'state',
      ),

    city:
      readOptionalString(
        value,
        'city',
      ),

    location:
      readOptionalString(
        value,
        'location',
      ),

    address:
      readOptionalString(
        value,
        'address',
      ),

    phone:
      readOptionalString(
        value,
        'phone',
      ),

    administrative_category:
      readOptionalString(
        value,
        'administrative_category',
      ),

    administrative_dependency:
      readOptionalString(
        value,
        'administrative_dependency',
      ),

    latitude:
      readOptionalNumber(
        value,
        'latitude',
      ),

    longitude:
      readOptionalNumber(
        value,
        'longitude',
      ),
  }
}

function parseRegistryItemList(
  value: unknown,
): SchoolRegistrySearchItemDto[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map(
    (item, index) => {
      const parsed =
        parseRegistryItem(item)

      if (!parsed) {
        throw new Error(
          `Registro nacional inválido na posição ${index}.`,
        )
      }

      return parsed
    },
  )
}

function parseRegistry(
  value: unknown,
): SchoolRegistryDto | null {
  if (!isRecord(value)) {
    return null
  }

  return {
    id:
      readRequiredString(
        value,
        'id',
      ),

    inep_code:
      readRequiredString(
        value,
        'inep_code',
      ),

    name:
      readRequiredString(
        value,
        'name',
      ),

    state:
      readOptionalString(
        value,
        'state',
      ),

    city:
      readOptionalString(
        value,
        'city',
      ),

    service_restriction:
      readOptionalString(
        value,
        'service_restriction',
      ),

    location:
      readOptionalString(
        value,
        'location',
      ),

    differentiated_location:
      readOptionalString(
        value,
        'differentiated_location',
      ),

    administrative_category:
      readOptionalString(
        value,
        'administrative_category',
      ),

    address:
      readOptionalString(
        value,
        'address',
      ),

    phone:
      readOptionalString(
        value,
        'phone',
      ),

    administrative_dependency:
      readOptionalString(
        value,
        'administrative_dependency',
      ),

    private_school_category:
      readOptionalString(
        value,
        'private_school_category',
      ),

    public_authority_partner:
      readOptionalString(
        value,
        'public_authority_partner',
      ),

    education_council_regulation:
      readOptionalString(
        value,
        'education_council_regulation',
      ),

    school_size:
      readOptionalString(
        value,
        'school_size',
      ),

    education_stages:
      readOptionalString(
        value,
        'education_stages',
      ),

    other_educational_offerings:
      readOptionalString(
        value,
        'other_educational_offerings',
      ),

    latitude:
      readOptionalNumber(
        value,
        'latitude',
      ),

    longitude:
      readOptionalNumber(
        value,
        'longitude',
      ),

    source_file:
      readOptionalString(
        value,
        'source_file',
      ),

    imported_at:
      readRequiredString(
        value,
        'imported_at',
      ),

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

function sanitizeSearchTerm(
  value: string,
): string {
  return value
    .trim()
    .replace(
      /[%_(),]/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .slice(0, 150)
}

class SchoolRegistryRepository {
  private get client(): SupabaseClient {
    return createRegistryClient()
  }

  async findById(
    registryId: string,
  ): Promise<SchoolRegistryDto | null> {
    const { data, error } =
      await this.client
        .from('school_registry')
        .select(REGISTRY_SELECT)
        .eq('id', registryId)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao consultar cadastro nacional: ${error.message}`,
      )
    }

    return parseRegistry(data)
  }

  async findByInepCode(
    inepCode: string,
  ): Promise<SchoolRegistryDto | null> {
    const { data, error } =
      await this.client
        .from('school_registry')
        .select(REGISTRY_SELECT)
        .eq('inep_code', inepCode)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao consultar escola pelo código INEP: ${error.message}`,
      )
    }

    return parseRegistry(data)
  }

  async search(
    input: SchoolRegistrySearchQueryDto,
  ): Promise<SchoolRegistrySearchData> {
    const searchTerm =
      sanitizeSearchTerm(
        input.query,
      )

    const state =
      input.state
        ?.trim()
        .toUpperCase()

    const city =
      input.city
        ?.trim()

    let query =
      this.client
        .from('school_registry')
        .select(
          SEARCH_SELECT,
          {
            count: 'exact',
          },
        )

    if (
      /^\d{8}$/.test(searchTerm)
    ) {
      query =
        query.eq(
          'inep_code',
          searchTerm,
        )
    } else {
      query =
        query.or(
          [
            `name.ilike.%${searchTerm}%`,
            `city.ilike.%${searchTerm}%`,
            `inep_code.ilike.%${searchTerm}%`,
          ].join(','),
        )
    }

    if (state) {
      query =
        query.eq(
          'state',
          state,
        )
    }

    if (city) {
      query =
        query.ilike(
          'city',
          `%${sanitizeSearchTerm(city)}%`,
        )
    }

    const {
      data,
      error,
      count,
    } = await query
      .order('name', {
        ascending: true,
      })
      .limit(input.limit)

    if (error) {
      throw new Error(
        `Erro ao pesquisar cadastro nacional: ${error.message}`,
      )
    }

    return {
      total:
        count ?? 0,

      data:
        parseRegistryItemList(
          data,
        ),
    }
  }
}

export const schoolRegistryRepository =
  new SchoolRegistryRepository()