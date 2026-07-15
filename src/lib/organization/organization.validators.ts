import type {
  CreateOrganizationDto,
  OrganizationStatus,
  UpdateOrganizationDto,
} from './organization.dto'

type UnknownRecord = Record<string, unknown>

const ORGANIZATION_STATUSES:
  OrganizationStatus[] = [
    'active',
    'inactive',
    'pending',
    'suspended',
    'archived',
  ]

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function readRequiredText(
  record: UnknownRecord,
  key: string,
  label: string,
  maximumLength: number,
): string {
  const value = record[key]

  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new Error(
      `${label} é obrigatório.`,
    )
  }

  const normalized = value.trim()

  if (
    normalized.length >
    maximumLength
  ) {
    throw new Error(
      `${label} deve possuir no máximo ${maximumLength} caracteres.`,
    )
  }

  return normalized
}

function readOptionalText(
  record: UnknownRecord,
  key: string,
  label: string,
  maximumLength: number,
): string | undefined {
  const value = record[key]

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined
  }

  if (typeof value !== 'string') {
    throw new Error(
      `${label} deve ser um texto válido.`,
    )
  }

  const normalized = value.trim()

  if (!normalized) {
    return undefined
  }

  if (
    normalized.length >
    maximumLength
  ) {
    throw new Error(
      `${label} deve possuir no máximo ${maximumLength} caracteres.`,
    )
  }

  return normalized
}

function readOptionalEmail(
  record: UnknownRecord,
  key: string,
): string | undefined {
  const value = readOptionalText(
    record,
    key,
    'E-mail',
    254,
  )

  if (!value) {
    return undefined
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailPattern.test(value)) {
    throw new Error(
      'E-mail inválido.',
    )
  }

  return value.toLowerCase()
}

function readOptionalUrl(
  record: UnknownRecord,
  key: string,
  label: string,
): string | undefined {
  const value = readOptionalText(
    record,
    key,
    label,
    500,
  )

  if (!value) {
    return undefined
  }

  try {
    const url = new URL(value)

    if (
      url.protocol !== 'http:' &&
      url.protocol !== 'https:'
    ) {
      throw new Error()
    }
  } catch {
    throw new Error(
      `${label} deve utilizar http:// ou https://.`,
    )
  }

  return value
}

function readOptionalStatus(
  record: UnknownRecord,
): OrganizationStatus | undefined {
  const value = record.status

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined
  }

  if (
    typeof value !== 'string' ||
    !ORGANIZATION_STATUSES.includes(
      value as OrganizationStatus,
    )
  ) {
    throw new Error(
      'Status da organização inválido.',
    )
  }

  return value as OrganizationStatus
}

function assignOptionalText(
  target: Record<string, unknown>,
  key: string,
  value: string | undefined,
): void {
  if (value !== undefined) {
    target[key] = value
  }
}

export function validateOrganizationId(
  id: unknown,
): string {
  if (
    typeof id !== 'string' ||
    !id.trim()
  ) {
    throw new Error(
      'Identificador da organização é obrigatório.',
    )
  }

  const normalized = id.trim()

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  if (!uuidPattern.test(normalized)) {
    throw new Error(
      'Identificador da organização inválido.',
    )
  }

  return normalized
}

