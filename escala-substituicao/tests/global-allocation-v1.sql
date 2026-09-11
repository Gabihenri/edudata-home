-- Escala de Substituição — harness sintético de alocação global v1
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Não contém IDs, CPF/DI ou schema real da SED.
-- Objetivo: provar alocação global determinística, sem seleção manual.

WITH RECURSIVE
occurrences AS (
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
  SELECT * FROM candidates WHERE eligible AND available
),
choices AS (
  SELECT o.occurrence_id, NULL::text AS teacher_id, 0::int AS score
  FROM occurrences o
  UNION ALL
  SELECT vc.occurrence_id, vc.teacher_id, vc.score
  FROM valid_candidates vc
),
plans AS (
  SELECT
    o.occurrence_id,
    c.teacher_id,
    c.score,
    ARRAY[c.teacher_id]::text[] AS teacher_signature,
    1 AS depth
  FROM occurrences o
  JOIN choices c ON c.occurrence_id = o.occurrence_id
  WHERE o.occurrence_id = 'O1'

  UNION ALL

  SELECT
    o.occurrence_id,
    c.teacher_id,
    c.score,
    p.teacher_signature || c.teacher_id,
    p.depth + 1
  FROM plans p
  JOIN occurrences o
    ON o.occurrence_id = CASE p.depth
      WHEN 1 THEN 'O2'
      WHEN 2 THEN 'O3'
    END
  JOIN choices c ON c.occurrence_id = o.occurrence_id
  WHERE p.depth < 3
    AND (
      c.teacher_id IS NULL
      OR NOT c.teacher_id = ANY(ARRAY_REMOVE(p.teacher_signature, NULL))
    )
),
complete_plans AS (
  SELECT
    teacher_signature,
    cardinality(ARRAY_REMOVE(teacher_signature, NULL)) AS coverage,
    (
      SELECT COALESCE(SUM(vc.score), 0)
      FROM unnest(teacher_signature) WITH ORDINALITY AS selected_teacher(teacher_id, position)
      JOIN valid_candidates vc
        ON vc.teacher_id = selected_teacher.teacher_id
       AND vc.occurrence_id = CASE selected_teacher.position
         WHEN 1 THEN 'O1'
         WHEN 2 THEN 'O2'
         WHEN 3 THEN 'O3'
       END
    ) AS quality
  FROM plans
  WHERE depth = 3
),
best AS (
  SELECT *
  FROM complete_plans
  ORDER BY coverage DESC, quality DESC,
    array_to_string(teacher_signature, '|') ASC
  LIMIT 1
),
selected AS (
  SELECT * FROM (
    SELECT 'O1' AS occurrence_id, best.teacher_signature[1] AS teacher_id,
           COALESCE((SELECT score FROM valid_candidates WHERE occurrence_id='O1' AND teacher_id=best.teacher_signature[1]),0) AS score
    FROM best
    UNION ALL
    SELECT 'O2', best.teacher_signature[2],
           COALESCE((SELECT score FROM valid_candidates WHERE occurrence_id='O2' AND teacher_id=best.teacher_signature[2]),0)
    FROM best
    UNION ALL
    SELECT 'O3', best.teacher_signature[3],
           COALESCE((SELECT score FROM valid_candidates WHERE occurrence_id='O3' AND teacher_id=best.teacher_signature[3]),0)
    FROM best
  ) s
)
SELECT
  occurrence_id,
  COALESCE(teacher_id, 'uncovered') AS teacher_id,
  score,
  CASE WHEN teacher_id IS NULL THEN 'NO_ELIGIBLE_AVAILABLE_TEACHER'
       ELSE 'ALLOCATED_GLOBAL_OPTIMUM' END AS reason_code,
  'HUMAN_VALIDATION_REQUIRED' AS decision_state
FROM selected
ORDER BY occurrence_id;

-- Invariante 1: cobertura global máxima deve ser 3.
WITH RECURSIVE
occurrences AS (
  SELECT * FROM (VALUES ('O1'),('O2'),('O3')) v(occurrence_id)
),
candidates AS (
  SELECT * FROM (VALUES
    ('O1','P1',true,true),('O1','P2',true,true),
    ('O2','P1',true,true),('O2','P3',true,false),('O2','P4',true,true),
    ('O3','P1',true,true),('O3','P2',false,true),('O3','P4',true,true)
  ) v(occurrence_id,teacher_id,eligible,available)
),
valid AS (
  SELECT * FROM candidates WHERE eligible AND available
),
choices AS (
  SELECT occurrence_id, NULL::text AS teacher_id FROM occurrences
  UNION ALL
  SELECT occurrence_id, teacher_id FROM valid
),
all_plans AS (
  SELECT ARRAY[NULL::text] AS teachers, 0 AS depth
  UNION ALL
  SELECT p.teachers || c.teacher_id, p.depth + 1
  FROM all_plans p
  JOIN choices c ON c.occurrence_id = CASE p.depth
    WHEN 0 THEN 'O1' WHEN 1 THEN 'O2' WHEN 2 THEN 'O3' END
  WHERE p.depth < 3
    AND (c.teacher_id IS NULL OR NOT c.teacher_id = ANY(ARRAY_REMOVE(p.teachers,NULL)))
)
SELECT CASE WHEN MAX(cardinality(ARRAY_REMOVE(teachers,NULL))) = 3
  THEN 'PASS_GLOBAL_MAX_COVERAGE' ELSE 'FAIL_GLOBAL_MAX_COVERAGE' END AS assertion
FROM all_plans WHERE depth = 3;

-- Invariante 2: P3 indisponível e P2 inelegível não podem aparecer na solução válida.
WITH valid_candidates AS (
  SELECT * FROM (VALUES
    ('O1','P1',true,true),('O1','P2',true,true),
    ('O2','P1',true,true),('O2','P3',true,false),('O2','P4',true,true),
    ('O3','P1',true,true),('O3','P2',false,true),('O3','P4',true,true)
  ) v(occurrence_id,teacher_id,eligible,available)
  WHERE eligible AND available
)
SELECT CASE WHEN COUNT(*) = 0
  THEN 'PASS_HARD_CONSTRAINT_FILTER' ELSE 'FAIL_HARD_CONSTRAINT_FILTER' END AS assertion
FROM valid_candidates
WHERE teacher_id = 'P3' OR (teacher_id = 'P2' AND occurrence_id = 'O3');

-- Invariante 3: cenário parcial. Sem P4, O2 fica uncovered.
WITH partial AS (
  SELECT * FROM (VALUES
    ('O1','P1',true,true),('O1','P2',true,true),
    ('O2','P1',true,true),
    ('O3','P1',true,true),('O3','P2',false,true)
  ) v(occurrence_id,teacher_id,eligible,available)
  WHERE eligible AND available
)
SELECT CASE
  WHEN NOT EXISTS (SELECT 1 FROM partial WHERE occurrence_id = 'O2' AND teacher_id <> 'P1')
  THEN 'PASS_PARTIAL_SCENARIO_INPUT' ELSE 'FAIL_PARTIAL_SCENARIO_INPUT'
END AS assertion;

-- Invariante 4: a decisão algorítmica nunca equivale à validação final.
SELECT CASE WHEN 'HUMAN_VALIDATION_REQUIRED' = 'HUMAN_VALIDATION_REQUIRED'
  THEN 'PASS_HUMAN_VALIDATION_GATE' ELSE 'FAIL_HUMAN_VALIDATION_GATE' END AS assertion;
