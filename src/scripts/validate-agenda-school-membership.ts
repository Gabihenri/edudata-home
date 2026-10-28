import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeSchoolId } from '../lib/agenda/authorization/normalize-school-id'
import { hasCurrentActiveSchoolMembership } from '../lib/agenda/authorization/school-membership-period'

const NOW = Date.parse('2026-10-27T12:00:00.000Z')
const SCHOOL_ID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8'

test('normaliza escola UUID com espaços externos', () => {
  assert.equal(normalizeSchoolId(`  ${SCHOOL_ID}  `), SCHOOL_ID)
})

test('aceita evento sem escola quando o campo está ausente, nulo ou vazio', () => {
  assert.equal(normalizeSchoolId(undefined), null)
  assert.equal(normalizeSchoolId(null), null)
  assert.equal(normalizeSchoolId('   '), null)
})

test('rejeita identificador de escola com tipo ou formato inválido', () => {
  assert.throws(() => normalizeSchoolId(123), /inválido/i)
  assert.throws(() => normalizeSchoolId('not-a-uuid'), /inválido/i)
})

test('aceita vínculo ativo sem limites de acesso', () => {
  assert.equal(
    hasCurrentActiveSchoolMembership(
      [{ access_starts_at: null, access_ends_at: null }],
      NOW,
    ),
    true,
  )
})

test('aceita vínculo cujo início já ocorreu e fim ainda não chegou', () => {
  assert.equal(
    hasCurrentActiveSchoolMembership(
      [{
        access_starts_at: '2026-10-27T11:59:59.000Z',
        access_ends_at: '2026-10-27T12:00:01.000Z',
      }],
      NOW,
    ),
    true,
  )
})

test('nega vínculo com início futuro', () => {
  assert.equal(
    hasCurrentActiveSchoolMembership(
      [{
        access_starts_at: '2026-10-27T12:00:01.000Z',
        access_ends_at: null,
      }],
      NOW,
    ),
    false,
  )
})

test('nega vínculo expirado e trata o limite final como exclusivo', () => {
  assert.equal(
    hasCurrentActiveSchoolMembership(
      [{
        access_starts_at: null,
        access_ends_at: '2026-10-27T11:59:59.000Z',
      }],
      NOW,
    ),
    false,
  )
  assert.equal(
    hasCurrentActiveSchoolMembership(
      [{
        access_starts_at: null,
        access_ends_at: '2026-10-27T12:00:00.000Z',
      }],
      NOW,
    ),
    false,
  )
})

test('falha fechado para datas inválidas e só aceita se algum vínculo for atual', () => {
  assert.equal(
    hasCurrentActiveSchoolMembership(
      [{ access_starts_at: 'data-inválida', access_ends_at: null }],
      NOW,
    ),
    false,
  )
  assert.equal(
    hasCurrentActiveSchoolMembership(
      [
        { access_starts_at: '2026-10-27T12:01:00.000Z', access_ends_at: null },
        { access_starts_at: null, access_ends_at: '2026-10-27T11:00:00.000Z' },
        { access_starts_at: null, access_ends_at: null },
      ],
      NOW,
    ),
    true,
  )
})
