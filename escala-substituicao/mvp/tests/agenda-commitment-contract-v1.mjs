import assert from 'node:assert/strict';

// Contract tests for the future Agenda -> Escala commitment adapter.
// This test uses no real school data and does not claim live Agenda integration.

function overlaps(a, b) {
  return a.start < b.end && b.start < a.end;
}

function isBlockingAgendaEvent(event) {
  return event.status === 'CONFIRMED'
    && event.blocks_substitution === true
    && typeof event.start_time === 'string'
    && typeof event.end_time === 'string'
    && event.end_time > event.start_time;
}

function agendaEventToCommitment(event) {
  if (!isBlockingAgendaEvent(event)) return null;
  return {
    source: 'agenda',
    source_event_id: event.id,
    day: event.day,
    start: event.start_time,
    end: event.end_time,
    type: event.type,
  };
}

function candidateBlockedByAgenda(candidate, vacancy) {
  return candidate.commitments.some(commitment =>
    commitment.source === 'agenda'
    && commitment.day === vacancy.day
    && overlaps(
      { start: commitment.start, end: commitment.end },
      { start: vacancy.start_time, end: vacancy.end_time },
    )
  );
}

const baseEvent = {
  id: 'agenda-event-01',
  day: 'qua',
  type: 'REUNIAO_PEDAGOGICA',
  status: 'CONFIRMED',
  blocks_substitution: true,
  start_time: '09:00',
  end_time: '10:00',
};

let passed = 0;
function test(id, description, assertion) {
  assertion();
  passed += 1;
  console.log(`PASS ${id} — ${description}`);
}

test('AE-01', 'evento confirmado e explicitamente bloqueante vira compromisso', () => {
  const commitment = agendaEventToCommitment(baseEvent);
  assert.deepEqual(commitment, {
    source: 'agenda',
    source_event_id: 'agenda-event-01',
    day: 'qua',
    start: '09:00',
    end: '10:00',
    type: 'REUNIAO_PEDAGOGICA',
  });
});

test('AE-02', 'evento cancelado não bloqueia candidato', () => {
  assert.equal(agendaEventToCommitment({ ...baseEvent, status: 'CANCELLED' }), null);
});

test('AE-03', 'evento sem flag explícita de bloqueio não bloqueia candidato', () => {
  assert.equal(agendaEventToCommit({ ...baseEvent, blocks_substitution: false }), null);
});

test('AE-04', 'intervalos parcialmente sobrepostos bloqueiam', () => {
  const candidate = { commitments: [agendaEventToCommit(baseEvent)] };
  const vacancy = { day: 'qua', start_time: '09:30', end_time: '10:20' };
  assert.equal(candidateBlockedByAgenda(candidate, vacancy), true);
});

test('AE-05', 'intervalos adjacentes não bloqueiam', () => {
  const candidate = { commitments: [agendaEventToCommit(baseEvent)] };
  const vacancy = { day: 'qua', start_time: '10:00', end_time: '10:50' };
  assert.equal(candidateBlockedByAgenda(candidate, vacancy), false);
});

test('AE-06', 'evento em outro dia não bloqueia', () => {
  const candidate = { commitments: [agendaEventToCommit(baseEvent)] };
  const vacancy = { day: 'qui', start_time: '09:30', end_time: '10:20' };
  assert.equal(candidateBlockedByAgenda(candidate, vacancy), false);
});

test('AE-07', 'evento com intervalo inválido é rejeitado', () => {
  assert.equal(agendaEventToCommitment({ ...baseEvent, end_time: '08:30' }), null);
});

console.log(`AGENDA–ESCALA COMMITMENT CONTRACT V1: PASS (${passed}/7)`);
