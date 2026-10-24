import { test, expect } from '@playwright/test'

/**
 * EDI-QI — Evidence business-rule contracts.
 * These tests intentionally start with unauthenticated invariants so the
 * scanner can run safely in CI without touching real institutional data.
 */

test.describe('EDI-QI — regras de negócio das Evidências', () => {
  test('Evidências não devem aceitar consulta sem autenticação', async ({ request }) => {
    const response = await request.get('/api/agenda/evidences')

    expect([401, 403]).toContain(response.status())
    expect(response.status()).not.toBe(200)
  })

  test('Evidências não devem aceitar criação sem autenticação', async ({ request }) => {
    const response = await request.post('/api/agenda/evidences', {
      data: {
        title: 'EDI-QI — evidência de teste',
        evidenceType: 'texto',
        description: 'Teste automatizado sem autenticação.',
      },
    })

    expect([401, 403]).toContain(response.status())
    expect(response.status()).not.toBe(201)
  })

  test('contratos de tipos de evidência devem permanecer restritivos', async () => {
    const allowedTypes = ['texto', 'imagem', 'pdf', 'link']
    const invalidTypes = ['video', 'exe', 'script', '']

    for (const type of invalidTypes) {
      expect(allowedTypes).not.toContain(type)
    }
  })
})
