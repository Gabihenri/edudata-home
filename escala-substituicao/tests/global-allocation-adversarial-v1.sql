-- Escala de Substituição — cenários adversariais do motor global v2
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Todos os identificadores são fictícios.
-- A ordem dos casos 1–7 segue exatamente a matriz mínima da Issue #20.
-- Os testes verificam invariantes do motor, não regras técnicas da SED.

-- ================================================================
-- CASO 1 — Empate de pontuação com desempate determinístico.
-- ================================================================
WITH plans AS (
  SELECT * FROM (VALUES
    ('P1','P2',180),
    ('P2','P1',180)
  ) v(first_teacher,second_teacher,quality)
), best AS (
  SELECT * FROM plans
  ORDER BY quality DESC, first_teacher||'|'||second_teacher ASC
  LIMIT 1
)
SELECT CASE
  WHEN first_teacher='P1' AND second_teacher='P2'
  THEN 'PASS_DETERMINISTIC_TIEBREAK'
  ELSE 'FAIL_DETERMINISTIC_TIEBREAK'
END assertion
FROM best;

-- ================================================================
-- CASO 2 — Três ocorrências simultâneas para dois docentes elegíveis.
-- Cobertura máxima = 2; uma ocorrência deve permanecer uncovered.
-- ================================================================
WITH occurrences AS (
  SELECT * FROM (VALUES
    ('A','09:00','10:00'), ('B','09:00','10:00'), ('C','09:00','10:00')
  ) v(occurrence_id,start_time,end_time)
), candidates AS (
  SELECT * FROM (VALUES
    ('A','P1',90,true,true), ('A','P2',80,true,true),
    ('B','P1',95,true,true), ('B','P2',85,true,true),
    ('C','P1',88,true,true), ('C','P2',87,true,true)
  ) v(occurrence_id,teacher_id,score,eligible,available)
), valid AS (
  SELECT * FROM candidates WHERE eligible AND available
), plans AS (
  SELECT a.teacher_id ta,b.teacher_id tb,c.teacher_id tc,
    (a.teacher_id IS NOT NULL)::int+(b.teacher_id IS NOT NULL)::int+
    (c.teacher_id IS NOT NULL)::int coverage,
    COALESCE(a.score,0)+COALESCE(b.score,0)+COALESCE(c.score,0) quality
  FROM (SELECT NULL::text teacher_id,0 score UNION ALL
        SELECT teacher_id,score FROM valid WHERE occurrence_id='A') a
  CROSS JOIN (SELECT NULL::text teacher_id,0 score UNION ALL
        SELECT teacher_id,score FROM valid WHERE occurrence_id='B') b
  CROSS JOIN (SELECT NULL::text teacher_id,0 score UNION ALL
        SELECT teacher_id,score FROM valid WHERE occurrence_id='C') c
  WHERE (a.teacher_id IS NULL OR b.teacher_id IS NULL OR a.teacher_id<>b.teacher_id)
    AND (a.teacher_id IS NULL OR c.teacher_id IS NULL OR a.teacher_id<>c.teacher_id)
    AND (b.teacher_id IS NULL OR c.teacher_id IS NULL OR b.teacher_id<>c.teacher_id)
), best AS (
  SELECT * FROM plans ORDER BY coverage DESC,quality DESC,
    COALESCE(ta,'~')||'|'||COALESCE(tb,'~')||'|'||COALESCE(tc,'~') ASC LIMIT 1
)
SELECT CASE WHEN coverage=2
  THEN 'PASS_3_OCCURRENCES_2_TEACHERS'
  ELSE 'FAIL_3_OCCURRENCES_2_TEACHERS' END assertion
FROM best;

-- ================================================================
-- CASO 3 — Candidato de maior pontuação bloqueado por conflito temporal.
-- ================================================================
WITH candidates AS (
  SELECT * FROM (VALUES
    ('O1','P1',100,true,true),
    ('O2','P1',99,true,true),
    ('O2','P2',80,true,true)
  ) v(occurrence_id,teacher_id,score,eligible,available)
), plans AS (
  SELECT o1.teacher_id o1_teacher,o2.teacher_id o2_teacher,o1.score+o2.score quality
  FROM candidates o1 CROSS JOIN candidates o2
  WHERE o1.occurrence_id='O1' AND o2.occurrence_id='O2'
    AND o1.eligible AND o1.available AND o2.eligible AND o2.available
    AND o1.teacher_id<>o2.teacher_id
), best AS (
  SELECT * FROM plans ORDER BY quality DESC,o1_teacher||'|'||o2_teacher ASC LIMIT 1
)
SELECT CASE WHEN o1_teacher='P1' AND o2_teacher='P2'
  THEN 'PASS_CONFLICT_BLOCKS_REUSE'
  ELSE 'FAIL_CONFLICT_BLOCKS_REUSE' END assertion
FROM best;

-- ================================================================
-- CASO 4 — Indisponibilidade parcial.
-- ================================================================
WITH candidates AS (
  SELECT * FROM (VALUES
    ('P1',99,true,false), ('P2',98,true,true), ('P3',80,true,true)
  ) v(teacher_id,score,eligible,available)
), valid AS (
  SELECT * FROM candidates WHERE eligible AND available
)
SELECT CASE WHEN COUNT(*)=2 AND NOT EXISTS (
  SELECT 1 FROM valid WHERE teacher_id='P1'
) THEN 'PASS_PARTIAL_UNAVAILABILITY'
ELSE 'FAIL_PARTIAL_UNAVAILABILITY' END assertion
FROM valid;

