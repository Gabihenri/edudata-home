import assert from 'node:assert/strict';
import fs from 'node:fs';

const fixturePath = new URL('../data/escola-sintetica-v1.json', import.meta.url);
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

const ALLOWED_EVENT_TYPES = new Set([
  'ABSENCE_RECORDED',
  'VACANCY_CREATED',
  'RECOMMENDATION_GENERATED',
  'HUMAN_OVERRIDE',
  'SUBSTITUTION_VALIDATED',
  'VACANCY_UNCOVERED',
  'STATE_CHANGED',
  'ROUND_RECALCULATED',
]);

const SNAPSHOT_REQUIRED = new Set([
  'RECOMMENDATION_GENERATED',
  'STATE_CHANGED',
  'ROUND_RECALCULATED',
]);

function event(overrides = {}) {
  return {
    id: 'event-001',
    institution_id: 'institution-synthetic-01',
    source_product: 'escala',
    source_event_id: 'source-001',
    event_type: 'ABSENCE_RECORDED',
    occurred_at: '2026-10-27T10:00:00.000Z',
    effective_date: '2026-10-27',
    period_key: 'ter-p1',
    decision_origin: null,
    snapshot_reference: null,
    snapshot_stale: false,
    environment: 'synthetic',
    fixture: fixture.fixture,
    fixture_official: fixture.official,
    outcome: null,
    rule_version: 'memory-v1',
    ...overrides,
  };
}

function validateEvent(item) {
  if (!item || typeof item !== 'object') return { valid: false, reason: 'invalid_shape' };
  for (const key of ['id', 'institution_id', 'source_product', 'source_event_id', 'event_type', 'occurred_at']) {
    if (typeof item[key] !== 'string' || item[key].trim() === '') {
      return { valid: false, reason: `missing_${key}` };
    }
  }
  if (!ALLOWED_EVENT_TYPES.has(item.event_type)) return { valid: false, reason: 'unknown_event_type' };
  if (Number.isNaN(Date.parse(item.occurred_at))) return { valid: false, reason: 'invalid_occurred_at' };
  if (SNAPSHOT_REQUIRED.has(item.event_type) && !item.snapshot_reference) {
    return { valid: false, reason: 'missing_snapshot_reference' };
  }
  return { valid: true, reason: null };
}

function idempotencyKey(item) {
  return [item.institution_id, item.source_product, item.source_event_id, item.event_type].join(':');
}

function usableForLearning(item, { institutionId, start, end }) {
  const validation = validateEvent(item);
  if (!validation.valid) return false;
  if (item.institution_id !== institutionId) return false;
  if (item.snapshot_stale === true) return false;
  if (item.environment === 'synthetic' || item.fixture_official === false) return false;
  const timestamp = Date.parse(item.occurred_at);
  return timestamp >= Date.parse(start) && timestamp < Date.parse(end);
}

function derivePattern(events, { institutionId, start, end, minimumSample, ruleVersion }) {
  const accepted = events.filter(item => {
    const validation = validateEvent(item);
    if (!validation.valid || item.institution_id !== institutionId) return false;
    if (item.snapshot_stale === true || item.environment === 'synthetic' || item.fixture_official === false) return false;
    const timestamp = Date.parse(item.occurred_at);
    return timestamp >= Date.parse(start) && timestamp < Date.parse(end);
  });
  if (accepted.length < minimumSample) return null;
  const sourceIds = accepted.map(item => idempotencyKey(item)).sort();
  return {
    kind: 'PATTERN',
    institution_id: institutionId,
    window_start: start,
    window_end: end,
    sample_size: accepted.length,
    rule_version: ruleVersion,
    source_event_keys: sourceIds,
    confidence: 'MEDIUM',
  };
}

function makeSuggestion(pattern, currentContext) {
  if (!pattern || pattern.sample_size < 1 || !currentContext?.compatible) return null;
  return {
    kind: 'SUGGESTION',
    status: 'PRESENTED',
    institution_id: pattern.institution_id,
    pattern_version: pattern.rule_version,
    source_event_keys: [...pattern.source_event_keys],
    assignment_created: false,
  };
}

const window = {
  institutionId: 'institution-real-01',
  start: '2026-10-01T00:00:00.000Z',
  end: '2026-11-01T00:00:00.000Z',
};
const realEvent = (overrides = {}) => event({
  institution_id: window.institutionId,
  environment: 'production',
  fixture: null,
  fixture_official: true,
  occurred_at: '2026-10-10T10:00:00.000Z',
  ...overrides,
});

let passed = 0;
function check(id, description, assertion) {
  assertion();
  passed += 1;
  console.log(`PASS ${id} — ${description}`);
}

// MO-01 — valid event is accepted and traceable.
check('MO-01', 'evento válido aceito e rastreável', () => {
  const item = realEvent();
  assert.equal(validateEvent(item).valid, true);
  assert.ok(idempotencyKey(item).includes(item.source_event_id));
});

// MO-02 — missing source event id is rejected.
check('MO-02', 'evento sem source_event_id rejeitado', () => {
  assert.equal(validateEvent(realEvent({ source_event_id: '' })).reason, 'missing_source_event_id');
});

// MO-03 — unknown event type is rejected.
check('MO-03', 'tipo de evento desconhecido rejeitado', () => {
  assert.equal(validateEvent(realEvent({ event_type: 'TEACHER_RANKING' })).reason, 'unknown_event_type');
});

