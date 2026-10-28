import assert from 'node:assert/strict'

import { normalizeSchoolId } from '../lib/agenda/authorization/normalize-school-id'
import { hasCurrentActiveSchoolMembership } from '../lib/agenda/authorization/school-membership-period'

const validSchoolId = '550e8400-e29b-41d4-a716-446655440000'

assert.equal(normalizeSchoolId(validSchoolId), validSchoolId)
assert.equal(normalizeSchoolId(`  ${validSchoolId}  `), validSchoolId)
assert.equal(normalizeSchoolId(undefined), null)
assert.equal(normalizeSchoolId(null), null)
assert.equal(normalizeSchoolId(''), null)
assert.equal(normalizeSchoolId('   '), null)

for (const invalidValue of [123, {}, [], true, 'not-a-uuid', '550e8400-e29b-41d4-a716']) {
  assert.throws(
    () => normalizeSchoolId(invalidValue),
    /Identificador da escola é inválido\./,
  )
}

const now = Date.parse('2026-10-27T12:00:00.000Z')

assert.equal(hasCurrentActiveSchoolMembership([], now), false)
assert.equal(
  hasCurrentActiveSchoolMembership(
    [{ access_starts_at: '2026-10-01T00:00:00.000Z', access_ends_at: '2026-11-01T00:00:00.000Z' }],
    now,
  ),
  true,
)
assert.equal(
  hasCurrentActiveSchoolMembership(
    [{ access_starts_at: '2026-10-28T00:00:00.000Z', access_ends_at: null }],
    now,
  ),
  false,
)
assert.equal(
  hasCurrentActiveSchoolMembership(
    [{ access_starts_at: null, access_ends_at: '2026-10-26T23:59:59.000Z' }],
    now,
  ),
  false,
)
assert.equal(
  hasCurrentActiveSchoolMembership(
    [{ access_starts_at: null, access_ends_at: '2026-10-27T12:00:00.000Z' }],
    now,
  ),
  false,
)
assert.equal(
  hasCurrentActiveSchoolMembership(
    [{ access_starts_at: 'invalid-date', access_ends_at: null }],
    now,
  ),
  false,
)
assert.equal(
  hasCurrentActiveSchoolMembership(
    [{ access_starts_at: null, access_ends_at: 'invalid-date' }],
    now,
  ),
  false,
)
assert.equal(
  hasCurrentActiveSchoolMembership(
    [{ access_starts_at: null, access_ends_at: null }],
    now,
  ),
  true,
)

console.log('AGENDA AUTHORIZATION VALIDATION: PASS (20 assertions)')
