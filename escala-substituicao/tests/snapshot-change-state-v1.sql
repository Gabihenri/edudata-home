-- Escala de Substituição — estados de mudança do snapshot v1
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Testa somente comportamento conceitual; não representa estados oficiais da SED.

WITH scenarios AS (
  SELECT * FROM (VALUES
    ('S1','same','UNCHANGED',true),
    ('S2','availability_changed','MATERIALLY_CHANGED',false),
    ('S3','occurrence_changed','MATERIALLY_CHANGED',false),
    ('S4','vigency_changed','MATERIALLY_CHANGED',false),
    ('S5','rule_set_changed','MATERIALLY_CHANGED',false),
    ('S6','source_uncertain','SOURCE_UNCERTAIN',false),
    ('S7','comparison_failed','COMPARISON_FAILED',false)
  ) v(id,scenario,expected_state,may_confirm)
)
SELECT CASE
  WHEN COUNT(*)=7
   AND COUNT(*) FILTER (WHERE may_confirm)=1
   AND COUNT(*) FILTER (WHERE expected_state='MATERIALLY_CHANGED')=4
  THEN 'PASS_CHANGE_STATE_MATRIX'
  ELSE 'FAIL_CHANGE_STATE_MATRIX'
END AS assertion
FROM scenarios;

-- Somente UNCHANGED permite confirmação normal; estados incertos também bloqueiam.
WITH scenarios AS (
  SELECT * FROM (VALUES
    ('S1','same','UNCHANGED',true),
    ('S2','availability_changed','MATERIALLY_CHANGED',false),
    ('S3','occurrence_changed','MATERIALLY_CHANGED',false),
    ('S4','vigency_changed','MATERIALLY_CHANGED',false),
    ('S5','rule_set_changed','MATERIALLY_CHANGED',false),
    ('S6','source_uncertain','SOURCE_UNCERTAIN',false),
    ('S7','comparison_failed','COMPARISON_FAILED',false)
  ) v(id,scenario,expected_state,may_confirm)
)
SELECT CASE
  WHEN NOT EXISTS (
    SELECT 1 FROM scenarios
    WHERE expected_state <> 'UNCHANGED' AND may_confirm=true
  )
  THEN 'PASS_CONFIRMATION_BLOCKED_ON_CHANGE'
  ELSE 'FAIL_CONFIRMATION_BLOCKED_ON_CHANGE'
END AS assertion;

-- Mudança material exige nova rodada; incerteza de fonte/comparação também não
-- pode ser tratada como se o snapshot antigo continuasse válido.
WITH scenarios AS (
  SELECT * FROM (VALUES
    ('S1','same','UNCHANGED',true),
    ('S2','availability_changed','MATERIALLY_CHANGED',false),
    ('S3','occurrence_changed','MATERIALLY_CHANGED',false),
    ('S4','vigency_changed','MATERIALLY_CHANGED',false),
    ('S5','rule_set_changed','MATERIALLY_CHANGED',false),
    ('S6','source_uncertain','SOURCE_UNCERTAIN',false),
    ('S7','comparison_failed','COMPARISON_FAILED',false)
  ) v(id,scenario,expected_state,may_confirm)
)
SELECT CASE
  WHEN COUNT(*) FILTER (WHERE expected_state IN
        ('MATERIALLY_CHANGED','SOURCE_UNCERTAIN','COMPARISON_FAILED')) = 6
  THEN 'PASS_REEXECUTION_SAFETY_GATE'
  ELSE 'FAIL_REEXECUTION_SAFETY_GATE'
END AS assertion
FROM scenarios;