/** EduData IA — EIOS Governance Core — Audit Engine 1.0 */

import type {
  CreateEiosAuditEventInput,
  EiosAuditChainValidation,
  EiosAuditEvent,
  EiosAuditJson,
} from './audit.types'

const ENGINE_VERSION = '1.0.0'

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  const record = value as Record<string, unknown>
  const keys = Object.keys(record).sort()

  return `{${keys
    .map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`
}

function fnv1a32(value: string): string {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

function normalizeRequired(value: string, field: string): string {
  const normalized = value.trim()
  if (!normalized) throw new Error(`${field} é obrigatório.`)
  return normalized
}

function toAuditJson(value: unknown): EiosAuditJson {
  return value as EiosAuditJson
}

export function createEiosAuditEvent(
  input: CreateEiosAuditEventInput,
): EiosAuditEvent {
  const occurredAt = input.occurredAt ?? new Date().toISOString()
  const correlationId = normalizeRequired(input.correlationId, 'correlationId')
  const actorId = normalizeRequired(input.actor.id, 'actor.id')
  const resourceId = normalizeRequired(input.resource.id, 'resource.id')

  const hashPayload = {
    capability: input.capability,
    action: input.action,
    severity: input.severity ?? 'info',
    occurredAt,
    actor: { ...input.actor, id: actorId },
    resource: { ...input.resource, id: resourceId },
    engine: input.engine ?? null,
    sourceProduct: input.sourceProduct ?? null,
    frameworkVersion: input.frameworkVersion ?? null,
    eiosVersion: input.eiosVersion ?? null,
    reason: input.reason ?? null,
    previousState: input.previousState ?? null,
    newState: input.newState ?? null,
    metadata: input.metadata ?? {},
    correlationId,
    causationId: input.causationId ?? null,
    requestId: input.requestId ?? null,
    sessionId: input.sessionId ?? null,
    traceId: input.traceId ?? null,
    previousEventHash: input.previousEventHash ?? null,
  }

  const eventHash = fnv1a32(stableStringify(hashPayload))
  const id = `audit-${eventHash}-${occurredAt.replace(/[^0-9]/g, '').slice(0, 14)}`

  return {
    id,
    schemaVersion: '1.0.0',
    capability: input.capability,
    action: input.action,
    severity: input.severity ?? 'info',
    occurredAt,
    actor: { ...input.actor, id: actorId },
    resource: { ...input.resource, id: resourceId },
    engine: input.engine ?? null,
    sourceProduct: input.sourceProduct ?? null,
    frameworkVersion: input.frameworkVersion ?? null,
    eiosVersion: input.eiosVersion ?? null,
    reason: input.reason ?? null,
    previousState: input.previousState === undefined ? null : toAuditJson(input.previousState),
    newState: input.newState === undefined ? null : toAuditJson(input.newState),
    metadata: input.metadata ?? {},
    trace: {
      eventId: id,
      correlationId,
      causationId: input.causationId ?? null,
      requestId: input.requestId ?? null,
      sessionId: input.sessionId ?? null,
      traceId: input.traceId ?? null,
    },
    integrity: {
      hashAlgorithm: 'fnv1a32',
      previousEventHash: input.previousEventHash ?? null,
      eventHash,
    },
  }
}

export function validateEiosAuditChain(
  events: EiosAuditEvent[],
): EiosAuditChainValidation {
  const errors: string[] = []
  let firstInvalidEventId: string | null = null

  for (let index = 0; index < events.length; index += 1) {
    const current = events[index]
    const previous = events[index - 1]

    if (index > 0 && current.integrity.previousEventHash !== previous.integrity.eventHash) {
      firstInvalidEventId ??= current.id
      errors.push(`Cadeia inválida no evento ${current.id}.`)
    }
  }

  return {
    valid: errors.length === 0,
    totalEvents: events.length,
    firstInvalidEventId,
    errors,
    validatedAt: new Date().toISOString(),
  }
}

export function getAuditEngineInfo() {
  return {
    name: 'eios-governance-audit-engine',
    version: ENGINE_VERSION,
    deterministic: true,
    immutableEventModel: true,
    integrityHash: 'fnv1a32',
  }
}
