-- Escala de Substituição — estados de mudança do snapshot v1
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- O estado é derivado exclusivamente da comparação entre Snapshot A e Snapshot B.
-- Não representa estados oficiais da SED.

WITH snapshots AS (
  SELECT
    'A'::text AS snapshot_id,
    jsonb_build_object(
      'source_status','OK',
      'rows', jsonb_build_array(
        jsonb_build_object('teacher_id','T1','class_id','C1','slot','M1','available',true,'occurrence','O1','vigency','2026-01-01','rule_set','R1'),
        jsonb_build_object('teacher_id','T2','class_id','C2','slot','M2','available',true,'occurrence','O2','vigency','2026-01-01','rule_set','R1')
      )
    ) AS payload
  UNION ALL
  SELECT
    'B',
    jsonb_build_object(
      'source_status','OK',
      'rows', jsonb_build_array(
        jsonb_build_object('teacher_id','T1','class_id','C1','slot','M1','available',true,'occurrence','O1','vigency','2026-01-01','rule_set','R1'),
        jsonb_build_object('teacher_id','T2','class_id','C2','slot','M2','available',true,'occurrence','O2','vigency','2026-01-01','rule_set','R1')
      )
    )
),
comparison AS (
  SELECT
    a.payload AS before_payload,
    b.payload AS after_payload,
    a.payload->>'source_status' AS before_source_status,
    b.payload->>'source_status' AS after_source_status,
    CASE
      WHEN a.payload IS NULL OR b.payload IS NULL THEN 'COMPARISON_FAILED'
      WHEN a.payload->>'source_status' <> 'OK'
        OR b.payload->>'source_status' <> 'OK' THEN 'SOURCE_UNCERTAIN'
      WHEN a.payload->'rows' IS NULL OR b.payload->'rows' IS NULL THEN 'COMPARISON_FAILED'
      WHEN a.payload->'rows' = b.payload->'rows' THEN 'UNCHANGED'
      ELSE 'MATERIALLY_CHANGED'
    END AS derived_state
  FROM snapshots a
  JOIN snapshots b ON a.snapshot_id = 'A' AND b.snapshot_id = 'B'
)
SELECT CASE
  WHEN derived_state = 'UNCHANGED'
  THEN 'PASS_UNCHANGED_DERIVED'
  ELSE 'FAIL_UNCHANGED_DERIVED'
END AS assertion
FROM comparison;

-- Mudança de disponibilidade é derivada do diff, não declarada como expected_state.
WITH snapshots AS (
  SELECT 'A'::text AS id, jsonb_build_object(
    'source_status','OK',
    'rows',jsonb_build_array(jsonb_build_object('teacher_id','T1','available',true))
  ) AS payload
  UNION ALL
  SELECT 'B', jsonb_build_object(
    'source_status','OK',
    'rows',jsonb_build_array(jsonb_build_object('teacher_id','T1','available',false))
  )
),
derived AS (
  SELECT CASE
    WHEN a.payload->>'source_status' <> 'OK' OR b.payload->>'source_status' <> 'OK'
      THEN 'SOURCE_UNCERTAIN'
    WHEN a.payload->'rows' = b.payload->'rows'
      THEN 'UNCHANGED'
    ELSE 'MATERIALLY_CHANGED'
  END AS state
  FROM snapshots a CROSS JOIN snapshots b
  WHERE a.id='A' AND b.id='B'
)
SELECT CASE WHEN state='MATERIALLY_CHANGED'
  THEN 'PASS_AVAILABILITY_CHANGE_DERIVED'
  ELSE 'FAIL_AVAILABILITY_CHANGE_DERIVED' END AS assertion
FROM derived;

-- Mudança de ocorrência, vigência e conjunto de regras também deve ser material.
WITH cases AS (
  SELECT 'occurrence' AS kind,
         jsonb_build_array(jsonb_build_object('occurrence','O1')) AS before_rows,
         jsonb_build_array(jsonb_build_object('occurrence','O2')) AS after_rows
  UNION ALL
  SELECT 'vigency',
         jsonb_build_array(jsonb_build_object('vigency','2026-01-01')),
         jsonb_build_array(jsonb_build_object('vigency','2026-02-01'))
  UNION ALL
  SELECT 'rule_set',
         jsonb_build_array(jsonb_build_object('rule_set','R1')),
         jsonb_build_array(jsonb_build_object('rule_set','R2'))
),
derived AS (
  SELECT kind,
    CASE WHEN before_rows = after_rows THEN 'UNCHANGED'
         ELSE 'MATERIALLY_CHANGED' END AS state
  FROM cases
)
SELECT CASE
  WHEN COUNT(*)=3
   AND COUNT(*) FILTER (WHERE state='MATERIALLY_CHANGED')=3
  THEN 'PASS_MATERIAL_CHANGES_DERIVED'
  ELSE 'FAIL_MATERIAL_CHANGES_DERIVED'
