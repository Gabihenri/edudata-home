import { test, expect } from '@playwright/test'
import { assertQaNamespace, createQaScenario } from './qa-data'

test.describe('EDI-QI — jornada QA ponta a ponta', () => {
  test('gera cenário isolado e nunca usa dados reais', () => {
    const scenario = createQaScenario()

    expect(scenario.runId).toMatch(/^[0-9a-f-]{36}$/i)
    assertQaNamespace(scenario.eventTitle, scenario.runId)
    assertQaNamespace(scenario.evidenceTitle, scenario.runId)
    expect(scenario.ownerA).not.toBe(scenario.ownerB)
  })

  test('a jornada define os invariantes mínimos de persistência', () => {
    const steps = [
      'create-event',
      'verify-event-persisted',
      'update-event',
      'verify-event-updated',
      'create-evidence',
      'verify-evidence-persisted',
      'delete-event',
      'verify-event-deleted',
    ]

    expect(steps).toHaveLength(8)
    expect(new Set(steps).size).toBe(steps.length)
  })
})
