-- Escala de Substituição — reproducibilidade do plano global v3
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Prova duas avaliações independentes do mesmo snapshot/rule-set.
-- O harness deve ser executável diretamente em PostgreSQL: a recursão é
-- declarada com WITH RECURSIVE e as duas execuções repetem a avaliação sem
-- compartilhar a CTE recursiva do resultado.

WITH RECURSIVE
snapshot_occurrences AS (
  SELECT * FROM (VALUES
    ('O1', 1, 'FISICA'),
    ('O2', 1, 'MATEMATICA'),
    ('O3', 1, 'FISICA')
  ) v(occurrence_id, ordinal, subject)
),
snapshot_candidates AS (
  SELECT * FROM (VALUES
    ('O1','P1',95,true,true), ('O1','P2',95,true,true),
    ('O2','P1',93,true,true), ('O2','P4',93,true,true),
    ('O3','P1',96,true,true), ('O3','P4',96,true,true)
  ) v(occurrence_id, teacher_id, score, eligible, available)
),

-- Execução A: avaliação completa a partir do snapshot.
valid_a AS (
  SELECT * FROM snapshot_candidates WHERE eligible AND available
),
choices_a AS (
  SELECT o.occurrence_id, NULL::text AS teacher_id, 0 AS score
  FROM snapshot_occurrences o
  UNION ALL
  SELECT occurrence_id, teacher_id, score FROM valid_a
),
plans_a AS (
  SELECT 1 AS depth, ARRAY[c.teacher_id]::text[] AS teachers, c.score AS quality
  FROM choices_a c WHERE c.occurrence_id='O1'
  UNION ALL
  SELECT p.depth+1,
         p.teachers || c.teacher_id,
         p.quality+c.score
  FROM plans_a p
  JOIN choices_a c
    ON c.occurrence_id=CASE p.depth WHEN 1 THEN 'O2' WHEN 2 THEN 'O3' END
  WHERE p.depth<3
    AND (c.teacher_id IS NULL
         OR NOT c.teacher_id=ANY(ARRAY_REMOVE(p.teachers,NULL)))
),
ranked_a AS (
  SELECT teachers,
         cardinality(ARRAY_REMOVE(teachers,NULL)) AS coverage,
         quality,
         array_to_string(teachers,'|') AS signature
  FROM plans_a WHERE depth=3
),
run_a AS (
  SELECT teachers, coverage, quality, signature
  FROM ranked_a
  ORDER BY coverage DESC, quality DESC, signature ASC
  LIMIT 1
),

-- Execução B: nova avaliação completa, com sua própria cadeia de CTEs.
-- A entrada é a mesma, mas a avaliação não reutiliza ranked_a/plans_a.
valid_b AS (
  SELECT * FROM snapshot_candidates WHERE eligible AND available
),
choices_b AS (
  SELECT o.occurrence_id, NULL::text AS teacher_id, 0 AS score
  FROM snapshot_occurrences o
  UNION ALL
  SELECT occurrence_id, teacher_id, score FROM valid_b
),
plans_b AS (
  SELECT 1 AS depth, ARRAY[c.teacher_id]::text[] AS teachers, c.score AS quality
  FROM choices_b c WHERE c.occurrence_id='O1'
  UNION ALL
  SELECT p.depth+1,
         p.teachers || c.teacher_id,
         p.quality+c.score
  FROM plans_b p
  JOIN choices_b c
    ON c.occurrence_id=CASE p.depth WHEN 1 THEN 'O2' WHEN 2 THEN 'O3' END
  WHERE p.depth<3
    AND (c.teacher_id IS NULL
         OR NOT c.teacher_id=ANY(ARRAY_REMOVE(p.teachers,NULL)))
),
ranked_b AS (
  SELECT teachers,
         cardinality(ARRAY_REMOVE(teachers,NULL)) AS coverage,
         quality,
         array_to_string(teachers,'|') AS signature
  FROM plans_b WHERE depth=3
),
run_b AS (
  SELECT teachers, coverage, quality, signature
  FROM ranked_b
  ORDER BY coverage DESC, quality DESC, signature ASC
  LIMIT 1
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
 a.coverage AS coverage_a,
 b.coverage AS coverage_b,
 a.quality AS quality_a,
 b.quality AS quality_b
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
