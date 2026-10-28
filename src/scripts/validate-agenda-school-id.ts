import assert from 'node:assert/strict'

import { normalizeSchoolId } from '../lib/agenda/authorization/normalize-school-id'

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

console.log('AGENDA SCHOOL ID VALIDATION: PASS (12 assertions)')
