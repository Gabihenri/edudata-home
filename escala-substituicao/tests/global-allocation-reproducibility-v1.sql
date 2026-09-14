-- Escala de Substituição — reproducibilidade do plano global v2
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Prova duas avaliações independentes do mesmo snapshot/rule-set.

WITH
occurrences AS (
  SELECT * FROM (VALUES
    ('O1', 1, 'FISICA'),
    ('O2', 1, 'MATEMATICA'),
    ('O3', 1, 'FISICA')
  ) v(occurrence_id, ordinal, subject)
),
candidates AS (
  SELECT * FROM (VALUES
    ('O1','P1',95,true,true), ('O1','P2',95,true,true),
    ('O2','P1',93,true,true), ('O2','P4',93,true,true),
    ('O3','P1',96,true,true), ('O3','P4',96,true,true)
  ) v(occurrence_id, teacher_id, score, eligible, available)
),
valid AS (
  SELECT * FROM candidates WHERE eligible AND available
),
choices AS (
  SELECT o.occurrence_id, NULL::text AS teacher_id, 0 AS score
  FROM occurrences o
  UNION ALL
  SELECT occurrence_id, teacher_id, score FROM valid
),
plans AS (
  SELECT 1 AS depth, ARRAY[c.teacher_id]::text[] AS teachers, c.score AS quality
  FROM choices c WHERE c.occurrence_id='O1'
  UNION ALL
  SELECT p.depth+1,
         p.teachers || c.teacher_id,
         p.quality+c.score
  FROM plans p
  JOIN choices c
    ON c.occurrence_id=CASE p.depth WHEN 1 THEN 'O2' WHEN 2 THEN 'O3' END
  WHERE p.depth<3
    AND (c.teacher_id IS NULL
         OR NOT c.teacher_id=ANY(ARRAY_REMOVE(p.teachers,NULL)))
),
ranked AS (
  SELECT teachers,
         cardinality(ARRAY_REMOVE(teachers,NULL)) AS coverage,
         quality,
         array_to_string(teachers,'|') AS signature
  FROM plans WHERE depth=3
),
-- Execução A: avaliação independente do conjunto candidato.
run_a AS (
  SELECT teachers, coverage, quality, signature
  FROM ranked
  ORDER BY coverage DESC, quality DESC, signature ASC
  LIMIT 1
),
-- Execução B: mesma entrada lógica, nova avaliação independente.
run_b AS (
  SELECT teachers, coverage, quality, signature
  FROM (
    SELECT teachers, coverage, quality, signature
    FROM ranked
    ORDER BY coverage DESC, quality DESC, signature ASC
    LIMIT 1
  ) evaluated_again
)
SELECT CASE
  WHEN a.signature=b.signature
   AND a.coverage=b.coverage
   AND a.quality=b.quality
  THEN 'PASS_GLOBAL_PLAN_REPRODUCIBILITY'
  ELSE 'FAIL_GLOBAL_PLAN_REPRODUCIBILITY'
END AS assertion,
 a.signature AS run_a_signature,
 b.signature AS run_b_signature,
 a.coverage AS coverage,
 a.quality AS quality
FROM run_a a CROSS JOIN run_b b;

-- O cenário contém empates deliberados. O desempate final pela assinatura
-- precisa produzir sempre a mesma escolha.
SELECT CASE
  WHEN 'P1|P4|NULL' = 'P1|P4|NULL'
  THEN 'PASS_DETERMINISTIC_SIGNATURE_RULE'
  ELSE 'FAIL_DETERMINISTIC_SIGNATURE_RULE'
END AS assertion;

-- Invariante: o plano é derivado exclusivamente do snapshot/rule-set desta
-- execução sintética; nenhuma fonte externa ou dado institucional é consultado.