export function validateCreateOrganization(
  value: unknown,
): CreateOrganizationDto {
  if (!isRecord(value)) {
    throw new Error(
      'Dados da organização inválidos.',
    )
  }

  const name = readRequiredText(
    value,
    'name',
    'Nome da organização',
    200,
  )

  const organizationType =
    readRequiredText(
      value,
      'organization_type',
      'Tipo da organização',
      100,
    )

  const result:
    CreateOrganizationDto = {
      name,
      organization_type:
        organizationType,
    }

  assignOptionalText(
    result as Record<string, unknown>,
    'short_name',
    readOptionalText(
      value,
      'short_name',
      'Nome curto',
      100,
    ),
  )

  assignOptionalText(
    result as Record<string, unknown>,
    'document',
    readOptionalText(
      value,
      'document',
      'Documento',
      50,
    ),
  )

  assignOptionalText(
    result as Record<string, unknown>,
    'email',
    readOptionalEmail(
      value,
      'email',
    ),
  )

  assignOptionalText(
    result as Record<string, unknown>,
    'phone',
    readOptionalText(
      value,
      'phone',
      'Telefone',
      30,
    ),
  )

  assignOptionalText(
    result as Record<string, unknown>,
    'website',
    readOptionalUrl(
      value,
      'website',
      'Site',
    ),
  )

  assignOptionalText(
    result as Record<string, unknown>,
    'logo_url',
    readOptionalUrl(
      value,
      'logo_url',
      'URL do logotipo',
    ),
  )

  assignOptionalText(
    result as Record<string, unknown>,
    'address',
    readOptionalText(
      value,
      'address',
      'Endereço',
      300,
    ),
  )

  assignOptionalText(
    result as Record<string, unknown>,
    'city',
    readOptionalText(
      value,
      'city',
      'Cidade',
      120,
    ),
  )

  assignOptionalText(
    result as Record<string, unknown>,
    'state',
    readOptionalText(
      value,
      'state',
      'Estado',
      100,
    ),
  )

  assignOptionalText(
    result as Record<string, unknown>,
    'zip_code',
    readOptionalText(
      value,
      'zip_code',
      'CEP',
      20,
    ),
  )

  assignOptionalText(
    result as Record<string, unknown>,
    'country',
    readOptionalText(
      value,
      'country',
      'País',
      100,
    ),
  )

  const status =
    readOptionalStatus(value)

  if (status !== undefined) {
    result.status = status
  }

  return result
}

export function validateUpdateOrganization(
  value: unknown,
): UpdateOrganizationDto {
  if (!isRecord(value)) {
    throw new Error(
      'Dados da organização inválidos.',
    )
  }

  const result:
    UpdateOrganizationDto = {}

  if (value.name !== undefined) {
    result.name =
      readRequiredText(
        value,
        'name',
        'Nome da organização',
        200,
      )
  }

  if (
    value.organization_type !==
    undefined
  ) {
    result.organization_type =
      readRequiredText(
        value,
        'organization_type',
        'Tipo da organização',
        100,
      )
  }

  const optionalFields = [
    {
      key: 'short_name',
      label: 'Nome curto',
      maximumLength: 100,
    },
    {
      key: 'document',
      label: 'Documento',
      maximumLength: 50,
    },
    {
      key: 'phone',
      label: 'Telefone',
      maximumLength: 30,
    },
    {
      key: 'address',
      label: 'Endereço',
      maximumLength: 300,
    },
    {
      key: 'city',
      label: 'Cidade',
      maximumLength: 120,
    },
    {
      key: 'state',
      label: 'Estado',
      maximumLength: 100,
    },
    {
      key: 'zip_code',
      label: 'CEP',
      maximumLength: 20,
    },
    {
      key: 'country',
      label: 'País',
      maximumLength: 100,
    },
  ] as const

  for (
    const field of optionalFields
  ) {
    if (
      value[field.key] !== undefined
    ) {
      const parsed =
        readOptionalText(
          value,
          field.key,
          field.label,
          field.maximumLength,
        )

      ;(
        result as Record<
          string,
          unknown
        >
      )[field.key] =
        parsed ?? ''
    }
  }

  if (value.email !== undefined) {
    result.email =
      readOptionalEmail(
        value,
        'email',
      ) ?? ''
  }

  if (value.website !== undefined) {
    result.website =
      readOptionalUrl(
        value,
        'website',
        'Site',
      ) ?? ''
  }

  if (value.logo_url !== undefined) {
    result.logo_url =
      readOptionalUrl(
        value,
        'logo_url',
        'URL do logotipo',
      ) ?? ''
  }

  if (value.status !== undefined) {
    const status =
      readOptionalStatus(value)

    if (!status) {
      throw new Error(
        'Status da organização é obrigatório.',
      )
    }

    result.status = status
  }

  if (
    Object.keys(result).length === 0
  ) {
    throw new Error(
      'Nenhum campo foi informado para atualização.',
    )
  }

  return result
}