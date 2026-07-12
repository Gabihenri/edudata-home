import {
  Permission,
  UserRole,
  getRolePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from './permissions'

export class AuthorizationService {
  static permissions(role: UserRole): Permission[] {
    return getRolePermissions(role)
  }

  static can(role: UserRole, permission: Permission): boolean {
    return hasPermission(role, permission)
  }

  static canAny(
    role: UserRole,
    permissions: Permission[],
  ): boolean {
    return hasAnyPermission(role, permissions)
  }

  static canAll(
    role: UserRole,
    permissions: Permission[],
  ): boolean {
    return hasAllPermissions(role, permissions)
  }

  static require(
    role: UserRole,
    permission: Permission,
  ): void {
    if (!this.can(role, permission)) {
      throw new Error('Acesso negado.')
    }
  }
}