import { AuthorizationService } from './authorization'
import { type Permission, type UserRole } from './permissions'
import { requireSessionUser } from './session'
import { requireUserRole } from './role'

export async function requireAuth() {
  return requireSessionUser()
}

export async function requirePermission(
  permission: Permission,
) {
  await requireSessionUser()

  const role = await requireUserRole()

  AuthorizationService.require(role, permission)

  return role
}

export async function requireAnyRole(
  roles: UserRole[],
): Promise<UserRole> {
  await requireSessionUser()

  const role = await requireUserRole()

  if (!roles.includes(role)) {
    throw new Error('Acesso negado.')
  }

  return role
}

export async function requireSuperAdmin() {
  return requireAnyRole(['super_admin'])
}

export async function requireAdministrator() {
  return requireAnyRole([
    'administrador',
    'super_admin',
  ])
}

export async function requireDirector() {
  return requireAnyRole([
    'diretor',
    'administrador',
    'super_admin',
  ])
}

export async function requireCoordinator() {
  return requireAnyRole([
    'coordenador',
    'diretor',
    'administrador',
    'super_admin',
  ])
}

export async function requireTeacher() {
  return requireAnyRole([
    'professor',
    'coordenador',
    'diretor',
    'administrador',
    'super_admin',
  ])
}