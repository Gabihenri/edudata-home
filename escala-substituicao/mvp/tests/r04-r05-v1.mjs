import fs from 'node:fs';
import assert from 'node:assert/strict';

const fixturePath = new URL('../data/escola-sintetica-v1.json', import.meta.url);
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

const byId = (items) => new Map(items.map(item => [item.id, item]));
const teachers = byId(fixture.teachers);
const occurrence = fixture.occurrences.find(item => item.id === 'occ-s01-seg-p1');

function isAvailable(teacherId, item) {
  return teachers.get(teacherId)?.availability?.includes(item.day + '-' + item.period) ?? false;
}

function scoreFor(teacherId, subject) {
  return fixture.scoring?.[subject]?.[teacherId] ?? null;
}

function eligible(teacherId, item) {
  const teacher = teachers.get(teacherId);
  return Boolean(
    teacher?.eligible_for_substitution === true &&
    teacherId !== item.teacher_id &&
    scoreFor(teacherId, item.subject) !== null
  );
}

function candidates(item) {
  return fixture.teachers
    .filter(teacher => eligible(teacher.id, item) && isAvailable(teacher.id, item))
    .map(teacher => teacher.id);
}

// R04 — elegibilidade exclui docente inelegível mesmo quando disponível.
const teacherS03 = teachers.get('teacher-s03');
const originalEligibility = teacherS03.eligible_for_substitution;
teacherS03.eligible_for_substitution = false;
const r04 = candidates(occurrence);
assert.ok(!r04.includes('teacher-s03'));
teacherS03.eligible_for_substitution = originalEligibility;

// R05 — disponibilidade exclui docente elegível quando a janela não cobre a ocorrência.
const teacherS01 = teachers.get('teacher-s01');
const originalAvailability = [...teacherS01.availability];
teacherS01.availability = originalAvailability.filter(value => value !== 'seg-p1');
const r05 = candidates(occurrence);
assert.ok(!r05.includes('teacher-s01'));
assert.ok(r05.includes('teacher-s02'));
teacherS01.availability = originalAvailability;

console.log('R04/R05 MVP FIXTURE: PASS');
console.log('R04 candidates=' + r04.length + '; R05 candidates_after_availability_change=' + r05.length);
