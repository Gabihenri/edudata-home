import { test, expect } from '@playwright/test'

/**
 * EDI-QI — Agenda Logic Contract
 *
 * These tests intentionally validate behavior, not only visual rendering.
 * They are skipped until a dedicated QA account is configured, so CI never
 * depends on production credentials.
 */

test.describe('Agenda — lógica e comportamento', () => {
  test('rota protegida exige autenticação', async ({ page }) => {
    await page.goto('/agenda')

    await expect(page).toHaveURL(/\/login(?:\?|$)/)
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
    await page.getByLabel(/e-mail/i).fill(process.env.EDI_QI_EMAIL!)
    await page.getByLabel(/senha/i).fill(process.env.EDI_QI_PASSWORD!)
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
    await page.getByLabel(/e-mail/i).fill(process.env.EDI_QI_EMAIL!)
    await page.getByLabel(/senha/i).fill(process.env.EDI_QI_PASSWORD!)
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

    // O contrato mínimo: uma submissão vazia não pode produzir sucesso.
    await expect(page.locator('body')).not.toContainText(/salvo com sucesso|criado com sucesso/i)
  })
})
