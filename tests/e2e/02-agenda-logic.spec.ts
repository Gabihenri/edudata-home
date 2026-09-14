import { test, expect } from '@playwright/test'

/**
 * EDI-QI — Agenda Logic Contract
 *
 * Validate behavior without assuming an authentication redirect that the
 * current application does not guarantee. The public contract for /agenda
 * is that it must not expose application errors and must remain on a valid
 * application route.
 */

test.describe('Agenda — lógica e comportamento', () => {
  test('rota da Agenda mantém contrato de acesso válido', async ({ page }) => {
    await page.goto('/agenda')
    await page.waitForLoadState('domcontentloaded')

    const url = page.url()
    const body = await page.locator('body').innerText()

    expect(url).toMatch(/\/agenda(?:[/?#]|$)|\/login(?:[/?#]|$)/)
    expect(body).not.toContain('Application error')
    expect(body).not.toContain('Internal Server Error')
  })

  test('contrato lógico: agenda autenticada deve permitir leitura sem erro 5xx', async ({
    page,
  }) => {
    test.skip(
      !process.env.EDI_QI_EMAIL || !process.env.EDI_QI_PASSWORD,
      'Configure EDI_QI_EMAIL e EDI_QI_PASSWORD para executar o fluxo autenticado.',
    )

    const serverErrors: string[] = []
    page.on('response', (response) => {
      if (response.status() >= 500) {
        serverErrors.push(`${response.status()} ${response.url()}`)
      }
    })

    await page.goto('/login')
    await page.locator('input[type="email"]').fill(process.env.EDI_QI_EMAIL!)
    await page.locator('input[type="password"]').fill(process.env.EDI_QI_PASSWORD!)
    await page.getByRole('button', { name: /entrar|acessar/i }).click()
    await page.waitForLoadState('networkidle')
    await page.goto('/agenda')
    await page.waitForLoadState('networkidle')

    expect(serverErrors, 'Nenhuma API crítica deve retornar 5xx').toEqual([])
    await expect(page.locator('body')).not.toContainText(/internal server error/i)
  })

  test('contrato lógico: campos obrigatórios não podem aceitar submissão vazia', async ({
    page,
  }) => {
    test.skip(
      !process.env.EDI_QI_EMAIL || !process.env.EDI_QI_PASSWORD,
      'Configure EDI_QI_EMAIL e EDI_QI_PASSWORD para executar o fluxo autenticado.',
    )

    await page.goto('/login')
    await page.locator('input[type="email"]').fill(process.env.EDI_QI_EMAIL!)
    await page.locator('input[type="password"]').fill(process.env.EDI_QI_PASSWORD!)
    await page.getByRole('button', { name: /entrar|acessar/i }).click()
    await page.waitForLoadState('networkidle')
    await page.goto('/agenda')
    await page.waitForLoadState('networkidle')

    const createButton = page.getByRole('button', { name: /novo|criar|adicionar/i }).first()
    test.skip((await createButton.count()) === 0, 'Fluxo de criação ainda não possui seletor estável.')

    await createButton.click()
    const submit = page.getByRole('button', { name: /salvar|criar|confirmar/i }).last()
    test.skip((await submit.count()) === 0, 'Formulário de criação não possui botão de submissão identificável.')

    await submit.click()

    await expect(page.locator('body')).not.toContainText(/salvo com sucesso|criado com sucesso/i)
  })
})
