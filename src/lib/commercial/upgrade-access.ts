export type UpgradeAccessReason =
  | 'feature_disabled'
  | 'quota_exceeded'
  | string

export type UpgradeAccessContext = {
  featureCode: string
  featureName: string | null

  currentPlanCode: string | null
  currentPlanName: string | null

  reason: UpgradeAccessReason | null

  errorMessage: string
}

type UnknownRecord =
  Record<string, unknown>

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function normalizeOptionalText(
  value: unknown,
): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue =
    value.trim()

  return normalizedValue || null
}

function readBoolean(
  value: unknown,
): boolean | null {
  return typeof value === 'boolean'
    ? value
    : null
}

export function getApiErrorMessage(
  payload: unknown,
  fallbackMessage: string,
): string {
  if (!isRecord(payload)) {
    return fallbackMessage
  }

  return (
    normalizeOptionalText(
      payload.error,
    ) ??
    normalizeOptionalText(
      payload.message,
    ) ??
    fallbackMessage
  )
}

export function parseUpgradeAccessResponse(
  payload: unknown,
): UpgradeAccessContext | null {
  if (!isRecord(payload)) {
    return null
  }

  const access =
    isRecord(payload.access)
      ? payload.access
      : null

  if (!access) {
    return null
  }

  const featureCode =
    normalizeOptionalText(
      access.featureCode,
    )

  if (!featureCode) {
    return null
  }

  const reason =
    normalizeOptionalText(
      access.reason,
    )

  const upgradeRequired =
    readBoolean(
      payload.upgradeRequired,
    )

  const representsCommercialBlock =
    upgradeRequired === true ||
    reason ===
      'feature_disabled' ||
    reason ===
      'quota_exceeded'

  if (
    !representsCommercialBlock
  ) {
    return null
  }

  return {
    featureCode:
      featureCode.toLowerCase(),

    featureName:
      normalizeOptionalText(
        access.featureName,
      ),

    currentPlanCode:
      normalizeOptionalText(
        access.currentPlan,
      ),

    currentPlanName:
      normalizeOptionalText(
        access.currentPlanName,
      ),

    reason,

    errorMessage:
      getApiErrorMessage(
        payload,
        'Este recurso não está disponível no plano atual.',
      ),
  }
}

export function isUpgradeAccessResponse(
  payload: unknown,
): boolean {
  return (
    parseUpgradeAccessResponse(
      payload,
    ) !== null
  )
}