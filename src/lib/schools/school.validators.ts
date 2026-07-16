import type {
  AdministrativeType,
  CreateSchoolDto,
  EducationNetwork,
  InstitutionType,
  RegistrationOrigin,
  SchoolStatus,
  UpdateSchoolDto,
} from './school.dto'

type UnknownRecord =
  Record<string, unknown>

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

const INSTITUTION_TYPES:
  InstitutionType[] = [
    'school',
    'institute',
    'college',
    'university',
    'company',
    'training_center',
    'ngo',
    'government_agency',
    'education_department',
    'research_center',
    'other',
  ]

const REGISTRATION_ORIGINS:
  RegistrationOrigin[] = [
    'inep',
    'manual',
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

function validateUuid(
  value: unknown,
  label: string,
): string {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new Error(
      `${label} é obrigatório.`,
    )
  }

  const normalized =
    value.trim()

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  if (!uuidPattern.test(normalized)) {
    throw new Error(
      `${label} inválido.`,
    )
  }

  return normalized
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

  const normalized =
    value.trim()

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

  if (
    typeof value !== 'string'
  ) {
    throw new Error(
      `${label} deve ser um texto válido.`,
    )
  }

  const normalized =
    value.trim()

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
): string | undefined {
  const email =
    readOptionalText(
      record,
      'email',
      'E-mail',
      254,
    )

  if (!email) {
    return undefined
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (
    !emailPattern.test(email)
  ) {
    throw new Error(
      'E-mail inválido.',
    )
  }

  return email.toLowerCase()
}

function readOptionalUrl(
  record: UnknownRecord,
): string | undefined {
  const website =
    readOptionalText(
      record,
      'website',
      'Site',
      500,
    )

  if (!website) {
    return undefined
  }

  try {
    const url =
      new URL(website)

    if (
      url.protocol !== 'http:' &&
      url.protocol !== 'https:'
    ) {
      throw new Error()
    }
  } catch {
    throw new Error(
      'Site deve utilizar http:// ou https://.',
    )
  }

  return website
}

function readOptionalInepCode(
  record: UnknownRecord,
): string | undefined {
  const value =
    record.inep_code

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined
  }

  if (
    typeof value !== 'string'
  ) {
    throw new Error(
      'Código INEP inválido.',
    )
  }

  const digits =
    value.replace(/\D/g, '')

  if (
    digits.length !== 8
  ) {
    throw new Error(
      'Código INEP deve possuir exatamente 8 números.',
    )
  }

  return digits
}

function readEducationNetwork(
  record: UnknownRecord,
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
      'Rede de ensino inválida.',
    )
  }

  return value as EducationNetwork
}

function readAdministrativeType(
  record: UnknownRecord,
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
      'Tipo administrativo inválido.',
    )
  }

  return value as AdministrativeType
}

function readInstitutionType(
  record: UnknownRecord,
  fallback: InstitutionType =
    'school',
): InstitutionType {
  const value =
    record.institution_type

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return fallback
  }

  if (
    typeof value !== 'string' ||
    !INSTITUTION_TYPES.includes(
      value as InstitutionType,
    )
  ) {
    throw new Error(
      'Tipo de instituição inválido.',
    )
  }

  return value as InstitutionType
}

function readRegistrationOrigin(
  record: UnknownRecord,
  fallback: RegistrationOrigin =
    'manual',
): RegistrationOrigin {
  const value =
    record.registration_origin

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return fallback
  }

  if (
    typeof value !== 'string' ||
    !REGISTRATION_ORIGINS.includes(
      value as RegistrationOrigin,
    )
  ) {
    throw new Error(
      'Origem do cadastro inválida.',
    )
  }

  return value as RegistrationOrigin
}

function readOptionalStatus(
  record: UnknownRecord,
): SchoolStatus | undefined {
  const value =
    record.status

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined
  }

  if (
    typeof value !== 'string' ||
    !SCHOOL_STATUSES.includes(
      value as SchoolStatus,
    )
  ) {
    throw new Error(
      'Status da instituição inválido.',
    )
  }

  return value as SchoolStatus
}

function readOptionalRegistryId(
  record: UnknownRecord,
): string | undefined {
  const value =
    record.registry_id

  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined
  }

  return validateUuid(
    value,
    'Identificador do cadastro nacional',
  )
}

