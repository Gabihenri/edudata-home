-- Escala de Substituição — R05 disponibilidade temporal v1
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- R05 é deliberadamente independente de R04:
-- R04 verifica elegibilidade; R05 verifica cobertura temporal da disponibilidade.

WITH occurrence AS (
  SELECT 'O1'::text occurrence_id,
         TIMESTAMP '2026-10-06 09:00' AS start_at,
         TIMESTAMP '2026-10-06 10:00' AS end_at
), availability AS (
  SELECT * FROM (VALUES
    ('P1', TIMESTAMP '2026-10-06 08:00', TIMESTAMP '2026-10-06 08:59'),
    ('P2', TIMESTAMP '2026-10-06 09:00', TIMESTAMP '2026-10-06 10:00'),
    ('P3', TIMESTAMP '2026-10-06 09:30', TIMESTAMP '2026-10-06 10:30'),
    ('P4', TIMESTAMP '2026-10-06 10:00', TIMESTAMP '2026-10-06 11:00')
  ) v(teacher_id,start_at,end_at)
), eligible AS (
  SELECT * FROM (VALUES
    ('P1',true),('P2',true),('P3',true),('P4',true)
  ) v(teacher_id,is_eligible)
), valid AS (
  SELECT a.teacher_id
  FROM availability a
  JOIN eligible e USING (teacher_id)
  CROSS JOIN occurrence o
  WHERE e.is_eligible
    AND a.start_at <= o.start_at
    AND a.end_at >= o.end_at
), checks AS (
  SELECT
    COUNT(*) = 1 AS only_full_window,
    BOOL_AND(teacher_id='P2') AS p2_only,
    NOT EXISTS (SELECT 1 FROM valid WHERE teacher_id IN ('P1','P3'))
      AS partial_windows_rejected,
    NOT EXISTS (SELECT 1 FROM valid WHERE teacher_id='P4')
      AS boundary_rejected
  FROM valid
)
SELECT
  CASE WHEN only_full_window AND p2_only
    THEN 'PASS_R05_FULL_WINDOW_REQUIRED'
    ELSE 'FAIL_R05_FULL_WINDOW_REQUIRED' END AS full_window,
  CASE WHEN partial_windows_rejected AND boundary_rejected
    THEN 'PASS_R05_PARTIAL_AND_BOUNDARY_AVAILABILITY'
    ELSE 'FAIL_R05_PARTIAL_AND_BOUNDARY_AVAILABILITY' END AS temporal_availability
FROM checks;

-- Evidência esperada no PostgreSQL:
-- PASS_R05_FULL_WINDOW_REQUIRED
-- PASS_R05_PARTIAL_AND_BOUNDARY_AVAILABILITY
