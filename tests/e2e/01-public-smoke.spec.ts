import { expect, test } from '@playwright/test'

test.describe('EDI-QI | acesso público', () => {
  test('Home Estratégica carrega sem erro', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })

    await page.goto('/')
    await expect(page).toHaveTitle(/EduData/i)
    await expect(page.locator('body')).not.toContainText('Application error')
    await expect(page.locator('body')).not.toContainText('Internal Server Error')

    expect(consoleErrors, `Erros de console encontrados: ${consoleErrors.join('\n')}`).toEqual([])
  })

  test('Tela de login apresenta os controles essenciais', async ({ page }) => {
    await page.goto('/login')

    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /Google/i })).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Application error')
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('Rota protegida da Agenda não expõe erro de aplicação', async ({ page }) => {
    await page.goto('/agenda')
    await page.waitForLoadState('domcontentloaded')

    const url = page.url()
    const body = await page.locator('body').innerText()

    expect(body).not.toContain('Application error')
    expect(body).not.toContain('Internal Server Error')
    expect(url).toMatch(/\/agenda|\/login/)
  })
})
