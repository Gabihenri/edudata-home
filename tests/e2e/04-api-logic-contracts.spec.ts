import { test, expect } from '@playwright/test'

/**
 * EDI-QI — API logic contracts
 *
 * These checks validate HTTP behavior and authorization boundaries without
 * requiring production credentials. Authenticated business-flow tests are
 * enabled separately when QA credentials are configured.
 */

test.describe('EDI-QI — contratos de API', () => {
  test('Agenda não deve expor dados sem autenticação', async ({ request }) => {
    const response = await request.get('/api/agenda/events')

    expect([401, 403]).toContain(response.status())

    const body = await response.text()
    expect(body).not.toMatch(/"data"\s*:\s*\[/i)
  })

  test('Evidências não devem expor dados sem autenticação', async ({ request }) => {
    const response = await request.get('/api/agenda/evidences')

    expect([401, 403]).toContain(response.status())

    const body = await response.text()
    expect(body).not.toMatch(/"data"\s*:\s*\[/i)
  })

  test('criação de evento sem autenticação não deve retornar sucesso', async ({ request }) => {
    const response = await request.post('/api/agenda/events', {
      data: {
        title: 'EDI-QI — evento de teste não autenticado',
        startAt: '2026-09-01T19:00:00.000Z',
      },
    })

    expect([401, 403]).toContain(response.status())
    expect(response.status()).not.toBe(201)
  })
})
