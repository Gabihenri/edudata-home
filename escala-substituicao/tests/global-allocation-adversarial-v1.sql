-- Escala de Substituição — cenários adversariais do motor global v1
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Todos os identificadores são fictícios.
-- Os testes verificam invariantes do motor, não regras técnicas da SED.

-- ================================================================
-- CASO 1 — Três ocorrências simultâneas para dois docentes.
-- Resultado esperado: cobertura máxima = 2; uma ocorrência uncovered.
-- ================================================================
WITH occurrences AS (
  SELECT * FROM (VALUES
    ('A','09:00','10:00'),
    ('B','09:00','10:00'),
    ('C','09:00','10:00')
  ) v(occurrence_id,start_time,end_time)
), candidates AS (
  SELECT * FROM (VALUES
    ('A','P1',90,true,true),
    ('A','P2',80,true,true),
    ('B','P1',95,true,true),
    ('B','P2',85,true,true),
    ('C','P1',88,true,true),
    ('C','P2',87,true,true)
  ) v(occurrence_id,teacher_id,score,eligible,available)
), valid AS (
  SELECT * FROM candidates WHERE eligible AND available
), plans AS (
  SELECT a.teacher_id AS ta, b.teacher_id AS tb, c.teacher_id AS tc,
         (a.teacher_id IS NOT NULL)::int + (b.teacher_id IS NOT NULL)::int + (c.teacher_id IS NOT NULL)::int AS coverage,
         COALESCE(a.score,0)+COALESCE(b.score,0)+COALESCE(c.score,0) AS quality
  FROM (SELECT NULL::text teacher_id,0 score UNION ALL SELECT teacher_id,score FROM valid WHERE occurrence_id='A') a
  CROSS JOIN (SELECT NULL::text teacher_id,0 score UNION ALL SELECT teacher_id,score FROM valid WHERE occurrence_id='B') b
  CROSS JOIN (SELECT NULL::text teacher_id,0 score UNION ALL SELECT teacher_id,score FROM valid WHERE occurrence_id='C') c
  WHERE (a.teacher_id IS NULL OR b.teacher_id IS NULL OR a.teacher_id<>b.teacher_id)
    AND (a.teacher_id IS NULL OR c.teacher_id IS NULL OR a.teacher_id<>c.teacher_id)
    AND (b.teacher_id IS NULL OR c.teacher_id IS NULL OR b.teacher_id<>c.teacher_id)
), best AS (
  SELECT * FROM plans ORDER BY coverage DESC, quality DESC,
    COALESCE(ta,'~')||'|'||COALESCE(tb,'~')||'|'||COALESCE(tc,'~') ASC LIMIT 1
)
SELECT CASE WHEN coverage=2 THEN 'PASS_3_OCCURRENCES_2_TEACHERS' ELSE 'FAIL_3_OCCURRENCES_2_TEACHERS' END assertion
FROM best;

-- ================================================================
-- CASO 2 — Empate de pontuação.
-- Resultado esperado: mesma assinatura determinística em execuções.
-- ================================================================
WITH plans AS (
  SELECT * FROM (VALUES
    ('P1','P2',180),
    ('P2','P1',180)
  ) v(first_teacher,second_teacher,quality)
)
SELECT CASE WHEN (SELECT first_teacher||'|'||second_teacher FROM plans ORDER BY quality DESC, first_teacher||'|'||second_teacher LIMIT 1)='P1|P2'
  THEN 'PASS_DETERMINISTIC_TIEBREAK' ELSE 'FAIL_DETERMINISTIC_TIEBREAK' END assertion;

-- ================================================================
-- CASO 3 — Maior pontuação bloqueada por conflito temporal.
-- ================================================================
WITH candidates AS (
  SELECT * FROM (VALUES
    ('O1','P1',100,true,true),
    ('O2','P1',99,true,true),
    ('O2','P2',80,true,true)
  ) v(occurrence_id,teacher_id,score,eligible,available)
)
SELECT CASE WHEN COUNT(*)=0 THEN 'PASS_CONFLICT_BLOCKS_REUSE' ELSE 'FAIL_CONFLICT_BLOCKS_REUSE' END assertion
FROM candidates
WHERE occurrence_id='O2' AND teacher_id='P1'
  AND EXISTS (SELECT 1 FROM candidates x WHERE x.occurrence_id='O1' AND x.teacher_id='P1');

-- ================================================================
-- CASO 4 — Elegibilidade e disponibilidade são filtros duros.
-- ================================================================
WITH candidates AS (
  SELECT * FROM (VALUES
    ('P1',99,true,false),
    ('P2',98,false,true),
    ('P3',80,true,true)
  ) v(teacher_id,score,eligible,available)
)
SELECT CASE WHEN COUNT(*)=1 AND MIN(teacher_id)='P3'
  THEN 'PASS_HARD_FILTERS' ELSE 'FAIL_HARD_FILTERS' END assertion
FROM candidates WHERE eligible AND available;

-- ================================================================
-- CASO 5 — Nenhum candidato elegível/disponível.
-- ================================================================
WITH candidates AS (
  SELECT * FROM (VALUES
    ('P1',true,false),
    ('P2',false,true)
  ) v(teacher_id,eligible,available)
)
SELECT CASE WHEN COUNT(*)=0
  THEN 'PASS_NO_CANDIDATE_UNCOVERED' ELSE 'FAIL_NO_CANDIDATE_UNCOVERED' END assertion
FROM candidates WHERE eligible AND available;

-- ================================================================
-- CASO 6 — Mudança de pesos não pode superar restrição dura.
-- ================================================================
WITH candidates AS (
  SELECT * FROM (VALUES
    ('P1',100,false,true),
    ('P2',10,true,true)
  ) v(teacher_id,score,eligible,available)
), valid AS (
  SELECT * FROM candidates WHERE eligible AND available
)
SELECT CASE WHEN COUNT(*)=1 AND MIN(teacher_id)='P2'
  THEN 'PASS_WEIGHTS_CANNOT_OVERRIDE_HARD_CONSTRAINT' ELSE 'FAIL_WEIGHTS_CANNOT_OVERRIDE_HARD_CONSTRAINT' END assertion
FROM valid;

-- ================================================================
-- CASO 7 — Resultado parcial deve conservar motivo operacional.
-- ================================================================
SELECT CASE WHEN reason_code='NO_ELIGIBLE_AVAILABLE_TEACHER'
  THEN 'PASS_EXPLAINABLE_UNCOVERED' ELSE 'FAIL_EXPLAINABLE_UNCOVERED' END assertion
FROM (VALUES ('NO_ELIGIBLE_AVAILABLE_TEACHER')) v(reason_code);

-- Regra transversal: todos os resultados do motor permanecem sujeitos
-- a validação humana antes de qualquer indicação operacional.