import assert from 'node:assert/strict'
import test from 'node:test'

import { createAfterAuthorization } from '../lib/agenda/authorization/create-after-authorization'

test('executa criação somente depois da autorização', async () => {
  const order: string[] = []
  const input = { title: 'Planejamento', user_id: 'authenticated-user' }

  const result = await createAfterAuthorization({
    input,
    authorize: async () => { order.push('authorize') },
    create: async (received) => {
      order.push('create')
      assert.deepEqual(received, input)
      return { id: 'event-1' }
    },
  })

  assert.deepEqual(order, ['authorize', 'create'])
  assert.deepEqual(result, { id: 'event-1' })
})

test('não executa criação quando a autorização é negada', async () => {
  let createCalled = false
  await assert.rejects(createAfterAuthorization({
    input: { title: 'Evento' },
    authorize: async () => { throw new Error('Sem permissão: vínculo institucional ausente.') },
    create: async () => { createCalled = true; return { id: 'event-1' } },
  }), /sem permissão/i)
  assert.equal(createCalled, false)
})

test('não executa criação quando a validação institucional falha', async () => {
  let createCalled = false
  await assert.rejects(createAfterAuthorization({
    input: { title: 'Evento' },
    authorize: async () => { throw new Error('Não foi possível validar o vínculo institucional.') },
    create: async () => { createCalled = true; return { id: 'event-1' } },
  }), /não foi possível validar/i)
  assert.equal(createCalled, false)
})
