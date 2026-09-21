-- Escala de Substituição — reexecução por mudança material v2
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Não usa schema, IDs ou dados reais da SED.
-- Objetivo: detectar mudança material e derivar a exigência de nova rodada
-- a partir do estado comparado, sem afirmações tautológicas.

WITH
snapshot_before AS (
  SELECT * FROM (VALUES
    ('O1','09:00','10:00','P1','AVAILABLE','V1'),
    ('O2','09:00','10:00','P2','AVAILABLE','V1')
  ) v(occurrence_id,start_time,end_time,teacher_id,availability,rule_set)
),
snapshot_same AS (
  SELECT * FROM snapshot_before
),
snapshot_material_change AS (
  SELECT * FROM (VALUES
    ('O1','09:00','10:00','P1','UNAVAILABLE','V1'),
    ('O2','09:00','10:00','P2','AVAILABLE','V1')
  ) v(occurrence_id,start_time,end_time,teacher_id,availability,rule_set)
),
snapshot_rule_change AS (
  SELECT occurrence_id,start_time,end_time,teacher_id,availability,'V2' AS rule_set
  FROM snapshot_before
),
comparisons AS (
  SELECT 'same' AS scenario,
    CASE WHEN NOT EXISTS (
      (SELECT * FROM snapshot_before EXCEPT SELECT * FROM snapshot_same)
      UNION ALL
      (SELECT * FROM snapshot_same EXCEPT SELECT * FROM snapshot_before)
    ) THEN 'UNCHANGED' ELSE 'MATERIALLY_CHANGED' END AS state
  UNION ALL
  SELECT 'availability_change',
    CASE WHEN NOT EXISTS (
      (SELECT * FROM snapshot_before EXCEPT SELECT * FROM snapshot_material_change)
      UNION ALL
      (SELECT * FROM snapshot_material_change EXCEPT SELECT * FROM snapshot_before)
    ) THEN 'UNCHANGED' ELSE 'MATERIALLY_CHANGED' END
  UNION ALL
  SELECT 'rule_change',
    CASE WHEN NOT EXISTS (
      (SELECT * FROM snapshot_before EXCEPT SELECT * FROM snapshot_rule_change)
      UNION ALL
      (SELECT * FROM snapshot_rule_change EXCEPT SELECT * FROM snapshot_before)
    ) THEN 'UNCHANGED' ELSE 'MATERIALLY_CHANGED' END
)
SELECT CASE
  WHEN (SELECT state FROM comparisons WHERE scenario='same')='UNCHANGED'
   AND (SELECT state FROM comparisons WHERE scenario='availability_change')='MATERIALLY_CHANGED'
   AND (SELECT state FROM comparisons WHERE scenario='rule_change')='MATERIALLY_CHANGED'
  THEN 'PASS_MATERIAL_CHANGE_DETECTION'
  ELSE 'FAIL_MATERIAL_CHANGE_DETECTION'
END AS assertion;

-- A exigência de nova rodada agora é derivada do estado efetivamente comparado.
WITH
snapshot_before AS (
  SELECT * FROM (VALUES
    ('O1','09:00','10:00','P1','AVAILABLE','V1'),
    ('O2','09:00','10:00','P2','AVAILABLE','V1')
  ) v(occurrence_id,start_time,end_time,teacher_id,availability,rule_set)
),
snapshot_material_change AS (
  SELECT * FROM (VALUES
    ('O1','09:00','10:00','P1','UNAVAILABLE','V1'),
    ('O2','09:00','10:00','P2','AVAILABLE','V1')
  ) v(occurrence_id,start_time,end_time,teacher_id,availability,rule_set)
),
comparison AS (
  SELECT CASE WHEN NOT EXISTS (
    (SELECT * FROM snapshot_before EXCEPT SELECT * FROM snapshot_material_change)
    UNION ALL
    (SELECT * FROM snapshot_material_change EXCEPT SELECT * FROM snapshot_before)
  ) THEN 'UNCHANGED' ELSE 'MATERIALLY_CHANGED' END AS state
),
decision_gate AS (
  SELECT state,
         CASE WHEN state='UNCHANGED' THEN 'VALIDATION_ALLOWED'
              ELSE 'REEXECUTION_REQUIRED' END AS action
  FROM comparison
)
SELECT CASE
  WHEN state='MATERIALLY_CHANGED' AND action='REEXECUTION_REQUIRED'
  THEN 'PASS_REEXECUTION_REQUIRED'
  ELSE 'FAIL_REEXECUTION_REQUIRED'
END AS assertion
FROM decision_gate;

-- Mesmo snapshot: a decisão é derivada da comparação e permanece validável.
WITH
snapshot_before AS (
  SELECT * FROM (VALUES
    ('O1','09:00','10:00','P1','AVAILABLE','V1'),
    ('O2','09:00','10:00','P2','AVAILABLE','V1')
  ) v(occurrence_id,start_time,end_time,teacher_id,availability,rule_set)
),
snapshot_same AS (
  SELECT * FROM snapshot_before
),
comparison AS (
  SELECT CASE WHEN NOT EXISTS (
    (SELECT * FROM snapshot_before EXCEPT SELECT * FROM snapshot_same)
    UNION ALL
    (SELECT * FROM snapshot_same EXCEPT SELECT * FROM snapshot_before)
  ) THEN 'UNCHANGED' ELSE 'MATERIALLY_CHANGED' END AS state
),
decision_gate AS (
  SELECT state,
         CASE WHEN state='UNCHANGED' THEN 'VALIDATION_ALLOWED'
              ELSE 'REEXECUTION_REQUIRED' END AS action
  FROM comparison
)
SELECT CASE
  WHEN state='UNCHANGED' AND action='VALIDATION_ALLOWED'
  THEN 'PASS_UNCHANGED_CAN_VALIDATE'
  ELSE 'FAIL_UNCHANGED_CAN_VALIDATE'
END AS assertion
FROM decision_gate;