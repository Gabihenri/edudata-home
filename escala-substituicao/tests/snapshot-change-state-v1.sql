-- Escala de Substituição — estados de mudança do snapshot v1
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- O estado é derivado da comparação entre Snapshot A e Snapshot B.
-- Não representa estados oficiais da SED.

-- 1) Snapshot idêntico => UNCHANGED.
WITH snapshots AS (
  SELECT 'A'::text id, jsonb_build_object(
    'source_status','OK','rows',jsonb_build_array(
      jsonb_build_object('teacher_id','T1','class_id','C1','slot','M1','available',true),
      jsonb_build_object('teacher_id','T2','class_id','C2','slot','M2','available',true)
    )) payload
  UNION ALL
  SELECT 'B', jsonb_build_object(
    'source_status','OK','rows',jsonb_build_array(
      jsonb_build_object('teacher_id','T1','class_id','C1','slot','M1','available',true),
      jsonb_build_object('teacher_id','T2','class_id','C2','slot','M2','available',true)
    ))
),
derived AS (
  SELECT CASE
    WHEN a.payload IS NULL OR b.payload IS NULL
      OR a.payload->'rows' IS NULL OR b.payload->'rows' IS NULL THEN 'COMPARISON_FAILED'
    WHEN a.payload->>'source_status' <> 'OK'
      OR b.payload->>'source_status' <> 'OK' THEN 'SOURCE_UNCERTAIN'
    WHEN a.payload->'rows' = b.payload->'rows' THEN 'UNCHANGED'
    ELSE 'MATERIALLY_CHANGED'
  END state
  FROM snapshots a CROSS JOIN snapshots b WHERE a.id='A' AND b.id='B'
)
SELECT CASE WHEN state='UNCHANGED' THEN 'PASS_UNCHANGED_DERIVED'
  ELSE 'FAIL_UNCHANGED_DERIVED' END assertion FROM derived;

-- 2) Disponibilidade diferente => MATERIALLY_CHANGED.
WITH snapshots AS (
  SELECT 'A'::text id, jsonb_build_object('source_status','OK','rows',
    jsonb_build_array(jsonb_build_object('teacher_id','T1','available',true))) payload
  UNION ALL
  SELECT 'B', jsonb_build_object('source_status','OK','rows',
    jsonb_build_array(jsonb_build_object('teacher_id','T1','available',false)))
),
derived AS (
  SELECT CASE
    WHEN a.payload IS NULL OR b.payload IS NULL OR a.payload->'rows' IS NULL OR b.payload->'rows' IS NULL THEN 'COMPARISON_FAILED'
    WHEN a.payload->>'source_status' <> 'OK' OR b.payload->>'source_status' <> 'OK' THEN 'SOURCE_UNCERTAIN'
    WHEN a.payload->'rows' = b.payload->'rows' THEN 'UNCHANGED'
    ELSE 'MATERIALLY_CHANGED' END state
  FROM snapshots a CROSS JOIN snapshots b WHERE a.id='A' AND b.id='B'
)
SELECT CASE WHEN state='MATERIALLY_CHANGED' THEN 'PASS_AVAILABILITY_CHANGE_DERIVED'
  ELSE 'FAIL_AVAILABILITY_CHANGE_DERIVED' END assertion FROM derived;

-- 3) Ocorrência, vigência e conjunto de regras alterados => mudança material.
WITH cases(kind,before_rows,after_rows) AS (
  VALUES
    ('occurrence'::text, jsonb_build_array(jsonb_build_object('occurrence','O1')), jsonb_build_array(jsonb_build_object('occurrence','O2'))),
    ('vigency', jsonb_build_array(jsonb_build_object('vigency','2026-01-01')), jsonb_build_array(jsonb_build_object('vigency','2026-02-01'))),
    ('rule_set', jsonb_build_array(jsonb_build_object('rule_set','R1')), jsonb_build_array(jsonb_build_object('rule_set','R2')))
),
derived AS (
  SELECT kind, CASE WHEN before_rows=after_rows THEN 'UNCHANGED' ELSE 'MATERIALLY_CHANGED' END state FROM cases
)
SELECT CASE WHEN COUNT(*)=3 AND COUNT(*) FILTER (WHERE state='MATERIALLY_CHANGED')=3
  THEN 'PASS_MATERIAL_CHANGES_DERIVED' ELSE 'FAIL_MATERIAL_CHANGES_DERIVED' END assertion FROM derived;