function assignOptionalText(
  target: UpdateSchoolDto,
  key: keyof UpdateSchoolDto,
  value: string | undefined,
): void {
  if (value !== undefined) {
    Object.assign(target, {
      [key]: value,
    })
  }
}

export function validateSchoolId(
  value: unknown,
): string {
  return validateUuid(
    value,
    'Identificador da instituição',
  )
}

export function validateOrganizationId(
  value: unknown,
): string {
  return validateUuid(
    value,
    'Identificador da organização',
  )
}

export function validateRegistryId(
  value: unknown,
): string {
  return validateUuid(
    value,
    'Identificador do cadastro nacional',
  )
}

export function validateCreateSchool(
  value: unknown,
): CreateSchoolDto {
  if (!isRecord(value)) {
    throw new Error(
      'Dados da instituição inválidos.',
    )
  }

  const registrationOrigin =
    readRegistrationOrigin(value)

  const institutionType =
    readInstitutionType(value)

  const registryId =
    readOptionalRegistryId(value)

  if (
    registrationOrigin === 'inep' &&
    !registryId
  ) {
    throw new Error(
      'Selecione uma instituição do cadastro nacional.',
    )
  }

  if (
    registrationOrigin === 'manual' &&
    registryId
  ) {
    throw new Error(
      'Cadastro manual não pode possuir vínculo com o cadastro nacional.',
    )
  }

  if (
    registrationOrigin === 'inep' &&
    institutionType !== 'school'
  ) {
    throw new Error(
      'Instituições selecionadas no INEP devem utilizar o tipo escola.',
    )
  }

  const result:
    CreateSchoolDto = {
      organization_id:
        validateOrganizationId(
          value.organization_id,
        ),

      registration_origin:
        registrationOrigin,

      institution_type:
        institutionType,

      name:
        readRequiredText(
          value,
          'name',
          'Nome da instituição',
          200,
        ),

      education_network:
        readEducationNetwork(value),

      administrative_type:
        readAdministrativeType(value),
    }

  if (registryId) {
    result.registry_id =
      registryId
  }

  const inepCode =
    readOptionalInepCode(value)

  if (inepCode !== undefined) {
    result.inep_code =
      inepCode
  }

  const shortName =
    readOptionalText(
      value,
      'short_name',
      'Nome curto',
      100,
    )

  if (shortName !== undefined) {
    result.short_name =
      shortName
  }

  const principalName =
    readOptionalText(
      value,
      'principal_name',
      'Nome do responsável',
      200,
    )

  if (principalName !== undefined) {
    result.principal_name =
      principalName
  }

  const email =
    readOptionalEmail(value)

  if (email !== undefined) {
    result.email =
      email
  }

  const phone =
    readOptionalText(
      value,
      'phone',
      'Telefone',
      30,
    )

  if (phone !== undefined) {
    result.phone =
      phone
  }

  const website =
    readOptionalUrl(value)

  if (website !== undefined) {
    result.website =
      website
  }

  const postalCode =
    readOptionalText(
      value,
      'postal_code',
      'CEP',
      20,
    )

  if (postalCode !== undefined) {
    result.postal_code =
      postalCode
  }

  const address =
    readOptionalText(
      value,
      'address',
      'Endereço',
      300,
    )

  if (address !== undefined) {
    result.address =
      address
  }

  const number =
    readOptionalText(
      value,
      'number',
      'Número',
      20,
    )

  if (number !== undefined) {
    result.number =
      number
  }

  const complement =
    readOptionalText(
      value,
      'complement',
      'Complemento',
      100,
    )

  if (complement !== undefined) {
    result.complement =
      complement
  }

  const district =
    readOptionalText(
      value,
      'district',
      'Bairro',
      120,
    )

  if (district !== undefined) {
    result.district =
      district
  }

  const city =
    readOptionalText(
      value,
      'city',
      'Cidade',
      120,
    )

  if (city !== undefined) {
    result.city =
      city
  }

  const state =
    readOptionalText(
      value,
      'state',
      'Estado',
      100,
    )

  if (state !== undefined) {
    result.state =
      state
  }

  const country =
    readOptionalText(
      value,
      'country',
      'País',
      100,
    )

  if (country !== undefined) {
    result.country =
      country
  }

  const status =
    readOptionalStatus(value)

  if (status !== undefined) {
    result.status =
      status
  }

  return result
}

