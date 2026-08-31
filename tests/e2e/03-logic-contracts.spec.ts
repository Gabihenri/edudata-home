import { test, expect } from '@playwright/test'

/**
 * EDI-QI — contratos gerais de lógica.
 * O objetivo é detectar regressões de comportamento, não apenas erros visuais.
 */

test.describe('EDI-QI — contratos de lógica', () => {
  test('redirecionamento inválido não deve permitir URL externa', async ({ page }) => {
    await page.goto('/login?redirectTo=https://example.com')
    await expect(page).toHaveURL(/\/login(?:\?|$)/)
  })

  test('aplicação não deve expor erro interno bruto na interface pública', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('body')).not.toContainText(/stack trace|internal server error|exception at/i)
  })
})
