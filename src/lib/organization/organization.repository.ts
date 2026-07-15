import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import type {
  CreateOrganizationDto,
  OrganizationDto,
  OrganizationStatus,
  UpdateOrganizationDto,
} from './organization.dto'

type DatabaseRecord = Record<string, unknown>

const ORGANIZATION_FIELDS = [
  'id',
  'name',
  'short_name',
  'organization_type',
  'document',
  'email',
  'phone',
  'website',
  'logo_url',
  'address',
  'city',
  'state',
  'zip_code',
  'country',
  'status',
  'created_at',
  'updated_at',
].join(',')

function createOrganizationClient(): SupabaseClient {
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
      `Campo obrigatório inválido em organizations: ${key}.`,
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

function parseStatus(
  value: unknown,
): OrganizationStatus {
  const allowedStatuses:
    OrganizationStatus[] = [
      'active',
      'inactive',
      'pending',
      'suspended',
      'archived',
    ]

  if (
    typeof value === 'string' &&
    allowedStatuses.includes(
      value as OrganizationStatus,
    )
  ) {
    return value as OrganizationStatus
  }

  throw new Error(
    'Status inválido retornado pela tabela organizations.',
  )
}

function parseOrganization(
  value: unknown,
): OrganizationDto | null {
  if (!isRecord(value)) {
    return null
  }

  return {
    id: readRequiredString(
      value,
      'id',
    ),

    name: readRequiredString(
      value,
      'name',
    ),

    short_name: readOptionalString(
      value,
      'short_name',
    ),

    organization_type:
      readRequiredString(
        value,
        'organization_type',
      ),

    document: readOptionalString(
      value,
      'document',
    ),

    email: readOptionalString(
      value,
      'email',
    ),

    phone: readOptionalString(
      value,
      'phone',
    ),

    website: readOptionalString(
      value,
      'website',
    ),

    logo_url: readOptionalString(
      value,
      'logo_url',
    ),

    address: readOptionalString(
      value,
      'address',
    ),

    city: readOptionalString(
      value,
      'city',
    ),

    state: readOptionalString(
      value,
      'state',
    ),

    zip_code: readOptionalString(
      value,
      'zip_code',
    ),

    country:
      readRequiredString(
        value,
        'country',
      ),

    status: parseStatus(
      value.status,
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

function parseOrganizationList(
  value: unknown,
): OrganizationDto[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map(parseOrganization)
    .filter(
      (
        organization,
      ): organization is OrganizationDto =>
        organization !== null,
    )
}

function normalizeOptionalText(
  value: string | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  const normalized = value.trim()

  return normalized || null
}

function buildCreatePayload(
  input: CreateOrganizationDto,
): DatabaseRecord {
  return {
    name: input.name.trim(),

    short_name:
      normalizeOptionalText(
        input.short_name,
      ) ?? null,

    organization_type:
      input.organization_type.trim(),

    document:
      normalizeOptionalText(
        input.document,
      ) ?? null,

    email:
      normalizeOptionalText(
        input.email,
      ) ?? null,

    phone:
      normalizeOptionalText(
        input.phone,
      ) ?? null,

    website:
      normalizeOptionalText(
        input.website,
      ) ?? null,

    logo_url:
      normalizeOptionalText(
        input.logo_url,
      ) ?? null,

    address:
      normalizeOptionalText(
        input.address,
      ) ?? null,

    city:
      normalizeOptionalText(
        input.city,
      ) ?? null,

    state:
      normalizeOptionalText(
        input.state,
      ) ?? null,

    zip_code:
      normalizeOptionalText(
        input.zip_code,
      ) ?? null,

    country:
      input.country?.trim() ||
      'Brasil',

    status:
      input.status ??
      'active',
  }
}

function buildUpdatePayload(
  input: UpdateOrganizationDto,
): DatabaseRecord {
  const payload: DatabaseRecord = {}

  if (input.name !== undefined) {
    payload.name =
      input.name.trim()
  }

  if (
    input.short_name !== undefined
  ) {
    payload.short_name =
      normalizeOptionalText(
        input.short_name,
      )
  }

  if (
    input.organization_type !==
    undefined
  ) {
    payload.organization_type =
      input.organization_type.trim()
  }

  if (input.document !== undefined) {
    payload.document =
      normalizeOptionalText(
        input.document,
      )
  }

  if (input.email !== undefined) {
    payload.email =
      normalizeOptionalText(
        input.email,
      )
  }

  if (input.phone !== undefined) {
    payload.phone =
      normalizeOptionalText(
        input.phone,
      )
  }

  if (input.website !== undefined) {
    payload.website =
      normalizeOptionalText(
        input.website,
      )
  }

  if (input.logo_url !== undefined) {
    payload.logo_url =
      normalizeOptionalText(
        input.logo_url,
      )
  }

  if (input.address !== undefined) {
    payload.address =
      normalizeOptionalText(
        input.address,
      )
  }

  if (input.city !== undefined) {
    payload.city =
      normalizeOptionalText(
        input.city,
      )
  }

  if (input.state !== undefined) {
    payload.state =
      normalizeOptionalText(
        input.state,
      )
  }

  if (input.zip_code !== undefined) {
    payload.zip_code =
      normalizeOptionalText(
        input.zip_code,
      )
  }

  if (input.country !== undefined) {
    payload.country =
      input.country.trim() ||
      'Brasil'
  }

  if (input.status !== undefined) {
    payload.status =
      input.status
  }

  return payload
}

class OrganizationRepository {
  private get client(): SupabaseClient {
    return createOrganizationClient()
  }

  async findAll(): Promise<
    OrganizationDto[]
  > {
    const { data, error } =
      await this.client
        .from('organizations')
        .select(
          ORGANIZATION_FIELDS,
        )
        .neq(
          'status',
          'archived',
        )
        .order(
          'name',
          {
            ascending: true,
          },
        )

    if (error) {
      throw new Error(
        `Erro ao listar organizações: ${error.message}`,
      )
    }

    return parseOrganizationList(
      data,
    )
  }

  async findById(
    id: string,
  ): Promise<OrganizationDto | null> {
    const { data, error } =
      await this.client
        .from('organizations')
        .select(
          ORGANIZATION_FIELDS,
        )
        .eq(
          'id',
          id,
        )
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao consultar organização: ${error.message}`,
      )
    }

    return parseOrganization(
      data,
    )
  }

  async findByDocument(
    document: string,
  ): Promise<OrganizationDto | null> {
    const { data, error } =
      await this.client
        .from('organizations')
        .select(
          ORGANIZATION_FIELDS,
        )
        .eq(
          'document',
          document.trim(),
        )
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao consultar documento da organização: ${error.message}`,
      )
    }

    return parseOrganization(
      data,
    )
  }

  async create(
    input: CreateOrganizationDto,
  ): Promise<OrganizationDto> {
    const payload =
      buildCreatePayload(input)

    const { data, error } =
      await this.client
        .from('organizations')
        .insert(payload)
        .select(
          ORGANIZATION_FIELDS,
        )
        .single()

    if (error) {
      throw new Error(
        `Erro ao criar organização: ${error.message}`,
      )
    }

    const organization =
      parseOrganization(data)

    if (!organization) {
      throw new Error(
        'A organização foi criada, mas os dados retornados são inválidos.',
      )
    }

    return organization
  }

  async update(
    id: string,
    input: UpdateOrganizationDto,
  ): Promise<OrganizationDto> {
    const payload =
      buildUpdatePayload(input)

    const { data, error } =
      await this.client
        .from('organizations')
        .update(payload)
        .eq(
          'id',
          id,
        )
        .select(
          ORGANIZATION_FIELDS,
        )
        .single()

    if (error) {
      throw new Error(
        `Erro ao atualizar organização: ${error.message}`,
      )
    }

    const organization =
      parseOrganization(data)

    if (!organization) {
      throw new Error(
        'A organização foi atualizada, mas os dados retornados são inválidos.',
      )
    }

    return organization
  }

  async archive(
    id: string,
  ): Promise<OrganizationDto> {
    const { data, error } =
      await this.client
        .from('organizations')
        .update({
          status: 'archived',
        })
        .eq(
          'id',
          id,
        )
        .select(
          ORGANIZATION_FIELDS,
        )
        .single()

    if (error) {
      throw new Error(
        `Erro ao arquivar organização: ${error.message}`,
      )
    }

    const organization =
      parseOrganization(data)

    if (!organization) {
      throw new Error(
        'A organização foi arquivada, mas os dados retornados são inválidos.',
      )
    }

    return organization
  }
}

export const organizationRepository =
  new OrganizationRepository()