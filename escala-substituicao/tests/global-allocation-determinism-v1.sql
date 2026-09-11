-- Escala de Substituição — harness sintético de determinismo v1
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Todos os identificadores são fictícios.

-- O mesmo snapshot/rule-set é calculado duas vezes a partir da mesma entrada.
-- A assinatura canônica deve permanecer idêntica.
WITH input AS (
  SELECT * FROM (VALUES
    ('O1','P1',95),
    ('O1','P2',90),
    ('O2','P1',93),
    ('O2','P3',91),
    ('O3','P2',89),
    ('O3','P3',88)
  ) v(occurrence_id,teacher_id,score)
), run_a AS (
  SELECT occurrence_id, teacher_id, score,
         row_number() OVER (
           PARTITION BY occurrence_id
           ORDER BY score DESC, teacher_id ASC
         ) AS rn
  FROM input
), run_b AS (
  SELECT occurrence_id, teacher_id, score,
         row_number() OVER (
           PARTITION BY occurrence_id
           ORDER BY score DESC, teacher_id ASC
         ) AS rn
  FROM input
), sig_a AS (
  SELECT string_agg(occurrence_id||'='||teacher_id, '|' ORDER BY occurrence_id) AS signature
  FROM run_a WHERE rn=1
), sig_b AS (
  SELECT string_agg(occurrence_id||'='||teacher_id, '|' ORDER BY occurrence_id) AS signature
  FROM run_b WHERE rn=1
)
SELECT CASE
  WHEN sig_a.signature=sig_b.signature THEN 'PASS_DETERMINISTIC_REPRODUCTION'
  ELSE 'FAIL_DETERMINISTIC_REPRODUCTION'
END assertion
FROM sig_a CROSS JOIN sig_b;

-- Regra transversal: este teste verifica determinismo sintético;
-- não valida identificadores, schema ou regras técnicas da SED.