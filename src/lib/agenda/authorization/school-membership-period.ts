export type SchoolMembershipAccessPeriod = {
  access_starts_at: string | null
  access_ends_at: string | null
}

/**
 * Confirma se ao menos um vínculo consultado está dentro do período de acesso.
 * Datas ausentes significam período sem limite; datas inválidas falham fechado.
 */
export function hasCurrentActiveSchoolMembership(
  memberships: SchoolMembershipAccessPeriod[],
  now = Date.now(),
): boolean {
  return memberships.some((membership) => {
    const startsAt = membership.access_starts_at
      ? Date.parse(membership.access_starts_at)
      : null
    const endsAt = membership.access_ends_at
      ? Date.parse(membership.access_ends_at)
      : null

    return (
      (startsAt === null || (Number.isFinite(startsAt) && startsAt <= now)) &&
      (endsAt === null || (Number.isFinite(endsAt) && endsAt >= now))
    )
  })
}
