import { hasCurrentActiveSchoolMembership } from './school-membership-period'

export type SchoolMembershipLookupResult = {
  data: Array<{
    access_starts_at: string | null
    access_ends_at: string | null
  }> | null
  error: unknown | null
}

export type SchoolMembershipLookup = (
  userId: string,
  schoolId: string,
) => Promise<SchoolMembershipLookupResult>

/**
 * Aplica a regra de autorização independente do transporte/cliente de banco.
 * A consulta deve filtrar usuário, escola e status ativo; erro de consulta
 * nunca pode ser interpretado como autorização.
 */
export async function assertActiveSchoolMembership(
  userId: string,
  schoolId: string | null,
  lookup: SchoolMembershipLookup,
  now = Date.now(),
): Promise<void> {
  if (schoolId === null) return

  const { data, error } = await lookup(userId, schoolId)

  if (error) {
    throw new Error('Não foi possível validar o vínculo institucional.')
  }

  if (!hasCurrentActiveSchoolMembership(data ?? [], now)) {
    throw new Error(
      'Sem permissão: usuário não possui vínculo ativo com a escola informada.',
    )
  }
}
