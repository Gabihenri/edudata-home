import { randomUUID } from 'node:crypto'

export type QaScenario = {
  runId: string
  ownerA: string
  ownerB: string
  eventTitle: string
  evidenceTitle: string
}

export function createQaScenario(): QaScenario {
  const runId = randomUUID()
  return {
    runId,
    ownerA: `edi-qi-a-${runId}`,
    ownerB: `edi-qi-b-${runId}`,
    eventTitle: `[EDI-QI:${runId}] Aula de teste`,
    evidenceTitle: `[EDI-QI:${runId}] Evidência de teste`,
  }
}

export function assertQaNamespace(value: string, runId: string) {
  if (!value.includes(`[EDI-QI:${runId}]`)) {
    throw new Error(`QA data outside expected namespace: ${value}`)
  }
}
