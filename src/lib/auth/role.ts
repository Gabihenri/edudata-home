import { getSessionUser } from './session'
import { isValidUserRole, type UserRole } from './permissions'

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const user = await getSessionUser()

  if (!user) {
    return null
  }

  // user_metadata is user-editable and must never grant permissions.
  // app_metadata is managed server-side; unknown roles fall back to least privilege.
  const trustedRole = user.app_metadata?.role

  if (isValidUserRole(trustedRole)) {
    return trustedRole
  }

  return 'professor'
}

export async function requireUserRole(): Promise<UserRole> {
  const role = await getCurrentUserRole()

  if (!role) {
    throw new Error('Perfil do usuário não encontrado.')
  }

  return role
}

export async function userHasRole(
  expectedRole: UserRole,
): Promise<boolean> {
  const role = await getCurrentUserRole()

  return role === expectedRole
}

export async function userHasAnyRole(
  roles: UserRole[],
): Promise<boolean> {
  const role = await getCurrentUserRole()

  if (!role) {
    return false
  }

  return roles.includes(role)
}
