-- Escala de Substituição — harness sintético de override humano v1
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Todos os identificadores são fictícios.

-- O algoritmo recomenda P1 para O1. A decisão humana escolhe P2.
-- O plano original deve permanecer preservado para auditoria.
WITH recommendation AS (
  SELECT * FROM (VALUES
    ('RUN-001','O1','P1',95,'RECOMMENDATION_READY')
  ) v(run_id,occurrence_id,algorithm_teacher,algorithm_score,algorithm_state)
), human_decision AS (
  SELECT * FROM (VALUES
    ('RUN-001','O1','P2','HUMAN_OVERRIDDEN')
  ) v(run_id,occurrence_id,decision_teacher,decision_state)
), result AS (
  SELECT r.run_id,
         r.occurrence_id,
         r.algorithm_teacher,
         r.algorithm_score,
         r.algorithm_state,
         d.decision_teacher,
         d.decision_state
  FROM recommendation r
  JOIN human_decision d
    ON d.run_id=r.run_id
   AND d.occurrence_id=r.occurrence_id
)
SELECT CASE
  WHEN algorithm_teacher='P1'
   AND decision_teacher='P2'
   AND algorithm_state='RECOMMENDATION_READY'
   AND decision_state='HUMAN_OVERRIDDEN'
  THEN 'PASS_OVERRIDE_PRESERVES_ORIGINAL_PLAN'
  ELSE 'FAIL_OVERRIDE_PRESERVES_ORIGINAL_PLAN'
END assertion
FROM result;

-- Regra adicional: o override não transforma retroativamente a recomendação
-- algorítmica em uma recomendação para P2; são decisões distintas.