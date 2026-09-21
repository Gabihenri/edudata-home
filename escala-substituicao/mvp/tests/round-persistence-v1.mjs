import assert from 'node:assert/strict';

function planSignature(rows) {
  return rows.map(row => `${row.occurrenceId}:${row.teacherId ?? 'UNCOVERED'}`).join('|');
}

function createRound({ roundVersion, snapshotId, algorithmVersion, ruleVersion, rows, status = 'CALCULATED', temporalReference = '2026-09-21' }) {
  assert.ok(snapshotId, 'Rodada sem snapshot.');
  assert.ok(algorithmVersion, 'Rodada sem versão do algoritmo.');
  assert.ok(ruleVersion, 'Rodada sem versão das regras.');
  assert.ok(Array.isArray(rows), 'Rodada sem resultados.');
  return Object.freeze({
    roundId: `round-${roundVersion}`,
    roundVersion,
    snapshotId,
    algorithmVersion,
    ruleVersion,
    createdAt: new Date().toISOString(),
    temporalReference,
    status,
    planSignature: planSignature(rows),
    rows: Object.freeze(rows.map(row => Object.freeze({ ...row }))),
  });
}

function invalidateRound(round, reason, invalidatedAt = new Date().toISOString()) {
  assert.ok(reason, 'Invalidação sem motivo observável.');
  return Object.freeze({
    ...round,
    status: 'INVALIDATED',
    invalidation: Object.freeze({
      reason,
      invalidatedAt,
      previousStatus: round.status,
    }),
  });
}

function applyHumanOverride(round, occurrenceId, humanTeacherId, actor = 'synthetic-human') {
  const original = round.rows.find(row => row.occurrenceId === occurrenceId);
  assert.ok(original, 'Override para ocorrência inexistente.');
  assert.ok(original.teacherId, 'Override sem recomendação original.');

  const rows = round.rows.map(row =>
    row.occurrenceId === occurrenceId
      ? {
          ...row,
          originalTeacherId: row.originalTeacherId ?? row.teacherId,
          teacherId: humanTeacherId,
          decisionSource: 'HUMAN',
          status: 'HUMAN_OVERRIDDEN',
          overrideActor: actor,
        }
      : { ...row }
  );

  return createRound({
    roundVersion: round.roundVersion + 1,
    snapshotId: round.snapshotId,
    algorithmVersion: round.algorithmVersion,
    ruleVersion: round.ruleVersion,
    temporalReference: round.temporalReference,
    status: 'HUMAN_OVERRIDDEN',
    rows,
  });
}

// C01 — rodada precisa carregar snapshot + versões + assinatura determinística.
const baseRows = [
  { occurrenceId: 'occ-s01', teacherId: 'teacher-s03', score: 94, decisionSource: 'ALGORITHM', status: 'RECOMMENDED' },
  { occurrenceId: 'occ-s02', teacherId: 'teacher-s01', score: 95, decisionSource: 'ALGORITHM', status: 'RECOMMENDED' },
];

const round1 = createRound({
  roundVersion: 1,
  snapshotId: 'snapshot-1',
  algorithmVersion: 'allocation-v1',
  ruleVersion: 'rules-v1',
  rows: baseRows,
});

assert.equal(round1.planSignature, 'occ-s01:teacher-s03|occ-s02:teacher-s01');
assert.equal(round1.status, 'CALCULATED');

// C02 — a rodada histórica é imutável; novas decisões geram novo objeto/rodada.
const round1Signature = round1.planSignature;
const round2 = applyHumanOverride(round1, 'occ-s01', 'teacher-s02');
assert.equal(round1.planSignature, round1Signature);
assert.equal(round1.rows[0].teacherId, 'teacher-s03');
assert.equal(round2.rows[0].teacherId, 'teacher-s02');
assert.equal(round2.rows[0].originalTeacherId, 'teacher-s03');
assert.equal(round2.rows[0].decisionSource, 'HUMAN');
assert.equal(round2.rows[0].status, 'HUMAN_OVERRIDDEN');
assert.equal(round2.roundVersion, 2);

// C03 — mudança material invalida a rodada anterior sem apagar o resultado.
const invalidated = invalidateRound(round1, 'teacher-s03: disponibilidade alterada');
assert.equal(invalidated.status, 'INVALIDATED');
assert.equal(invalidated.rows[0].teacherId, 'teacher-s03');
assert.equal(invalidated.invalidation.reason, 'teacher-s03: disponibilidade alterada');

// C04 — rodada invalidada não pode ser confirmada.
function canConfirm(round) {
  return ['CALCULATED', 'HUMAN_VALIDATION_REQUIRED', 'HUMAN_OVERRIDDEN'].includes(round.status);
}
assert.equal(canConfirm(round1), true);
assert.equal(canConfirm(invalidated), false);

// C05 — assinatura muda quando a alocação muda.
assert.notEqual(round1.planSignature, round2.planSignature);

// C06 — reconstrução por ocorrência preserva recomendação original e decisão humana.
const timeline = [round1, round2, invalidated]
  .flatMap(round => round.rows
    .filter(row => row.occurrenceId === 'occ-s01')
    .map(row => ({
      roundVersion: round.roundVersion,
      snapshotId: round.snapshotId,
      teacherId: row.teacherId,
      originalTeacherId: row.originalTeacherId ?? row.teacherId,
      decisionSource: row.decisionSource,
      status: row.status,
    }))
  );

assert.equal(timeline[0].teacherId, 'teacher-s03');
assert.equal(timeline[1].teacherId, 'teacher-s02');
assert.equal(timeline[1].originalTeacherId, 'teacher-s03');

// C07 — dados incompletos não são aceitos como rodada.
assert.throws(
  () => createRound({ roundVersion: 3, snapshotId: null, algorithmVersion: 'allocation-v1', ruleVersion: 'rules-v1', rows: [] }),
  /Rodada sem snapshot/
);
assert.throws(
  () => createRound({ roundVersion: 3, snapshotId: 'snapshot-3', algorithmVersion: null, ruleVersion: 'rules-v1', rows: [] }),
  /Rodada sem versão do algoritmo/
);
assert.throws(
  () => createRound({ roundVersion: 3, snapshotId: 'snapshot-3', algorithmVersion: 'allocation-v1', ruleVersion: null, rows: [] }),
  /Rodada sem versão das regras/
);

// C08 — mesma entrada produz a mesma assinatura.
const repeat = createRound({
  roundVersion: 1,
  snapshotId: 'snapshot-1',
  algorithmVersion: 'allocation-v1',
  ruleVersion: 'rules-v1',
  rows: baseRows,
});
assert.equal(repeat.planSignature, round1.planSignature);

console.log('ROUND PERSISTENCE V1: PASS');
console.log(`round1=${round1.roundVersion}; round2=${round2.roundVersion}; invalidated=${invalidated.status}; deterministic=yes`);