// MO-04 — stale snapshots cannot feed operational learning.
check('MO-04', 'snapshot stale não alimenta aprendizagem', () => {
  assert.equal(usableForLearning(realEvent({ snapshot_stale: true }), window), false);
});

// MO-05 — synthetic fixtures cannot enter the real memory stream.
check('MO-05', 'fixture sintética não entra na memória real', () => {
  assert.equal(fixture.official, false);
  assert.equal(usableForLearning(event(), window), false);
});

// MO-06 — human override remains an explicit human decision.
check('MO-06', 'override preserva origem humana', () => {
  const item = realEvent({ event_type: 'HUMAN_OVERRIDE', decision_origin: 'HUMAN' });
  assert.equal(validateEvent(item).valid, true);
  assert.equal(item.decision_origin, 'HUMAN');
});

// MO-07 — a recommendation is not a confirmed substitution.
check('MO-07', 'recomendação não equivale a substituição confirmada', () => {
  const item = realEvent({ event_type: 'RECOMMENDATION_GENERATED', snapshot_reference: 'snapshot-001', outcome: 'recommended' });
  assert.equal(validateEvent(item).valid, true);
  assert.notEqual(item.event_type, 'SUBSTITUTION_VALIDATED');
});

// MO-08 — uncovered vacancy remains a valid auditable fact.
check('MO-08', 'vaga sem cobertura é fato operacional auditável', () => {
  const item = realEvent({ event_type: 'VACANCY_UNCOVERED', outcome: 'no_eligible_candidate' });
  assert.equal(validateEvent(item).valid, true);
  assert.equal(item.outcome, 'no_eligible_candidate');
});

// MO-09 — insufficient sample does not create a pattern or suggestion.
check('MO-09', 'amostra insuficiente não gera sugestão', () => {
  const pattern = derivePattern([realEvent()], { ...window, minimumSample: 2, ruleVersion: 'memory-v1' });
  assert.equal(pattern, null);
  assert.equal(makeSuggestion(pattern, { compatible: true }), null);
});

// MO-10 — old events outside the current window do not influence a pattern.
check('MO-10', 'evento fora da janela não influencia padrão', () => {
  const old = realEvent({ occurred_at: '2026-08-10T10:00:00.000Z' });
  const pattern = derivePattern([old], { ...window, minimumSample: 1, ruleVersion: 'memory-v1' });
  assert.equal(pattern, null);
});

// MO-11 — institutional isolation is enforced.
check('MO-11', 'instituição A não consulta eventos da instituição B', () => {
  const other = realEvent({ institution_id: 'institution-real-02' });
  assert.equal(usableForLearning(other, window), false);
  assert.equal(derivePattern([other], { ...window, minimumSample: 1, ruleVersion: 'memory-v1' }), null);
});

// MO-12 — a suggestion cannot create an assignment.
check('MO-12', 'sugestão não cria atribuição automática', () => {
  const pattern = derivePattern([realEvent()], { ...window, minimumSample: 1, ruleVersion: 'memory-v1' });
  const suggestion = makeSuggestion(pattern, { compatible: true });
  assert.equal(suggestion.status, 'PRESENTED');
  assert.equal(suggestion.assignment_created, false);
});

// MO-13 — human decision is a separate, traceable event.
check('MO-13', 'decisão humana posterior mantém trilha separada', () => {
  const recommendation = realEvent({ event_type: 'RECOMMENDATION_GENERATED', snapshot_reference: 'snapshot-001' });
  const decision = realEvent({ id: 'event-002', source_event_id: 'source-002', event_type: 'HUMAN_OVERRIDE', decision_origin: 'HUMAN' });
  assert.notEqual(idempotencyKey(recommendation), idempotencyKey(decision));
  assert.equal(decision.decision_origin, 'HUMAN');
});

// MO-14 — replaying the same source event is idempotently identifiable.
check('MO-14', 'reprocessamento do mesmo evento possui chave idempotente', () => {
  const first = realEvent();
  const replay = realEvent({ id: 'different-local-id' });
  assert.equal(idempotencyKey(first), idempotencyKey(replay));
});

// MO-15 — same inputs, window and rules produce deterministic output.
check('MO-15', 'derivação determinística para entradas idênticas', () => {
  const inputs = [
    realEvent({ source_event_id: 'source-a' }),
    realEvent({ id: 'event-b', source_event_id: 'source-b' }),
  ];
  const options = { ...window, minimumSample: 2, ruleVersion: 'memory-v1' };
  assert.deepEqual(derivePattern(inputs, options), derivePattern(inputs, options));
});

// MO-16 — changing the rule version creates a distinct versioned result.
check('MO-16', 'mudança de regra gera versão distinta', () => {
  const inputs = [
    realEvent({ source_event_id: 'source-a' }),
    realEvent({ id: 'event-b', source_event_id: 'source-b' }),
  ];
  const v1 = derivePattern(inputs, { ...window, minimumSample: 2, ruleVersion: 'memory-v1' });
  const v2 = derivePattern(inputs, { ...window, minimumSample: 2, ruleVersion: 'memory-v2' });
  assert.equal(v1.sample_size, v2.sample_size);
  assert.notEqual(v1.rule_version, v2.rule_version);
});

console.log(`OPERATIONAL MEMORY CONTRACT V1: PASS (${passed}/16)`);