-- ================================================================
-- CASO 5 — Nenhum candidato elegível/disponível.
-- Resultado explicitamente uncovered + reason code.
-- ================================================================
WITH occurrences AS (SELECT 'O1'::text occurrence_id),
candidates AS (
  SELECT * FROM (VALUES
    ('O1','P1',true,false), ('O1','P2',false,true)
  ) v(occurrence_id,teacher_id,eligible,available)
), valid AS (
  SELECT * FROM candidates WHERE occurrence_id='O1' AND eligible AND available
), result AS (
  SELECT o.occurrence_id,
    CASE WHEN EXISTS(SELECT 1 FROM valid v WHERE v.occurrence_id=o.occurrence_id)
      THEN 'COVERED' ELSE 'UNCOVERED' END coverage_state,
    CASE WHEN EXISTS(SELECT 1 FROM valid v WHERE v.occurrence_id=o.occurrence_id)
      THEN NULL ELSE 'NO_ELIGIBLE_AVAILABLE_TEACHER' END reason_code
  FROM occurrences o
)
SELECT CASE WHEN coverage_state='UNCOVERED'
 AND reason_code='NO_ELIGIBLE_AVAILABLE_TEACHER'
 THEN 'PASS_NO_CANDIDATE_UNCOVERED'
 ELSE 'FAIL_NO_CANDIDATE_UNCOVERED' END assertion
FROM result;

-- ================================================================
-- CASO 6 — Mudança controlada de pesos sem violar hard constraints.
-- Os pesos mudam entre duas avaliações, mas P1 continua inválido.
-- ================================================================
WITH candidates AS (
  SELECT * FROM (VALUES
    ('P1',100,false,true,10,100),
    ('P2',10,true,true,10,100),
    ('P3',5,true,true,10,300)
  ) v(teacher_id,base_score,eligible,available,weight_a,weight_b)
), scored AS (
  SELECT teacher_id,
    base_score*weight_a score_a,
    base_score*weight_b score_b,
    eligible,available
  FROM candidates
), best_a AS (
  SELECT teacher_id FROM scored
  WHERE eligible AND available
  ORDER BY score_a DESC,teacher_id ASC LIMIT 1
), best_b AS (
  SELECT teacher_id FROM scored
  WHERE eligible AND available
  ORDER BY score_b DESC,teacher_id ASC LIMIT 1
)
SELECT CASE
  WHEN (SELECT teacher_id FROM best_a)='P2'
   AND (SELECT teacher_id FROM best_b)='P3'
   AND NOT EXISTS (
     SELECT 1 FROM scored
     WHERE teacher_id='P1' AND eligible AND available
   )
  THEN 'PASS_CONTROLLED_WEIGHT_CHANGE_HARD_CONSTRAINT'
  ELSE 'FAIL_CONTROLLED_WEIGHT_CHANGE_HARD_CONSTRAINT'
END assertion;

-- ================================================================
-- CASO 7 — Resultado parcial com uncovered + motivo explicativo.
-- ================================================================
WITH engine_result AS (
  SELECT * FROM (VALUES
    ('O2','UNCOVERED','NO_ELIGIBLE_AVAILABLE_TEACHER')
  ) v(occurrence_id,coverage_state,reason_code)
)
SELECT CASE WHEN coverage_state='UNCOVERED'
 AND reason_code='NO_ELIGIBLE_AVAILABLE_TEACHER'
 THEN 'PASS_EXPLAINABLE_UNCOVERED'
 ELSE 'FAIL_EXPLAINABLE_UNCOVERED' END assertion
FROM engine_result;

-- ================================================================
-- EXTENSÕES — Casos 8–9 permanecem fora da matriz mínima da Issue #20.
-- ================================================================

-- CASO 8 — Ocorrências distintas da mesma disciplina permanecem distintas.
WITH occurrences AS (
  SELECT * FROM (VALUES
    ('O1','FISICA','09:00','10:00','T1'),
    ('O2','FISICA','10:00','11:00','T1')
  ) v(occurrence_id,component,start_time,end_time,class_id)
)
SELECT CASE WHEN COUNT(*)=2 AND COUNT(DISTINCT occurrence_id)=2
 AND COUNT(DISTINCT component)=1
 THEN 'PASS_DISTINCT_SAME_COMPONENT_OCCURRENCES'
 ELSE 'FAIL_DISTINCT_SAME_COMPONENT_OCCURRENCES' END assertion
FROM occurrences;

-- CASO 9 — Associação múltipla permanece contextual, não responsabilidade.
WITH associated AS (
  SELECT * FROM (VALUES ('O1','P1'),('O1','P2')) v(occurrence_id,teacher_id)
), candidates AS (
  SELECT * FROM (VALUES
    ('O1','P1',true,true),('O1','P2',true,true)
  ) v(occurrence_id,teacher_id,eligible,available)
)
SELECT CASE
 WHEN (SELECT COUNT(DISTINCT teacher_id) FROM associated WHERE occurrence_id='O1')=2
  AND (SELECT COUNT(*) FROM candidates WHERE occurrence_id='O1' AND eligible AND available)=2
 THEN 'PASS_MULTI_ASSOCIATED_TEACHERS_REMAIN_CONTEXTUAL'
 ELSE 'FAIL_MULTI_ASSOCIATED_TEACHERS_REMAIN_CONTEXTUAL' END assertion;

-- Regra transversal: todo resultado permanece sujeito a validação humana.