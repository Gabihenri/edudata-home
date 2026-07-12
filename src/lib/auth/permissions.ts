export const USER_ROLES = [
  'professor',
  'coordenador',
  'diretor',
  'administrador',
  'super_admin',
] as const

export type UserRole = (typeof USER_ROLES)[number]

export type Permission =
  | 'agenda:read'
  | 'agenda:create'
  | 'agenda:update'
  | 'agenda:delete'
  | 'school:manage'
  | 'users:manage'
  | 'reports:read'
  | 'platform:manage'

const rolePermissions: Record<UserRole, Permission[]> = {
  professor: [
    'agenda:read',
    'agenda:create',
    'agenda:update',
    'reports:read',
  ],

  coordenador: [
    'agenda:read',
    'agenda:create',
    'agenda:update',
    'agenda:delete',
    'reports:read',
  ],

  diretor: [
    'agenda:read',
    'agenda:create',
    'agenda:update',
    'agenda:delete',
    'school:manage',
    'reports:read',
  ],

  administrador: [
    'agenda:read',
    'agenda:create',
    'agenda:update',
    'agenda:delete',
    'school:manage',
    'users:manage',
    'reports:read',
  ],

  super_admin: [
    'agenda:read',
    'agenda:create',
    'agenda:update',
    'agenda:delete',
    'school:manage',
    'users:manage',
    'reports:read',
    'platform:manage',
  ],
}

export function isValidUserRole(value: unknown): value is UserRole {
  return (
    typeof value === 'string' &&
    USER_ROLES.includes(value as UserRole)
  )
}

export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role]
}

export function hasPermission(
  role: UserRole,
  permission: Permission,
): boolean {
  return rolePermissions[role].includes(permission)
}

export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) =>
    hasPermission(role, permission),
  )
}

export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.every((permission) =>
    hasPermission(role, permission),
  )
}

export function requirePermission(
  role: UserRole,
  permission: Permission,
): void {
  if (!hasPermission(role, permission)) {
    throw new Error('Usuário sem permissão para executar esta ação.')
  }
}