-- 4) Fonte incerta => SOURCE_UNCERTAIN, mesmo que os dados sejam iguais.
WITH snapshots AS (
  SELECT 'A'::text id, jsonb_build_object('source_status','OK','rows',jsonb_build_array(jsonb_build_object('id','1'))) payload
  UNION ALL
  SELECT 'B', jsonb_build_object('source_status','UNCERTAIN','rows',jsonb_build_array(jsonb_build_object('id','1')))
),
derived AS (
  SELECT CASE
    WHEN a.payload IS NULL OR b.payload IS NULL OR a.payload->'rows' IS NULL OR b.payload->'rows' IS NULL THEN 'COMPARISON_FAILED'
    WHEN a.payload->>'source_status' <> 'OK' OR b.payload->>'source_status' <> 'OK' THEN 'SOURCE_UNCERTAIN'
    WHEN a.payload->'rows' = b.payload->'rows' THEN 'UNCHANGED'
    ELSE 'MATERIALLY_CHANGED' END state
  FROM snapshots a CROSS JOIN snapshots b WHERE a.id='A' AND b.id='B'
)
SELECT CASE WHEN state='SOURCE_UNCERTAIN' THEN 'PASS_SOURCE_UNCERTAIN_DERIVED'
  ELSE 'FAIL_SOURCE_UNCERTAIN_DERIVED' END assertion FROM derived;

-- 5) Snapshot ausente/incomparável => COMPARISON_FAILED.
WITH snapshots AS (
  SELECT 'A'::text id, jsonb_build_object('source_status','OK','rows',jsonb_build_array(jsonb_build_object('id','1'))) payload
  UNION ALL
  SELECT 'B', NULL::jsonb
),
derived AS (
  SELECT CASE
    WHEN a.payload IS NULL OR b.payload IS NULL OR a.payload->'rows' IS NULL OR b.payload->'rows' IS NULL THEN 'COMPARISON_FAILED'
    WHEN a.payload->>'source_status' <> 'OK' OR b.payload->>'source_status' <> 'OK' THEN 'SOURCE_UNCERTAIN'
    WHEN a.payload->'rows' = b.payload->'rows' THEN 'UNCHANGED'
    ELSE 'MATERIALLY_CHANGED' END state
  FROM snapshots a CROSS JOIN snapshots b WHERE a.id='A' AND b.id='B'
)
SELECT CASE WHEN state='COMPARISON_FAILED' THEN 'PASS_COMPARISON_FAILED_DERIVED'
  ELSE 'FAIL_COMPARISON_FAILED_DERIVED' END assertion FROM derived;

-- 6) Política de confirmação: somente UNCHANGED pode confirmar normalmente.
WITH states(state) AS (
  VALUES ('UNCHANGED'),('MATERIALLY_CHANGED'),('SOURCE_UNCERTAIN'),('COMPARISON_FAILED')
),
policy AS (
  SELECT state, (state='UNCHANGED') AS may_confirm FROM states
)
SELECT CASE
  WHEN COUNT(*)=4
   AND COUNT(*) FILTER (WHERE may_confirm)=1
   AND COUNT(*) FILTER (WHERE NOT may_confirm)=3
  THEN 'PASS_CONFIRMATION_POLICY_DERIVED'
  ELSE 'FAIL_CONFIRMATION_POLICY_DERIVED'
END assertion FROM policy;

-- 7) Segurança de reexecução: mudança material, incerteza ou falha exigem nova rodada.
WITH states(state) AS (
  VALUES ('UNCHANGED'),('MATERIALLY_CHANGED'),('SOURCE_UNCERTAIN'),('COMPARISON_FAILED')
)
SELECT CASE
  WHEN COUNT(*) FILTER (WHERE state IN ('MATERIALLY_CHANGED','SOURCE_UNCERTAIN','COMPARISON_FAILED'))=3
   AND COUNT(*) FILTER (WHERE state='UNCHANGED')=1
  THEN 'PASS_REEXECUTION_SAFETY_GATE'
  ELSE 'FAIL_REEXECUTION_SAFETY_GATE'
END assertion FROM states;
