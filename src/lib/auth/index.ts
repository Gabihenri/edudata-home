export { getSupabase, getCurrentUser } from './auth'

export { AuthorizationService } from './authorization'

export {
  requireAuth,
  requirePermission,
  requireAnyRole,
  requireSuperAdmin,
  requireAdministrator,
  requireDirector,
  requireCoordinator,
  requireTeacher,
} from './guard'

export {
  USER_ROLES,
  isValidUserRole,
  getRolePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from './permissions'

export type {
  Permission,
  UserRole,
} from './permissions'

export {
  getCurrentUserRole,
  requireUserRole,
  userHasRole,
  userHasAnyRole,
} from './role'

export {
  ROLES,
  isRole,
} from './roles'

export type {
  Role,
} from './roles'

export {
  getSessionUser,
  requireSessionUser,
} from './session'