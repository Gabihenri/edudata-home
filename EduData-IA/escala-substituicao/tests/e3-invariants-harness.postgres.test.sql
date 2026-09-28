-- 128 — Harness E3 Invariantes H01-H18 v3
-- PostgreSQL isolado / fixture sintética.
-- Nenhum identificador abaixo representa ID real da SED.
-- v3 diferencia vigência de Associação (H15), vigência de Grade (H16)
-- e múltiplas associações no mesmo contexto (H17).

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
  association_valid_from date,
  association_valid_until date,
  grade_valid_from date,
  grade_valid_until date,
  occurrence_date date,
  provenance_ok boolean,
  concurrency_unresolved boolean,
  occurrence_homologated boolean,
  substitution_teacher_id text,
  inference_attempted boolean,
  association_context_key text,
  expected_state text
);

CREATE TEMP TABLE e3_harness_result (
  case_id text PRIMARY KEY,
  observed_state text,
  expected_state text,
  pass boolean
);

INSERT INTO e3_harness_responsibility VALUES
('E3-H01','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,false,'CTX-A','RESOLVED'),
('E3-H02','DI-A','DI-B','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,false,'CTX-A','SOURCE_UNCERTAIN'),
('E3-H03',null,'DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,false,'CTX-A','UNRESOLVED'),
('E3-H04','DI-A','DI-A',null,'T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,false,'CTX-A','BLOCKED'),
('E3-H05','DI-A','DI-A','SCHOOL-B','T-A','ASS-B','GRADE-B','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,false,'CTX-B','RESOLVED'),
('E3-H06','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-06-30','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,false,'CTX-A','BLOCKED'),
('E3-H07','DI-A','DI-A','SCHOOL-A','T-A','ASS-A',null,'2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,false,'CTX-A','BLOCKED'),
('E3-H08','DI-A','DI-A','SCHOOL-A','T-A',null,'GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,false,'CTX-A','BLOCKED'),
('E3-H09',null,null,'SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,true,'CTX-A','BLOCKED'),
('E3-H10','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,'T-B',false,'CTX-A','RESOLVED'),
('E3-H11','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,true,true,null,false,'CTX-A','BLOCKED'),
('E3-H12','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',false,false,true,null,false,'CTX-A','BLOCKED'),
('E3-H13','DI-A','DI-B','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,false,'CTX-A','SOURCE_UNCERTAIN'),
('E3-H14','DI-A','DI-A','SCHOOL-C','T-A','ASS-C','GRADE-C','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,false,'CTX-C','RESOLVED'),
('E3-H15','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-06-30','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,false,'CTX-A','BLOCKED'),
('E3-H16','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-06-30','2026-08-20',true,false,true,null,false,'CTX-A','BLOCKED'),
('E3-H17','DI-A','DI-A','SCHOOL-A','T-A','ASS-B','GRADE-B','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,false,'CTX-B','RESOLVED'),
('E3-H18','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,false,null,false,'CTX-A','BLOCKED');

WITH duplicate_contexts AS (
  SELECT association_context_key
  FROM e3_harness_responsibility
  GROUP BY association_context_key
  HAVING count(DISTINCT association_id) > 1
),
evaluated AS (
  SELECT h.case_id,
    CASE
      WHEN h.occurrence_homologated = false THEN 'BLOCKED'
      WHEN h.school_id IS NULL THEN 'BLOCKED'
      WHEN h.provenance_ok = false THEN 'BLOCKED'
      WHEN h.concurrency_unresolved THEN 'BLOCKED'
      WHEN h.inference_attempted THEN 'BLOCKED'
      WHEN h.di_active IS NULL OR h.di_assignment IS NULL THEN 'UNRESOLVED'
      WHEN h.di_active <> h.di_assignment THEN 'SOURCE_UNCERTAIN'
      WHEN h.association_id IS NULL THEN 'BLOCKED'
      WHEN h.grade_id IS NULL THEN 'BLOCKED'
      WHEN h.occurrence_date < h.association_valid_from
        OR h.occurrence_date > h.association_valid_until THEN 'BLOCKED'
      WHEN h.occurrence_date < h.grade_valid_from
        OR h.occurrence_date > h.grade_valid_until THEN 'BLOCKED'
      ELSE 'RESOLVED'
    END AS observed_state,
    h.expected_state
  FROM e3_harness_responsibility h
)
INSERT INTO e3_harness_result
SELECT case_id, observed_state, expected_state, observed_state = expected_state
FROM evaluated;

SELECT 'E3_HARNESS_CASE_COUNT' AS metric, count(*)::text AS value FROM e3_harness_result
UNION ALL
SELECT 'E3_HARNESS_PASS_COUNT', count(*)::text FROM e3_harness_result WHERE pass
UNION ALL
SELECT 'E3_HARNESS_FAIL_COUNT', count(*)::text FROM e3_harness_result WHERE NOT pass;

SELECT case_id, observed_state, expected_state, pass
FROM e3_harness_result
ORDER BY case_id;