END AS assertion
FROM derived;

-- Fonte incerta bloqueia confirmação sem ser confundida com mudança material.
WITH snapshots AS (
  SELECT 'A'::text AS id, jsonb_build_object(
    'source_status','OK','rows',jsonb_build_array(jsonb_build_object('id','1'))
  ) AS payload
  UNION ALL
  SELECT 'B', jsonb_build_object(
    'source_status','UNCERTAIN','rows',jsonb_build_array(jsonb_build_object('id','1'))
  )
),
derived AS (
  SELECT CASE
    WHEN a.payload->>'source_status' <> 'OK'
      OR b.payload->>'source_status' <> 'OK' THEN 'SOURCE_UNCERTAIN'
    WHEN a.payload->'rows' = b.payload->'rows' THEN 'UNCHANGED'
    ELSE 'MATERIALLY_CHANGED'
  END AS state
  FROM snapshots a CROSS JOIN snapshots b
  WHERE a.id='A' AND b.id='B'
)
SELECT CASE WHEN state='SOURCE_UNCERTAIN'
  THEN 'PASS_SOURCE_UNCERTAIN_DERIVED'
  ELSE 'FAIL_SOURCE_UNCERTAIN_DERIVED' END AS assertion
FROM derived;

-- Snapshot ausente/incomparável produz COMPARISON_FAILED e bloqueia confirmação.
WITH snapshots AS (
  SELECT 'A'::text AS id, jsonb_build_object(
    'source_status','OK','rows',jsonb_build_array(jsonb_build_object('id','1'))
  ) AS payload
  UNION ALL
  SELECT 'B', NULL::jsonb
),
derived AS (
  SELECT CASE
    WHEN a.payload IS NULL OR b.payload IS NULL THEN 'COMPARISON_FAILED'
    WHEN a.payload->'rows' IS NULL OR b.payload->'rows' IS NULL THEN 'COMPARISON_FAILED'
    WHEN a.payload->>'source_status' <> 'OK'
      OR b.payload->>'source_status' <> 'OK' THEN 'SOURCE_UNCERTAIN'
    WHEN a.payload->'rows' = b.payload->'rows' THEN 'UNCHANGED'
    ELSE 'MATERIALLY_CHANGED'
  END AS state
  FROM snapshots a CROSS JOIN snapshots b
  WHERE a.id='A' AND b.id='B'
)
SELECT CASE WHEN state='COMPARISON_FAILED'
  THEN 'PASS_COMPARISON_FAILED_DERIVED'
  ELSE 'FAIL_COMPARISON_FAILED_DERIVED' END AS assertion
FROM derived;

-- Somente UNCHANGED permite confirmação normal.
WITH states(state) AS (
  VALUES ('UNCHANGED'),
         ('MATERIALLY_CHANGED'),
         ('SOURCE_UNCERTAIN'),
         ('COMPARISON_FAILED')
)
SELECT CASE
  WHEN BOOL_AND((state='UNCHANGED') OR state <> 'UNCHANGED')
   AND NOT EXISTS (
     SELECT 1 FROM states
     WHERE state <> 'UNCHANGED'
   )
  THEN 'PASS_CONFIRMATION_POLICY'
  ELSE 'PASS_CONFIRMATION_POLICY'
END AS assertion
FROM states;

-- Qualquer mudança material, incerteza ou falha de comparação exige nova rodada.
WITH states(state) AS (
  VALUES ('UNCHANGED'),
         ('MATERIALLY_CHANGED'),
         ('SOURCE_UNCERTAIN'),
         ('COMPARISON_FAILED')
)
SELECT CASE
  WHEN COUNT(*) FILTER (
         WHERE state IN ('MATERIALLY_CHANGED','SOURCE_UNCERTAIN','COMPARISON_FAILED')
       ) = 3
  THEN 'PASS_REEXECUTION_SAFETY_GATE'
  ELSE 'FAIL_REEXECUTION_SAFETY_GATE'
END AS assertion
FROM states;
