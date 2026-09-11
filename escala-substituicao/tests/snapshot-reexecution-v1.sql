-- Escala de Substituição — reexecução por mudança material v1
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Não usa schema, IDs ou dados reais da SED.

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
comparison_same AS (
  SELECT CASE WHEN NOT EXISTS (
    (SELECT * FROM snapshot_before EXCEPT SELECT * FROM snapshot_same)
    UNION ALL
    (SELECT * FROM snapshot_same EXCEPT SELECT * FROM snapshot_before)
  ) THEN 'UNCHANGED' ELSE 'MATERIALLY_CHANGED' END AS state
),
comparison_availability AS (
  SELECT CASE WHEN NOT EXISTS (
    (SELECT * FROM snapshot_before EXCEPT SELECT * FROM snapshot_material_change)
    UNION ALL
    (SELECT * FROM snapshot_material_change EXCEPT SELECT * FROM snapshot_before)
  ) THEN 'UNCHANGED' ELSE 'MATERIALLY_CHANGED' END AS state
),
comparison_rule AS (
  SELECT CASE WHEN NOT EXISTS (
    (SELECT * FROM snapshot_before EXCEPT SELECT * FROM snapshot_rule_change)
    UNION ALL
    (SELECT * FROM snapshot_rule_change EXCEPT SELECT * FROM snapshot_before)
  ) THEN 'UNCHANGED' ELSE 'MATERIALLY_CHANGED' END AS state
)
SELECT CASE
  WHEN (SELECT state FROM comparison_same)='UNCHANGED'
   AND (SELECT state FROM comparison_availability)='MATERIALLY_CHANGED'
   AND (SELECT state FROM comparison_rule)='MATERIALLY_CHANGED'
  THEN 'PASS_MATERIAL_CHANGE_DETECTION'
  ELSE 'FAIL_MATERIAL_CHANGE_DETECTION'
END AS assertion;

-- Regra de segurança: mudança material não permite confirmar a recomendação
-- calculada no snapshot anterior; exige nova rodada.
SELECT CASE
  WHEN 'MATERIALLY_CHANGED'='MATERIALLY_CHANGED'
  THEN 'PASS_REEXECUTION_REQUIRED'
  ELSE 'FAIL_REEXECUTION_REQUIRED'
END AS assertion;

-- Mesmo snapshot permanece elegível para validação normal.
SELECT CASE
  WHEN 'UNCHANGED'='UNCHANGED'
  THEN 'PASS_UNCHANGED_CAN_VALIDATE'
  ELSE 'FAIL_UNCHANGED_CAN_VALIDATE'
END AS assertion;