export function validateUpdateSchool(
  value: unknown,
): UpdateSchoolDto {
  if (!isRecord(value)) {
    throw new Error(
      'Dados da instituição inválidos.',
    )
  }

  const result:
    UpdateSchoolDto = {}

  if (
    value.organization_id !==
    undefined
  ) {
    result.organization_id =
      validateOrganizationId(
        value.organization_id,
      )
  }

  if (
    value.registry_id !==
    undefined
  ) {
    const registryId =
      readOptionalRegistryId(value)

    if (registryId) {
      result.registry_id =
        registryId
    } else {
      result.registry_id = ''
    }
  }

  if (
    value.registration_origin !==
    undefined
  ) {
    result.registration_origin =
      readRegistrationOrigin(value)
  }

  if (
    value.institution_type !==
    undefined
  ) {
    result.institution_type =
      readInstitutionType(value)
  }

  if (value.name !== undefined) {
    result.name =
      readRequiredText(
        value,
        'name',
        'Nome da instituição',
        200,
      )
  }

  if (
    value.education_network !==
    undefined
  ) {
    result.education_network =
      readEducationNetwork(value)
  }

  if (
    value.administrative_type !==
    undefined
  ) {
    result.administrative_type =
      readAdministrativeType(value)
  }

  if (
    value.inep_code !== undefined
  ) {
    result.inep_code =
      readOptionalInepCode(value) ??
      ''
  }

  assignOptionalText(
    result,
    'short_name',
    value.short_name === undefined
      ? undefined
      : readOptionalText(
          value,
          'short_name',
          'Nome curto',
          100,
        ) ?? '',
  )

  assignOptionalText(
    result,
    'principal_name',
    value.principal_name === undefined
      ? undefined
      : readOptionalText(
          value,
          'principal_name',
          'Nome do responsável',
          200,
        ) ?? '',
  )

  if (value.email !== undefined) {
    result.email =
      readOptionalEmail(value) ?? ''
  }

  assignOptionalText(
    result,
    'phone',
    value.phone === undefined
      ? undefined
      : readOptionalText(
          value,
          'phone',
          'Telefone',
          30,
        ) ?? '',
  )

  if (value.website !== undefined) {
    result.website =
      readOptionalUrl(value) ?? ''
  }

  assignOptionalText(
    result,
    'postal_code',
    value.postal_code === undefined
      ? undefined
      : readOptionalText(
          value,
          'postal_code',
          'CEP',
          20,
        ) ?? '',
  )

  assignOptionalText(
    result,
    'address',
    value.address === undefined
      ? undefined
      : readOptionalText(
          value,
          'address',
          'Endereço',
          300,
        ) ?? '',
  )

  assignOptionalText(
    result,
    'number',
    value.number === undefined
      ? undefined
      : readOptionalText(
          value,
          'number',
          'Número',
          20,
        ) ?? '',
  )

  assignOptionalText(
    result,
    'complement',
    value.complement === undefined
      ? undefined
      : readOptionalText(
          value,
          'complement',
          'Complemento',
          100,
        ) ?? '',
  )

  assignOptionalText(
    result,
    'district',
    value.district === undefined
      ? undefined
      : readOptionalText(
          value,
          'district',
          'Bairro',
          120,
        ) ?? '',
  )

  assignOptionalText(
    result,
    'city',
    value.city === undefined
      ? undefined
      : readOptionalText(
          value,
          'city',
          'Cidade',
          120,
        ) ?? '',
  )

  assignOptionalText(
    result,
    'state',
    value.state === undefined
      ? undefined
      : readOptionalText(
          value,
          'state',
          'Estado',
          100,
        ) ?? '',
  )

  assignOptionalText(
    result,
    'country',
    value.country === undefined
      ? undefined
      : readOptionalText(
          value,
          'country',
          'País',
          100,
        ) ?? '',
  )

  if (value.status !== undefined) {
    const status =
      readOptionalStatus(value)

    if (!status) {
      throw new Error(
        'Status da instituição é obrigatório.',
      )
    }

    result.status =
      status
  }

  if (
    result.registration_origin ===
      'manual' &&
    result.registry_id
  ) {
    throw new Error(
      'Cadastro manual não pode possuir vínculo com o cadastro nacional.',
    )
  }

  if (
    result.registration_origin ===
      'inep' &&
    result.institution_type &&
    result.institution_type !==
      'school'
  ) {
    throw new Error(
      'Instituições selecionadas no INEP devem utilizar o tipo escola.',
    )
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