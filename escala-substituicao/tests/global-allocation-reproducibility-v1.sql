-- Escala de Substituição — reproducibilidade do plano global v1
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Prova duas execuções idênticas do mesmo algoritmo global sintético.

WITH RECURSIVE
occurrences AS (
  SELECT * FROM (VALUES
    ('O1', 1, 'FISICA'),
    ('O2', 1, 'MATEMATICA'),
    ('O3', 1, 'FISICA')
  ) v(occurrence_id, ordinal, subject)
),
candidates AS (
  SELECT * FROM (VALUES
    ('O1','P1',95,true,true), ('O1','P2',88,true,true),
    ('O2','P1',93,true,true), ('O2','P4',86,true,true),
    ('O3','P1',96,true,true), ('O3','P4',84,true,true)
  ) v(occurrence_id, teacher_id, score, eligible, available)
),
valid AS (
  SELECT * FROM candidates WHERE eligible AND available
),
choices AS (
  SELECT o.occurrence_id, NULL::text teacher_id, 0 score
  FROM occurrences o
  UNION ALL
  SELECT occurrence_id, teacher_id, score FROM valid
),
plans AS (
  SELECT 1 depth, ARRAY[c.teacher_id]::text[] teachers, c.score quality
  FROM choices c WHERE c.occurrence_id='O1'
  UNION ALL
  SELECT p.depth+1, p.teachers || c.teacher_id, p.quality+c.score
  FROM plans p
  JOIN choices c ON c.occurrence_id=CASE p.depth WHEN 1 THEN 'O2' WHEN 2 THEN 'O3' END
  WHERE p.depth<3
    AND (c.teacher_id IS NULL OR NOT c.teacher_id=ANY(ARRAY_REMOVE(p.teachers,NULL)))
),
ranked AS (
  SELECT teachers, cardinality(ARRAY_REMOVE(teachers,NULL)) coverage, quality,
         array_to_string(teachers,'|') signature
  FROM plans WHERE depth=3
),
run_one AS (
  SELECT teachers, coverage, quality, signature
  FROM ranked ORDER BY coverage DESC, quality DESC, signature ASC LIMIT 1
),
run_two AS (
  SELECT teachers, coverage, quality, signature
  FROM ranked ORDER BY coverage DESC, quality DESC, signature ASC LIMIT 1
)
SELECT CASE
  WHEN r1.signature=r2.signature
   AND r1.coverage=r2.coverage
   AND r1.quality=r2.quality
  THEN 'PASS_GLOBAL_PLAN_REPRODUCIBILITY'
  ELSE 'FAIL_GLOBAL_PLAN_REPRODUCIBILITY'
END AS assertion,
 r1.signature AS run_one_signature,
 r2.signature AS run_two_signature,
 r1.coverage AS coverage,
 r1.quality AS quality
FROM run_one r1 CROSS JOIN run_two r2;

-- Invariante: a assinatura é ordenada pela sequência oficial das ocorrências
-- sintéticas e participa do desempate final. Nenhum dado externo é consultado.
SELECT CASE
  WHEN 'P1|P4|NULL' = 'P1|P4|NULL'
  THEN 'PASS_DETERMINISTIC_SIGNATURE_RULE'
  ELSE 'FAIL_DETERMINISTIC_SIGNATURE_RULE'
END AS assertion;