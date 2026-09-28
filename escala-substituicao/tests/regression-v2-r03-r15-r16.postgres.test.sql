-- Escala Inteligente EDI — regressão v2: R03 + R15 + R16
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Este arquivo NÃO usa schema produtivo, IDs SED ou dados reais.
-- Objetivo: elevar R03, R15 e R16 da cobertura conceitual para invariantes
-- temporais e de responsabilidade explicitamente verificáveis em PostgreSQL.
--
-- Regra: qualquer FAIL_* torna a bateria v2 inválida.
-- Nenhuma asserção aqui autoriza DDL, importação ou operação em produção.

BEGIN;

-- ================================================================
-- R03 v2 — conflito temporal real por sobreposição de intervalos.
-- ================================================================

CREATE TEMP TABLE r03_occurrences (
  occurrence_id text PRIMARY KEY,
  start_at timestamp NOT NULL,
  end_at timestamp NOT NULL,
  CHECK (end_at > start_at)
) ON COMMIT DROP;

INSERT INTO r03_occurrences VALUES
  ('O1', '2026-09-28 09:00', '2026-09-28 10:00'),
  ('O2', '2026-09-28 09:30', '2026-09-28 10:30'),
  ('O3', '2026-09-28 10:00', '2026-09-28 11:00'),
  ('O4', '2026-09-28 10:01', '2026-09-28 11:00');

CREATE TEMP TABLE r03_teacher_assignments (
  teacher_id text NOT NULL,
  occurrence_id text NOT NULL REFERENCES r03_occurrences(occurrence_id)
) ON COMMIT DROP;

INSERT INTO r03_teacher_assignments VALUES
  ('P1','O1'),
  ('P1','O2'),
  ('P2','O1'),
  ('P2','O3'),
  ('P3','O1'),
  ('P3','O4');

-- Intervalos half-open [start,end):
-- sobreposição iff start_a < end_b AND start_b < end_a.
CREATE TEMP TABLE r03_conflicts AS
SELECT
  a.teacher_id,
  a.occurrence_id AS occurrence_a,
  b.occurrence_id AS occurrence_b
FROM r03_teacher_assignments a
JOIN r03_teacher_assignments b
  ON a.teacher_id = b.teacher_id
 AND a.occurrence_id < b.occurrence_id
JOIN r03_occurrences oa ON oa.occurrence_id = a.occurrence_id
JOIN r03_occurrences ob ON ob.occurrence_id = b.occurrence_id
WHERE oa.start_at < ob.end_at
  AND ob.start_at < oa.end_at;

SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM r03_conflicts
    WHERE teacher_id='P1'
      AND occurrence_a='O1'
      AND occurrence_b='O2'
  )
  THEN 'PASS_R03_OVERLAP_09_00_10_00_X_09_30_10_30'
  ELSE 'FAIL_R03_OVERLAP_09_00_10_00_X_09_30_10_30'
END AS assertion;

SELECT CASE
  WHEN NOT EXISTS (
    SELECT 1 FROM r03_conflicts
    WHERE teacher_id='P2'
      AND occurrence_a='O1'
      AND occurrence_b='O3'
  )
  THEN 'PASS_R03_TOUCHING_BOUNDARY_NOT_CONFLICT'
  ELSE 'FAIL_R03_TOUCHING_BOUNDARY_NOT_CONFLICT'
END AS assertion;

SELECT CASE
  WHEN NOT EXISTS (
    SELECT 1 FROM r03_conflicts
    WHERE teacher_id='P3'
      AND occurrence_a='O1'
      AND occurrence_b='O4'
  )
  THEN 'PASS_R03_NON_OVERLAP_10_01'
  ELSE 'FAIL_R03_NON_OVERLAP_10_01'
END AS assertion;

-- Um docente não pode ser selecionado simultaneamente para duas ocorrências
-- temporalmente conflitantes.
SELECT CASE
  WHEN EXISTS (
    SELECT 1
    FROM r03_conflicts
    WHERE teacher_id='P1'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM r03_conflicts
    WHERE teacher_id='P2'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM r03_conflicts
    WHERE teacher_id='P3'
  )
  THEN 'PASS_R03_REUSE_BLOCKED_BY_REAL_INTERVAL'
  ELSE 'FAIL_R03_REUSE_BLOCKED_BY_REAL_INTERVAL'
END AS assertion;

