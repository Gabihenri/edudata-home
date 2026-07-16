import type {
  SchoolRegistryDto,
  SchoolRegistrySearchQueryDto,
  SchoolRegistrySearchResultDto,
} from './school-registry.dto'
import { schoolRegistryRepository } from './school-registry.repository'

interface SchoolRegistrySearchInput {
  query: unknown
  state?: unknown
  city?: unknown
  limit?: unknown
}

function validateUuid(
  value: unknown,
): string {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new Error(
      'Identificador do cadastro nacional é obrigatório.',
    )
  }

  const normalized =
    value.trim()

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  if (!uuidPattern.test(normalized)) {
    throw new Error(
      'Identificador do cadastro nacional inválido.',
    )
  }

  return normalized
}

function validateInepCode(
  value: unknown,
): string {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new Error(
      'Código INEP é obrigatório.',
    )
  }

  const normalized =
    value.replace(/\D/g, '')

  if (
    normalized.length !== 8
  ) {
    throw new Error(
      'Código INEP deve possuir exatamente 8 números.',
    )
  }

  return normalized
}

function validateSearchQuery(
  value: unknown,
): string {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new Error(
      'Informe um nome, código INEP, município ou termo para pesquisa.',
    )
  }

  const normalized =
    value
      .trim()
      .replace(/\s+/g, ' ')

  const isInepCode =
    /^\d{8}$/.test(normalized)

  if (
    !isInepCode &&
    normalized.length < 3
  ) {
    throw new Error(
      'A pesquisa deve possuir pelo menos 3 caracteres.',
    )
  }

  if (
    normalized.length > 150
  ) {
    throw new Error(
      'A pesquisa deve possuir no máximo 150 caracteres.',
    )
  }

  return normalized
}

function validateOptionalState(
  value: unknown,
): string | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined
  }

  if (typeof value !== 'string') {
    throw new Error(
      'UF inválida.',
    )
  }

  const normalized =
    value.trim().toUpperCase()

  if (
    !/^[A-Z]{2}$/.test(normalized)
  ) {
    throw new Error(
      'UF deve possuir exatamente 2 letras.',
    )
  }

  return normalized
}

function validateOptionalCity(
  value: unknown,
): string | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined
  }

  if (typeof value !== 'string') {
    throw new Error(
      'Município inválido.',
    )
  }

  const normalized =
    value
      .trim()
      .replace(/\s+/g, ' ')

  if (!normalized) {
    return undefined
  }

  if (
    normalized.length < 2
  ) {
    throw new Error(
      'Município deve possuir pelo menos 2 caracteres.',
    )
  }

  if (
    normalized.length > 120
  ) {
    throw new Error(
      'Município deve possuir no máximo 120 caracteres.',
    )
  }

  return normalized
}

function validateLimit(
  value: unknown,
): number {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 20
  }

  const parsed =
    typeof value === 'number'
      ? value
      : Number(value)

  if (
    !Number.isInteger(parsed) ||
    parsed < 1 ||
    parsed > 50
  ) {
    throw new Error(
      'O limite da pesquisa deve ser um número inteiro entre 1 e 50.',
    )
  }

  return parsed
}

class SchoolRegistryService {
  async search(
    input: SchoolRegistrySearchInput,
  ): Promise<SchoolRegistrySearchResultDto> {
    const query =
      validateSearchQuery(
        input.query,
      )

    const state =
      validateOptionalState(
        input.state,
      )

    const city =
      validateOptionalCity(
        input.city,
      )

    const limit =
      validateLimit(
        input.limit,
      )

    const validatedInput:
      SchoolRegistrySearchQueryDto = {
        query,
        limit,
      }

    if (state) {
      validatedInput.state =
        state
    }

    if (city) {
      validatedInput.city =
        city
    }

    const result =
      await schoolRegistryRepository.search(
        validatedInput,
      )

    return {
      query,
      total: result.total,
      data: result.data,
    }
  }

  async getById(
    registryId: unknown,
  ): Promise<SchoolRegistryDto> {
    const validatedId =
      validateUuid(registryId)

    const registry =
      await schoolRegistryRepository.findById(
        validatedId,
      )

    if (!registry) {
      throw new Error(
        'Instituição não encontrada no cadastro nacional.',
      )
    }

    return registry
  }

  async getByInepCode(
    inepCode: unknown,
  ): Promise<SchoolRegistryDto> {
    const validatedInepCode =
      validateInepCode(
        inepCode,
      )

    const registry =
      await schoolRegistryRepository.findByInepCode(
        validatedInepCode,
      )

    if (!registry) {
      throw new Error(
        'Instituição não encontrada para o código INEP informado.',
      )
    }

    return registry
  }
}

export const schoolRegistryService =
  new SchoolRegistryService()