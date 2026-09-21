import fs from 'node:fs';
import assert from 'node:assert/strict';

const fixturePath = new URL('../data/escola-sintetica-v1.json', import.meta.url);
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

assert.equal(fixture.official, false, 'A fixture deve permanecer não oficial.');
assert.equal(fixture.version, '1.0.0');
assert.equal(fixture.teachers.length, 12);
assert.equal(fixture.classes.length, 6);
assert.equal(fixture.periods.length, 7);

const byId = (items) => new Map(items.map(item => [item.id, item]));
const teachers = byId(fixture.teachers);
const occurrences = byId(fixture.occurrences);
const commitments = fixture.commitments;
const assignments = fixture.assignments;

function isAvailable(teacherId, occurrence) {
  return teachers.get(teacherId)?.availability?.includes(`${occurrence.day}-${occurrence.period}`) ?? false;
}

function hasAssignmentConflict(teacherId, occurrence) {
  return assignments.some(a =>
    a.teacher_id === teacherId &&
    a.day === occurrence.day &&
    a.period === occurrence.period
  );
}

function hasCommitmentConflict(teacherId, occurrence) {
  return commitments.some(c =>
    c.teacher_id === teacherId &&
    c.day === occurrence.day &&
    c.period === occurrence.period
  );
}

function scoreFor(teacherId, subject) {
  return fixture.scoring?.[subject]?.[teacherId] ?? null;
}

function eligible(teacherId, occurrence) {
  const teacher = teachers.get(teacherId);
  return Boolean(
    teacher?.eligible_for_substitution === true &&
    teacherId !== occurrence.teacher_id &&
    isAvailable(teacherId, occurrence) &&
    !hasAssignmentConflict(teacherId, occurrence) &&
    !hasCommitmentConflict(teacherId, occurrence) &&
    scoreFor(teacherId, occurrence.subject) !== null
  );
}

function validCandidates(occurrenceId) {
  const occurrence = occurrences.get(occurrenceId);
  return fixture.teachers
    .filter(t => eligible(t.id, occurrence))
    .map(t => t.id);
}

function greedyLocal(occurrenceIds) {
  const used = new Set();
  return occurrenceIds.map(id => {
    const occurrence = occurrences.get(id);
    const candidate = validCandidates(id)
      .filter(t => !used.has(t))
      .sort((a, b) => (scoreFor(b, occurrence.subject) - scoreFor(a, occurrence.subject)) || a.localeCompare(b))[0];
    if (candidate) used.add(candidate);
    return candidate ?? null;
  });
}

function exhaustiveGlobal(occurrenceIds, blockedTeacherIds = new Set()) {
  let best = null;

  function walk(index, used, rows, coverage, quality) {
    if (index === occurrenceIds.length) {
      const signature = rows.map(r => r ?? 'UNCOVERED').join('|');
      const candidate = { rows, coverage, quality, signature };
      if (
        !best ||
        coverage > best.coverage ||
        (coverage === best.coverage && quality > best.quality) ||
        (coverage === best.coverage && quality === best.quality && signature < best.signature)
      ) best = candidate;
      return;
    }

    const id = occurrenceIds[index];
    const occurrence = occurrences.get(id);
    for (const teacherId of validCandidates(id)) {
      if (used.has(teacherId) || blockedTeacherIds.has(teacherId)) continue;
      walk(
        index + 1,
        new Set([...used, teacherId]),
        [...rows, teacherId],
        coverage + 1,
        quality + scoreFor(teacherId, occurrence.subject)
      );
    }
    walk(index + 1, used, [...rows, null], coverage, quality);
  }

  walk(0, new Set(), [], 0, 0);
  return best;
}

// C01 — ausência individual com candidatos válidos.
const c01 = validCandidates('occ-s01-seg-p1');
assert.ok(c01.includes('teacher-s01'));
assert.ok(!c01.includes('teacher-s03'));
assert.ok(c01.includes('teacher-s09'));

// C02 — conflito temporal deve excluir o titular de Matemática que já está em aula.
const c02 = validCandidates('occ-s02-seg-p1');
assert.ok(!c02.includes('teacher-s08'));
assert.ok(c02.includes('teacher-s01'));

// C03 — quatro ausências simultâneas devem ser resolvidas como problema global.
const simultaneous = ['occ-s01-seg-p1','occ-s02-seg-p1','occ-s03-seg-p1','occ-s04-seg-p1'];
const global = exhaustiveGlobal(simultaneous);
assert.equal(global.coverage, 4);
assert.equal(new Set(global.rows).size, 4);

// C04 — a solução global deve considerar cobertura antes de qualidade.
const local = greedyLocal(simultaneous);
assert.equal(local.filter(Boolean).length, 3);
assert.equal(global.coverage, 4);
assert.ok(global.coverage > local.filter(Boolean).length);

// C05 — cenário "uncovered" precisa ser construído por mutação controlada da fixture.
const c05TeacherIds = fixture.scenarios.C05.blocked_teacher_ids;
const originalAvailabilityC05 = new Map(
  c05TeacherIds.map(id => [id, [...teachers.get(id).availability]])
);
for (const teacherId of c05TeacherIds) {
  const teacher = teachers.get(teacherId);
  teacher.availability = teacher.availability.filter(v => v !== 'seg-p1');
}
const c05Uncovered = validCandidates('occ-s03-seg-p1');
assert.equal(c05Uncovered.length, 0);
for (const [teacherId, availability] of originalAvailabilityC05) {
  teachers.get(teacherId).availability = availability;
}

// C06 — override humano deve ser uma alocação válida e exclusiva.
const overrideTeacher = 'teacher-s02';
assert.ok(validCandidates('occ-s01-seg-p1').includes(overrideTeacher));
const remainingIds = simultaneous.slice(1);
const remaining = exhaustiveGlobal(remainingIds, new Set([overrideTeacher]));
assert.equal(remaining.coverage, 3);
assert.equal(new Set([overrideTeacher, ...remaining.rows]).size, 4);

// C07 — mudança material de disponibilidade altera o conjunto de candidatos.
const beforeC07 = validCandidates('occ-s01-seg-p1');
const teacherS02 = teachers.get('teacher-s02');
const originalAvailability = [...teacherS02.availability];
teacherS02.availability = originalAvailability.filter(v => v !== 'seg-p1');
const afterC07 = validCandidates('occ-s01-seg-p1');
assert.ok(beforeC07.includes('teacher-s02'));
assert.ok(!afterC07.includes('teacher-s02'));
teacherS02.availability = originalAvailability;

// C08 — histórico precisa ser determinístico para o mesmo snapshot.
const run1 = exhaustiveGlobal(simultaneous);
const run2 = exhaustiveGlobal(simultaneous);
assert.deepEqual(run1, run2);

// Contratos de integridade da fixture.
for (const absence of fixture.absences) {
  assert.equal(absence.status, 'OPEN');
  assert.ok(occurrences.has(absence.occurrence_id));
}
for (const vacancy of fixture.vacancies) {
  assert.equal(vacancy.status, 'OPEN');
  assert.ok(fixture.absences.some(a => a.id === vacancy.absence_id));
  assert.ok(occurrences.has(vacancy.occurrence_id));
}

console.log('REGRESSION FIXTURE V1: PASS');
console.log(`C01 candidates=${c01.length}; C02 candidates=${c02.length}; C03/C04 coverage=${global.coverage}; C08 deterministic=yes`);