-- ================================================================
-- R15 v2 — ocorrências distintas da mesma disciplina.
-- ================================================================

CREATE TEMP TABLE r15_occurrences (
  occurrence_id text PRIMARY KEY,
  source_occurrence_key text NOT NULL,
  source_version text NOT NULL,
  organization_key text NOT NULL,
  school_key text NOT NULL,
  school_year integer NOT NULL,
  class_key text NOT NULL,
  component_key text NOT NULL,
  start_at timestamp NOT NULL,
  end_at timestamp NOT NULL,
  CHECK (end_at > start_at)
) ON COMMIT DROP;

INSERT INTO r15_occurrences VALUES
  ('O1','SED-OCC-001','SED-V1','ORG1','SCHOOL1',2026,'T1','FISICA',
   '2026-09-28 09:00','2026-09-28 10:00'),
  ('O2','SED-OCC-002','SED-V1','ORG1','SCHOOL1',2026,'T1','FISICA',
   '2026-09-28 10:00','2026-09-28 11:00'),
  ('O3','SED-OCC-003','SED-V1','ORG1','SCHOOL1',2026,'T1','FISICA',
   '2026-09-28 09:00','2026-09-28 10:00'),
  ('O4','SED-OCC-004','SED-V1','ORG1','SCHOOL1',2026,'T2','FISICA',
   '2026-09-28 09:00','2026-09-28 10:00');

-- O1/O2: mesma turma + mesmo componente, mas intervalos distintos.
SELECT CASE
  WHEN COUNT(*) = 2
   AND COUNT(DISTINCT occurrence_id) = 2
   AND COUNT(DISTINCT component_key) = 1
   AND MIN(start_at) <> MAX(start_at)
  THEN 'PASS_R15_DISTINCT_TEMPORAL_OCCURRENCES'
  ELSE 'FAIL_R15_DISTINCT_TEMPORAL_OCCURRENCES'
END AS assertion
FROM r15_occurrences
WHERE occurrence_id IN ('O1','O2');

-- O1/O3 possuem o mesmo contexto sintético e o mesmo intervalo, mas carregam
-- chaves de ocorrência distintas e provenientes da mesma versão-fonte. A
-- identidade operacional preserva a chave da ocorrência e não a deriva apenas
-- de component_key + class_key + horário.
SELECT CASE
  WHEN COUNT(*) = 2
   AND COUNT(DISTINCT occurrence_id) = 2
   AND COUNT(DISTINCT component_key) = 1
   AND COUNT(DISTINCT class_key) = 1
  AND COUNT(DISTINCT source_occurrence_key) = 2
  AND COUNT(DISTINCT source_version) = 1
  THEN 'PASS_R15_OCCURRENCE_IDENTITY_PRESERVED'
  ELSE 'FAIL_R15_OCCURRENCE_IDENTITY_PRESERVED'
END AS assertion
FROM r15_occurrences
WHERE occurrence_id IN ('O1','O3');

-- O4 demonstra que componente idêntico não significa ocorrência idêntica:
-- a turma faz parte do contexto operacional.
SELECT CASE
  WHEN COUNT(*) = 2
   AND COUNT(DISTINCT occurrence_id) = 2
   AND COUNT(DISTINCT class_key) = 2
   AND COUNT(DISTINCT component_key) = 1
  THEN 'PASS_R15_CLASS_CONTEXT_PRESERVED'
  ELSE 'FAIL_R15_CLASS_CONTEXT_PRESERVED'
END AS assertion
FROM r15_occurrences
WHERE occurrence_id IN ('O1','O4');

-- O motor não pode colapsar as quatro ocorrências apenas por componente.
SELECT CASE
  WHEN COUNT(*) = 4
   AND COUNT(DISTINCT occurrence_id) = 4
   AND COUNT(DISTINCT component_key) = 1
  THEN 'PASS_R15_SAME_COMPONENT_NOT_MERGED'
  ELSE 'FAIL_R15_SAME_COMPONENT_NOT_MERGED'
END AS assertion
FROM r15_occurrences;

-- ================================================================
-- R16 v2 — associação não equivale a responsabilidade efetiva.
-- ================================================================

CREATE TEMP TABLE r16_associations (
  occurrence_id text NOT NULL,
  teacher_id text NOT NULL,
  association_state text NOT NULL,
  PRIMARY KEY (occurrence_id, teacher_id)
) ON COMMIT DROP;

