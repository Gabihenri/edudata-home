const SCHOOL_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Normaliza o identificador opcional da escola recebido pela API.
 * Valores ausentes ou strings vazias representam evento sem escola;
 * valores presentes com tipo/formato inválido são rejeitados.
 */
export function normalizeSchoolId(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value !== 'string') {
    throw new Error('Identificador da escola é inválido.')
  }

  const schoolId = value.trim()

  if (!schoolId) {
    return null
  }

  if (!SCHOOL_ID_PATTERN.test(schoolId)) {
    throw new Error('Identificador da escola é inválido.')
  }

  return schoolId
}
