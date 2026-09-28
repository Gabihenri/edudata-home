-- 128 — Harness E3 Invariantes H01-H18 v1
-- Ambiente: PostgreSQL isolado / fixture sintética
-- Nenhum identificador abaixo representa ID real da SED.
-- Objetivo: verificar o contrato E3-I01..E3-I12 sem tocar no modelo produtivo.

DROP TABLE IF EXISTS e3_harness_result;
DROP TABLE IF EXISTS e3_harness_responsibility;

CREATE TEMP TABLE e3_harness_responsibility (
  case_id text PRIMARY KEY,
  di_active text,
  di_assignment text,
  school_id text,
  teacher_id text,
  association_id text,
  grade_id text,
  valid_from date,
  valid_until date,
  occurrence_date date,
  provenance_ok boolean,
  concurrency_unresolved boolean,
  occurrence_homologated boolean,
  substitution_teacher_id text,
  expected_state text
);

CREATE TEMP TABLE e3_harness_result (
  case_id text PRIMARY KEY,
  observed_state text,
  expected_state text,
  pass boolean
);

INSERT INTO e3_harness_responsibility VALUES
('E3-H01','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,'RESOLVED'),
('E3-H02','DI-A','DI-B','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,'SOURCE_UNCERTAIN'),
('E3-H03',null,'DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,'UNRESOLVED'),
('E3-H04','DI-A','DI-A',null,'T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,'BLOCKED'),
('E3-H05','DI-A','DI-A','SCHOOL-B','T-A','ASS-B','GRADE-B','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,'RESOLVED'),
('E3-H06','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-06-30','2026-08-20',true,false,true,null,'BLOCKED'),
('E3-H07','DI-A','DI-A','SCHOOL-A','T-A','ASS-A',null,'2026-02-02','2026-12-18','2026-08-20',true,false,true,null,'BLOCKED'),
('E3-H08','DI-A','DI-A','SCHOOL-A','T-A',null,'GRADE-A','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,'BLOCKED'),
('E3-H09',null,null,'SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,'BLOCKED'),
('E3-H10','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-08-20',true,false,true,'T-B','RESOLVED'),
('E3-H11','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-08-20',true,true,true,null,'BLOCKED'),
('E3-H12','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-08-20',false,false,true,null,'BLOCKED'),
('E3-H13','DI-A','DI-B','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,'SOURCE_UNCERTAIN'),
('E3-H14','DI-A','DI-A','SCHOOL-C','T-A','ASS-C','GRADE-C','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,'RESOLVED'),
('E3-H15','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-06-30','2026-08-20',true,false,true,null,'BLOCKED'),
('E3-H16','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-06-30','2026-08-20',true,false,true,null,'BLOCKED'),
('E3-H17','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,'RESOLVED'),
('E3-H18','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-08-20',true,false,false,null,'BLOCKED');

INSERT INTO e3_harness_result
SELECT
  case_id,
  CASE
    WHEN occurrence_homologated = false THEN 'BLOCKED'
    WHEN school_id IS NULL THEN 'BLOCKED'
    WHEN provenance_ok = false THEN 'BLOCKED'
    WHEN concurrency_unresolved THEN 'BLOCKED'
    WHEN di_active IS NULL OR di_assignment IS NULL THEN 'UNRESOLVED'
    WHEN di_active <> di_assignment THEN 'SOURCE_UNCERTAIN'
    WHEN association_id IS NULL THEN 'BLOCKED'
    WHEN grade_id IS NULL THEN 'BLOCKED'
    WHEN occurrence_date < valid_from OR occurrence_date > valid_until THEN 'BLOCKED'
    ELSE 'RESOLVED'
  END AS observed_state,
  expected_state,
  (
    CASE
      WHEN occurrence_homologated = false THEN 'BLOCKED'
      WHEN school_id IS NULL THEN 'BLOCKED'
      WHEN provenance_ok = false THEN 'BLOCKED'
      WHEN concurrency_unresolved THEN 'BLOCKED'
      WHEN di_active IS NULL OR di_assignment IS NULL THEN 'UNRESOLVED'
      WHEN di_active <> di_assignment THEN 'SOURCE_UNCERTAIN'
      WHEN association_id IS NULL THEN 'BLOCKED'
      WHEN grade_id IS NULL THEN 'BLOCKED'
      WHEN occurrence_date < valid_from OR occurrence_date > valid_until THEN 'BLOCKED'
      ELSE 'RESOLVED'
    END
  ) = expected_state AS pass
FROM e3_harness_responsibility;

SELECT 'E3_HARNESS_CASE_COUNT' AS metric, count(*)::text AS value
FROM e3_harness_result
UNION ALL
SELECT 'E3_HARNESS_PASS_COUNT', count(*)::text
FROM e3_harness_result WHERE pass
UNION ALL
SELECT 'E3_HARNESS_FAIL_COUNT', count(*)::text
FROM e3_harness_result WHERE NOT pass;

SELECT case_id, observed_state, expected_state, pass
FROM e3_harness_result
ORDER BY case_id;