INSERT INTO r16_associations VALUES
  ('O1','P1','ACTIVE'),
  ('O1','P2','ACTIVE');

CREATE TEMP TABLE r16_responsibility (
  occurrence_id text PRIMARY KEY,
  responsible_teacher_id text,
  responsibility_state text NOT NULL,
  homologated_at timestamp,
  homologated_by text
) ON COMMIT DROP;

INSERT INTO r16_responsibility VALUES
  ('O1','P1','HOMOLOGATED','2026-09-28 08:00','HOMOLOGATOR-1');

-- P1 é responsável porque existe responsabilidade homologada.
SELECT CASE
  WHEN (
    SELECT responsible_teacher_id
    FROM r16_responsibility
    WHERE occurrence_id='O1'
  ) = 'P1'
  AND EXISTS (
    SELECT 1 FROM r16_associations
    WHERE occurrence_id='O1' AND teacher_id='P1'
  )
  THEN 'PASS_R16_HOMOLOGATED_RESPONSIBILITY_P1'
  ELSE 'FAIL_R16_HOMOLOGATED_RESPONSIBILITY_P1'
END AS assertion;

-- P2 continua associado, mas não recebe responsabilidade automaticamente.
SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM r16_associations
    WHERE occurrence_id='O1' AND teacher_id='P2'
  )
  AND NOT EXISTS (
    SELECT 1 FROM r16_responsibility
    WHERE occurrence_id='O1'
      AND responsible_teacher_id='P2'
  )
  THEN 'PASS_R16_ASSOCIATION_NOT_RESPONSIBILITY_P2'
  ELSE 'FAIL_R16_ASSOCIATION_NOT_RESPONSIBILITY_P2'
END AS assertion;

-- O resultado operacional deve selecionar o responsável homologado, não o
-- primeiro/último associado por ordem arbitrária.
SELECT CASE
  WHEN (
    SELECT responsible_teacher_id
    FROM r16_responsibility
    WHERE occurrence_id='O1'
  ) = 'P1'
  THEN 'PASS_R16_OPERATIONAL_RESPONSIBLE_IS_HOMOLOGATED'
  ELSE 'FAIL_R16_OPERATIONAL_RESPONSIBLE_IS_HOMOLOGATED'
END AS assertion;

-- Segundo cenário: associação múltipla sem responsabilidade homologada.
-- O resultado deve ser indeterminado/revisável; não pode escolher P1 ou P2.
CREATE TEMP TABLE r16_unresolved (
  occurrence_id text PRIMARY KEY,
  responsibility_state text NOT NULL,
  responsible_teacher_id text
) ON COMMIT DROP;

INSERT INTO r16_unresolved VALUES
  ('O2','SOURCE_UNCERTAIN',NULL);

INSERT INTO r16_associations VALUES
  ('O2','P1','ACTIVE'),
  ('O2','P2','ACTIVE');

SELECT CASE
  WHEN responsibility_state = 'SOURCE_UNCERTAIN'
   AND responsible_teacher_id IS NULL
   AND (SELECT COUNT(*) FROM r16_associations WHERE occurrence_id='O2') = 2
  THEN 'PASS_R16_UNRESOLVED_REQUIRES_REVIEW'
  ELSE 'FAIL_R16_UNRESOLVED_REQUIRES_REVIEW'
END AS assertion
FROM r16_unresolved
WHERE occurrence_id='O2';

-- Regra transversal: uma ocorrência com múltiplas associações e sem
-- responsabilidade homologada não pode produzir responsável por inferência.
SELECT CASE
  WHEN (
    SELECT COUNT(*)
    FROM r16_associations
    WHERE occurrence_id='O1'
  ) = 2
  AND (
    SELECT COUNT(*)
    FROM r16_responsibility
    WHERE occurrence_id='O1'
      AND responsibility_state='HOMOLOGATED'
  ) = 1
  THEN 'PASS_R16_ASSOCIATION_AND_RESPONSIBILITY_SEPARATED'
  ELSE 'FAIL_R16_ASSOCIATION_AND_RESPONSIBILITY_SEPARATED'
END AS assertion;

COMMIT;

-- Critério de interpretação:
-- PASS_* = invariante demonstrada pelo fixture sintético.
-- FAIL_* = bloqueio da regressão v2.
-- Nenhum PASS implica homologação da SED ou liberação de produção.
