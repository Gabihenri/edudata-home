import 'server-only'

import {
  AccessDeniedError,
  accessService,
  type AccessDecision,
  type ResolveAccessOptions,
} from '@/lib/access/services/access.service'

export type RequireFeatureAccessInput = {
  userId: string
  featureCode: string
  options?: ResolveAccessOptions
}

/**
 * Confirma que o usuário pode utilizar uma funcionalidade.
 *
 * Quando o acesso estiver liberado, retorna a decisão
 * completa com plano, origem e limites.
 *
 * Quando o acesso estiver bloqueado, lança
 * AccessDeniedError.
 */
export async function requireFeatureAccess({
  userId,
  featureCode,
  options,
}: RequireFeatureAccessInput): Promise<AccessDecision> {
  return accessService.assertCanUse(
    userId,
    featureCode,
    options,
  )
}

/**
 * Consulta o acesso sem lançar erro quando o recurso
 * estiver indisponível.
 */
export async function resolveFeatureAccess({
  userId,
  featureCode,
  options,
}: RequireFeatureAccessInput): Promise<AccessDecision> {
  return accessService.resolveFeatureAccess(
    userId,
    featureCode,
    options,
  )
}

/**
 * Verifica se o erro representa bloqueio comercial.
 */
export function isAccessDeniedError(
  error: unknown,
): error is AccessDeniedError {
  return error instanceof AccessDeniedError
}

/**
 * Transforma o bloqueio comercial em um objeto seguro
 * para respostas das APIs.
 */
export function serializeAccessDeniedError(
  error: AccessDeniedError,
) {
  return {
    success: false as const,

    error: error.message,
    code: error.code,

    upgradeRequired:
      error.decision.reason ===
        'feature_disabled' ||
      error.decision.reason ===
        'quota_exceeded',

    access: {
      featureCode:
        error.decision.featureCode,

      featureName:
        error.decision.featureName,

      featureCategory:
        error.decision.featureCategory,

      allowed:
        error.decision.allowed,

      reason:
        error.decision.reason,

      currentPlan:
        error.decision.planCode,

      currentPlanName:
        error.decision.planName,

      source:
        error.decision.source,

      limit:
        error.decision.limitValue,

      used:
        error.decision.used,

      remaining:
        error.decision.remaining,
    },
  }
}