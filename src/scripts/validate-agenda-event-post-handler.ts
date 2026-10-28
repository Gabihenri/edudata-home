import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createAgendaEventPostHandler,
  type AgendaEventPostDependencies,
} from '../lib/agenda/authorization/create-agenda-event-post-handler'
import { normalizeSchoolId } from '../lib/agenda/authorization/normalize-school-id'

const USER_ID = 'authenticated-user'
const SCHOOL_ID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8'

function makeRequest(body: unknown = {
  title: 'Evento de teste',
  startAt: '2026-10-28T15:00:00.000Z',
  schoolId: SCHOOL_ID,
  user_id: 'attacker-controlled-user',
}) {
  return new Request('http://localhost/api/agenda/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeDependencies(
  overrides: Partial<AgendaEventPostDependencies> = {},
): AgendaEventPostDependencies {
  return {
    requireSessionUser: async () => ({ id: USER_ID }),
    requireFeatureAccess: async () => undefined,
    normalizeSchoolId,
    assertActiveSchoolMembership: async () => undefined,
    createSchedule: async () => [{ id: 'event-1' }] as never,
    json: (body, init) => Response.json(body, init),
    createErrorResponse: (error, fallbackMessage) => {
      const message = error instanceof Error ? error.message : fallbackMessage
      const status = /não autenticado/i.test(message)
        ? 401
        : /sem permissão|proibido/i.test(message)
          ? 403
          : /inválido|obrigatório/i.test(message)
            ? 400
            : 500
      return Response.json({ success: false, error: message }, { status })
    },
    logError: () => undefined,
    ...overrides,
  }
}

test('retorna 401 sem sessão e não tenta criar evento', async () => {
  let createCalled = false
  const handler = createAgendaEventPostHandler(makeDependencies({
    requireSessionUser: async () => { throw new Error('Não autenticado.') },
    createSchedule: async () => {
      createCalled = true
      return [] as never
    },
  }))

  const response = await handler(makeRequest())
  assert.equal(response.status, 401)
  assert.equal(createCalled, false)
})

test('nega vínculo ausente, futuro ou expirado sem chamar o serviço de criação', async (t) => {
  const scenarios = [
    ['ausente', new Error('Sem permissão: vínculo institucional ausente.')],
    ['futuro', new Error('Sem permissão: vínculo ainda não começou.')],
    ['expirado', new Error('Sem permissão: vínculo expirado.')],
  ] as const

  for (const [label, denial] of scenarios) {
    await t.test(label, async () => {
      let createCalled = false
      const handler = createAgendaEventPostHandler(makeDependencies({
        assertActiveSchoolMembership: async () => { throw denial },
        createSchedule: async () => {
          createCalled = true
          return [] as never
        },
      }))

      const response = await handler(makeRequest())
      assert.equal(response.status, 403)
      assert.equal(createCalled, false)
    })
  }
})

test('falha fechado se a consulta institucional falhar', async () => {
  let createCalled = false
  const handler = createAgendaEventPostHandler(makeDependencies({
    assertActiveSchoolMembership: async () => {
      throw new Error('Não foi possível validar o vínculo institucional.')
    },
    createSchedule: async () => {
      createCalled = true
      return [] as never
    },
  }))

  const response = await handler(makeRequest())
  assert.equal(response.status, 500)
  assert.equal(createCalled, false)
})

test('retorna 201 com vínculo válido e usa sempre o usuário autenticado', async () => {
  let createdInput: Record<string, unknown> | undefined
  const handler = createAgendaEventPostHandler(makeDependencies({
    createSchedule: async (input) => {
      createdInput = input as unknown as Record<string, unknown>
      return [{ id: 'event-1' }] as never
    },
  }))

  const response = await handler(makeRequest())
  const payload = await response.json() as {
    success: boolean
    total: number
    data: Array<{ id: string }>
  }

  assert.equal(response.status, 201)
  assert.equal(payload.success, true)
  assert.equal(payload.total, 1)
  assert.equal(payload.data[0].id, 'event-1')
  assert.equal(createdInput?.user_id, USER_ID)
  assert.equal(createdInput?.school_id, SCHOOL_ID)
})
