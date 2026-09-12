-- Escala de Substituição — prova sintética de optimalidade global v1
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Todos os identificadores são fictícios.
-- Objetivo: demonstrar que maximizar cobertura vem antes da qualidade.

-- CASO 1 — Uma combinação de cobertura 2 deve vencer qualquer combinação
-- de cobertura 1, mesmo quando esta última possui score maior.
WITH plans AS (
  SELECT * FROM (VALUES
    ('P1','UNCOVERED',100,1),
    ('P2','P3',70,2),
    ('P4','P5',60,2)
  ) v(first_teacher,second_teacher,quality,coverage)
), best AS (
  SELECT * FROM plans
  ORDER BY coverage DESC, quality DESC,
           first_teacher||'|'||second_teacher ASC
  LIMIT 1
)
SELECT CASE
  WHEN coverage=2 THEN 'PASS_COVERAGE_PRECEDENCE'
  ELSE 'FAIL_COVERAGE_PRECEDENCE'
END assertion
FROM best;

-- CASO 2 — Entre planos com a mesma cobertura, maior qualidade vence.
WITH plans AS (
  SELECT * FROM (VALUES
    ('P1','P2',170,2),
    ('P3','P4',180,2)
  ) v(first_teacher,second_teacher,quality,coverage)
), best AS (
  SELECT * FROM plans
  ORDER BY coverage DESC, quality DESC,
           first_teacher||'|'||second_teacher ASC
  LIMIT 1
)
SELECT CASE
  WHEN first_teacher='P3' AND second_teacher='P4' AND quality=180
  THEN 'PASS_QUALITY_SECONDARY_OBJECTIVE'
  ELSE 'FAIL_QUALITY_SECONDARY_OBJECTIVE'
END assertion
FROM best;

-- CASO 3 — Empate integral deve produzir assinatura única e determinística.
WITH plans AS (
  SELECT * FROM (VALUES
    ('P1','P2',180,2),
    ('P2','P1',180,2),
    ('P1','P3',180,2)
  ) v(first_teacher,second_teacher,quality,coverage), best AS (
  SELECT * FROM plans
  ORDER BY coverage DESC, quality DESC,
           first_teacher||'|'||second_teacher ASC
  LIMIT 1
)
SELECT CASE
  WHEN first_teacher='P1' AND second_teacher='P2'
  THEN 'PASS_DETERMINISTIC_FINAL_TIEBREAK'
  ELSE 'FAIL_DETERMINISTIC_FINAL_TIEBREAK'
END assertion
FROM best;

-- CASO 4 — Restrição dura é aplicada antes da ordenação por score.
WITH candidates AS (
  SELECT * FROM (VALUES
    ('P1',999,false,true),
    ('P2',1,true,true)
  ) v(teacher_id,score,eligible,available), valid AS (
    SELECT * FROM candidates WHERE eligible AND available
), best AS (
    SELECT * FROM valid ORDER BY score DESC, teacher_id ASC LIMIT 1
)
SELECT CASE
  WHEN teacher_id='P2' THEN 'PASS_HARD_CONSTRAINT_BEFORE_SCORE'
  ELSE 'FAIL_HARD_CONSTRAINT_BEFORE_SCORE'
END assertion
FROM best;

-- CASO 5 — Não reutilizar docente em ocorrências simultâneas é restrição global.
WITH plans AS (
  SELECT * FROM (VALUES
    ('P1','P1',198,2),
    ('P1','P2',180,2),
    ('P2','P1',180,2),
    ('P2','P3',170,2)
  ) v(first_teacher,second_teacher,quality,coverage), valid AS (
    SELECT * FROM plans WHERE first_teacher<>second_teacher
), best AS (
    SELECT * FROM valid
    ORDER BY coverage DESC, quality DESC,
             first_teacher||'|'||second_teacher ASC
    LIMIT 1
)
SELECT CASE
  WHEN first_teacher='P1' AND second_teacher='P2'
  THEN 'PASS_GLOBAL_NON_REUSE'
  ELSE 'FAIL_GLOBAL_NON_REUSE'
END assertion
FROM best;

-- CASO 6 — Se nenhuma combinação cobrir uma ocorrência, ela permanece explícita.
WITH plans AS (
  SELECT * FROM (VALUES
    ('P1','UNCOVERED',1,1),
    ('UNCOVERED','UNCOVERED',0,0)
  ) v(first_teacher,second_teacher,quality,coverage), best AS (
    SELECT * FROM plans
    ORDER BY coverage DESC, quality DESC,
             first_teacher||'|'||second_teacher ASC
    LIMIT 1
)
SELECT CASE
  WHEN coverage=1 AND second_teacher='UNCOVERED'
  THEN 'PASS_PARTIAL_PLAN_EXPLICIT'
  ELSE 'FAIL_PARTIAL_PLAN_EXPLICIT'
END assertion
FROM best;

-- Contrato transversal:
-- 1) cobertura é objetivo primário;
-- 2) qualidade é secundário;
-- 3) restrições duras não são compensáveis por score;
-- 4) empate final é determinístico;
-- 5) resultado permanece recomendação sujeita à validação humana.
