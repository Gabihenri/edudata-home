import assert from 'node:assert/strict';

// Agenda -> Escala contract, aligned with the Agenda schema.
// Synthetic-only tests; no live data or production integration.

const ACTIVE_STATUSES = new Set([
  'active', 'ativo', 'in_progress', 'in_progression', 'em_andamento',
  'em_acompanhamento', 'em_preparacao', 'scheduled', 'agendado',
  'agendada', 'planned', 'planejado', 'planejada', 'rescheduled',
  'reagendado', 'reagendada', 'pending', 'pendente', 'draft', 'rascunho',
  'open', 'aberto', 'aberta', 'todo', 'to_do', 'not_started',
  'nao_iniciado', 'nao_iniciada',
]);
const INACTIVE_STATUSES = new Set([
  'cancelled', 'canceled', 'cancelado', 'cancelada', 'archived',
  'arquivado', 'arquivada', 'suspended', 'suspenso', 'suspensa',
  'completed', 'complete', 'concluido', 'concluida', 'finished',
  'finalizado', 'finalizada', 'done', 'realizado', 'realizada',
]);
function validInterval(startAt, endAt) {
  const start = Date.parse(startAt), end = Date.parse(endAt);
  return Number.isFinite(start) && Number.isFinite(end) && end > start;
}
function overlaps(a, b) {
  return Date.parse(a.start_at) < Date.parse(b.end_at)
    && Date.parse(b.start_at) < Date.parse(a.end_at);
}
function agendaEventToCommitment(event, blockingTypePolicy) {
  const status = String(event.status ?? '').trim().toLowerCase();
  if (!ACTIVE_STATUSES.has(status) || INACTIVE_STATUSES.has(status)) return null;
  if (!blockingTypePolicy?.(event.event_type)) return null;
  if (!event.id || !validInterval(event.start_at, event.end_at)) return null;
  return {
    source: 'agenda',
    source_event_id: event.id,
    event_type: event.event_type,
    start_at: event.start_at,
    end_at: event.end_at,
  };
}
function candidateBlockedByAgenda(candidate, vacancy) {
  return candidate.commitments.some(c => c.source === 'agenda' && overlaps(c, vacancy));
}
const base = {
  id: 'agenda-event-01', title: 'Reunião pedagógica',
  event_type: 'reuniao_pedagogica', status: 'planejado',
  start_at: '2026-11-25T12:00:00-03:00',
  end_at: '2026-11-25T13:00:00-03:00',
};
const isBlockingType = type => type === 'reuniao_pedagogica';
let passed = 0;
function test(id, desc, fn) { fn(); passed++; console.log(`PASS ${id} — ${desc}`); }

test('AE-01', 'campos reais Agenda: event_type, start_at, end_at', () => {
  assert.deepEqual(agendaEventToCommitment(base, isBlockingType), {
    source: 'agenda', source_event_id: 'agenda-event-01',
    event_type: 'reuniao_pedagogica',
    start_at: base.start_at, end_at: base.end_at,
  });
});
test('AE-02', 'evento não bloqueia sem política de tipo explícita', () => {
  assert.equal(agendaEventToCommitment(base, null), null);
});
test('AE-03', 'cancelado não gera compromisso', () => {
  assert.equal(agendaEventToCommitment({...base, status: 'cancelado'}, isBlockingType), null);
});
test('AE-04', 'realizado/concluído não bloqueia período futuro', () => {
  assert.equal(agendaEventToCommitment({...base, status: 'realizado'}, isBlockingType), null);
});
test('AE-05', 'sobreposição parcial bloqueia', () => {
  const candidate = {commitments: [agendaEventToCommitment(base, isBlockingType)]};
  assert.equal(candidateBlockedByAgenda(candidate, {
    start_at: '2026-11-25T12:30:00-03:00', end_at: '2026-11-25T13:20:00-03:00',
  }), true);
});
test('AE-06', 'intervalos adjacentes não conflitam', () => {
  const candidate = {commitments: [agendaEventToCommitment(base, isBlockingType)]};
  assert.equal(candidateBlockedByAgenda(candidate, {
    start_at: '2026-11-25T13:00:00-03:00', end_at: '2026-11-25T13:50:00-03:00',
  }), false);
});
test('AE-07', 'dia diferente não conflita', () => {
  const candidate = {commitments: [agendaEventToCommitment(base, isBlockingType)]};
  assert.equal(candidateBlockedByAgenda(candidate, {
    start_at: '2026-11-26T12:30:00-03:00', end_at: '2026-11-26T13:20:00-03:00',
  }), false);
});
test('AE-08', 'end_at ausente/inválido é rejeitado', () => {
  assert.equal(agendaEventToCommitment({...base, end_at: null}, isBlockingType), null);
  assert.equal(agendaEventToCommitment({...base, end_at: '2026-11-25T11:00:00-03:00'}, isBlockingType), null);
});
console.log(`AGENDA–ESCALA CONTRACT: PASS (${passed}/8)`);
