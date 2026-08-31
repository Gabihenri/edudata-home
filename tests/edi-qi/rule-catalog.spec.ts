import { test, expect } from '@playwright/test'
import rules from './rules.json'

test.describe('EDI-QI — catálogo de regras', () => {
  test('todas as regras possuem contrato mínimo', () => {
    expect(rules.version).toBe(1)
    expect(rules.rules.length).toBeGreaterThan(0)

    for (const rule of rules.rules) {
      expect(rule.id).toMatch(/^[A-Z]+-\d{3}$/)
      expect(rule.area).toBeTruthy()
      expect(['critical', 'high', 'medium', 'low']).toContain(rule.severity)
      expect(rule.description.length).toBeGreaterThan(10)
    }
  })

  test('regras críticas existem para autenticação, Agenda, Evidências e RLS', () => {
    const criticalAreas = new Set(
      rules.rules.filter((rule) => rule.severity === 'critical').map((rule) => rule.area),
    )

    expect(criticalAreas).toEqual(
      expect.objectContaining({
        auth: expect.anything(),
        agenda: expect.anything(),
        evidences: expect.anything(),
        security: expect.anything(),
      }),
    )
  })
})
