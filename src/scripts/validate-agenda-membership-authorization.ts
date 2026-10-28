import assert from 'node:assert/strict'
import test from 'node:test'

import { assertActiveSchoolMembership } from '../lib/agenda/authorization/assert-active-school-membership'

const USER_ID = 'user-123'
const SCHOOL_ID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8'
const NOW = Date.parse('2026-10-27T12:00:00.000Z')

test('permite criação quando existe vínculo ativo para o usuário e escola consultados', async () => {
  let received: [string, string] | undefined

  await assertActiveSchoolMembership(
    USER_ID,
    SCHOOL_ID,
    async (userId, schoolId) => {
      received = [userId, schoolId]
      return {
        data: [{ access_starts_at: null, access_ends_at: null }],
        error: null,
      }
    },
    NOW,
  )

  assert.deepEqual(received, [USER_ID, SCHOOL_ID])
})

test('nega criação quando a consulta não encontra vínculo para a escola informada', async () => {
  await assert.rejects(
    assertActiveSchoolMembership(
      USER_ID,
      SCHOOL_ID,
      async () => ({ data: [], error: null }),
      NOW,
    ),
    /sem permissão/i,
  )
})

test('nega criação quando o único vínculo ainda não começou ou já expirou', async () => {
  await assert.rejects(
    assertActiveSchoolMembership(
      USER_ID,
      SCHOOL_ID,
      async () => ({
        data: [
          {
            access_starts_at: '2026-10-27T12:01:00.000Z',
            access_ends_at: null,
          },
          {
            access_starts_at: null,
            access_ends_at: '2026-10-27T12:00:00.000Z',
          },
        ],
        error: null,
      }),
      NOW,
    ),
    /sem permissão/i,
  )
})

test('falha fechado se a consulta institucional falhar', async () => {
  await assert.rejects(
    assertActiveSchoolMembership(
      USER_ID,
      SCHOOL_ID,
      async () => ({
        data: null,
        error: new Error('database unavailable'),
      }),
      NOW,
    ),
    /não foi possível validar/i,
  )
})

test('não consulta vínculo quando o evento não informa escola', async () => {
  let called = false

  await assertActiveSchoolMembership(
    USER_ID,
    null,
    async () => {
      called = true
      return { data: [], error: null }
    },
    NOW,
  )

  assert.equal(called, false)
})
