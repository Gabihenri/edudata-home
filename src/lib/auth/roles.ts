export const ROLES = {
  PROFESSOR: 'professor',
  COORDENADOR: 'coordenador',
  DIRETOR: 'diretor',
  ADMINISTRADOR: 'administrador',
  SUPER_ADMIN: 'super_admin',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export function isRole(value: unknown): value is Role {
  return (
    typeof value === 'string' &&
    Object.values(ROLES).includes(value as Role)
  )
}