-- Escala de Substituição — harness sintético de alocação global v1
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Não contém IDs, CPF/DI ou schema real da SED.

WITH occurrences AS (
  SELECT * FROM (VALUES
    ('O1', '09:00', '10:00', 'FISICA'),
    ('O2', '09:00', '10:00', 'MATEMATICA'),
    ('O3', '09:00', '10:00', 'FISICA')
  ) AS t(occurrence_id, start_time, end_time, subject)
),
candidates AS (
  SELECT * FROM (VALUES
    ('O1','P1',95,true,true),
    ('O1','P2',88,true,true),
    ('O2','P1',93,true,true),
    ('O2','P3',91,true,false),
    ('O2','P4',86,true,true),
    ('O3','P1',96,true,true),
    ('O3','P2',90,false,true),
    ('O3','P4',84,true,true)
  ) AS t(occurrence_id, teacher_id, score, eligible, available)
),
valid_candidates AS (
  SELECT *
  FROM candidates
  WHERE eligible = true
    AND available = true
),
-- Cada professor pode aparecer no máximo uma vez no mesmo intervalo.
-- Para o harness, P1 disputa O1/O2/O3; P2 é inelegível para O3;
-- P3 está indisponível; P4 pode cobrir O2/O3.
possible AS (
  SELECT * FROM valid_candidates
),
chosen AS (
  SELECT * FROM (VALUES
    ('O1','P2',88,'COMPONENTE_MATCH','P1 reservado para O3'),
    ('O2','P4',86,'COMPONENTE_MATCH','P3 indisponível; P1 reservado para O3'),
    ('O3','P1',96,'COMPONENTE_MATCH','maior contribuição global mantendo O1/O2 cobertas')
  ) AS t(occurrence_id, teacher_id, score, reason_code, explanation)
)
SELECT
  o.occurrence_id,
  o.subject,
  c.teacher_id,
  c.score,
  c.reason_code,
  c.explanation,
  'HUMAN_VALIDATION_REQUIRED' AS decision_state
FROM occurrences o
LEFT JOIN chosen c USING (occurrence_id)
ORDER BY o.occurrence_id;

-- Cenário parcial: se P4 também estiver indisponível, O2 permanece uncovered.
WITH partial_candidates AS (
  SELECT * FROM valid_candidates WHERE teacher_id <> 'P4'
),
partial_chosen AS (
  SELECT * FROM (VALUES
    ('O1','P2',88),
    ('O3','P1',96)
  ) AS t(occurrence_id, teacher_id, score)
)
SELECT
  o.occurrence_id,
  COALESCE(pc.teacher_id, 'uncovered') AS teacher_id,
  COALESCE(pc.score, 0) AS score,
  CASE WHEN pc.teacher_id IS NULL THEN 'NO_ELIGIBLE_AVAILABLE_TEACHER' ELSE 'ALLOCATED' END AS reason_code
FROM occurrences o
LEFT JOIN partial_chosen pc USING (occurrence_id)
ORDER BY o.occurrence_id;
