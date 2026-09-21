-- Escala de Substituição — harness sintético de override humano v2
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Todos os identificadores são fictícios.
-- Objetivo: exercitar persistência comportamental do override sem alterar
-- retroativamente a recomendação algorítmica original.

BEGIN;

CREATE TEMP TABLE recommendation_history (
  run_id TEXT,
  occurrence_id TEXT,
  algorithm_teacher TEXT,
  algorithm_score INTEGER,
  algorithm_state TEXT
) ON COMMIT DROP;

CREATE TEMP TABLE human_decision_history (
  run_id TEXT,
  occurrence_id TEXT,
  decision_teacher TEXT,
  decision_state TEXT
) ON COMMIT DROP;

-- 1. O algoritmo grava sua recomendação original.
INSERT INTO recommendation_history VALUES
  ('RUN-001','O1','P1',95,'RECOMMENDATION_READY');

-- 2. A validação humana registra P2 em estrutura própria.
INSERT INTO human_decision_history VALUES
  ('RUN-001','O1','P2','HUMAN_OVERRIDDEN');

-- 3. O resultado composto deve preservar as duas decisões distintas.
WITH result AS (
  SELECT r.run_id,
         r.occurrence_id,
         r.algorithm_teacher,
         r.algorithm_score,
         r.algorithm_state,
         d.decision_teacher,
         d.decision_state
  FROM recommendation_history r
  JOIN human_decision_history d
    ON d.run_id=r.run_id
   AND d.occurrence_id=r.occurrence_id
)
SELECT CASE
  WHEN algorithm_teacher='P1'
   AND algorithm_score=95
   AND algorithm_state='RECOMMENDATION_READY'
   AND decision_teacher='P2'
   AND decision_state='HUMAN_OVERRIDDEN'
  THEN 'PASS_OVERRIDE_PRESERVES_ORIGINAL_PLAN'
  ELSE 'FAIL_OVERRIDE_PRESERVES_ORIGINAL_PLAN'
END AS assertion
FROM result;

-- 4. A existência do override não pode alterar a recomendação original.
SELECT CASE
  WHEN (SELECT algorithm_teacher
        FROM recommendation_history
        WHERE run_id='RUN-001' AND occurrence_id='O1')='P1'
   AND (SELECT algorithm_score
        FROM recommendation_history
        WHERE run_id='RUN-001' AND occurrence_id='O1')=95
   AND (SELECT COUNT(*)
        FROM recommendation_history
        WHERE run_id='RUN-001' AND occurrence_id='O1')=1
  THEN 'PASS_ALGORITHM_RECORD_IMMUTABLE'
  ELSE 'FAIL_ALGORITHM_RECORD_MUTATED'
END AS assertion;

-- 5. O override permanece exclusivamente na trilha humana.
SELECT CASE
  WHEN (SELECT decision_teacher
        FROM human_decision_history
        WHERE run_id='RUN-001' AND occurrence_id='O1')='P2'
   AND (SELECT decision_state
        FROM human_decision_history
        WHERE run_id='RUN-001' AND occurrence_id='O1')='HUMAN_OVERRIDDEN'
   AND (SELECT COUNT(*)
        FROM human_decision_history
        WHERE run_id='RUN-001' AND occurrence_id='O1')=1
  THEN 'PASS_HUMAN_DECISION_SEPARATE'
  ELSE 'FAIL_HUMAN_DECISION_SEPARATION'
END AS assertion;

-- 6. Releitura posterior deve reconstruir exatamente o par
-- recomendação algorítmica + decisão humana.
WITH reconstructed AS (
  SELECT r.algorithm_teacher,
         r.algorithm_score,
         d.decision_teacher,
         d.decision_state
  FROM recommendation_history r
  JOIN human_decision_history d
    ON d.run_id=r.run_id
   AND d.occurrence_id=r.occurrence_id
  WHERE r.run_id='RUN-001' AND r.occurrence_id='O1'
)
SELECT CASE
  WHEN algorithm_teacher='P1'
   AND algorithm_score=95
   AND decision_teacher='P2'
   AND decision_state='HUMAN_OVERRIDDEN'
  THEN 'PASS_AUDIT_RECONSTRUCTION'
  ELSE 'FAIL_AUDIT_RECONSTRUCTION'
END AS assertion
FROM reconstructed;

ROLLBACK;

-- O teste valida somente o contrato lógico sintético.
-- Não valida integração com SED, DDL ou persistência de produção.