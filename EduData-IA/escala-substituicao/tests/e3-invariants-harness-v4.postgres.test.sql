-- E3 Invariantes H01-H22 v4
-- PostgreSQL real / fixture sintética.
-- Nenhum identificador representa ID real da SED.
-- v4 adiciona testes explícitos dos limites de vigência:
-- início e fim inclusivos de Associação/Grade e ocorrência posterior ao calendário/grade.

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
  substitution_effective_date date,
  di_context_count integer,
  inference_attempted boolean,
  association_context_key text,
  association_context_count integer,
  expected_state text
);

INSERT INTO e3_harness_responsibility VALUES
('E3-H01','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,null,1,false,'CTX-A',1,'RESOLVED'),
('E3-H02','DI-A','DI-B','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,null,1,false,'CTX-A',1,'SOURCE_UNCERTAIN'),
('E3-H03',null,'DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,null,1,false,'CTX-A',1,'UNRESOLVED'),
('E3-H04','DI-A','DI-A',null,'T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,null,1,false,'CTX-A',1,'BLOCKED'),
('E3-H05','DI-A','DI-A','SCHOOL-B','T-A','ASS-B','GRADE-B','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,null,1,false,'CTX-B',1,'RESOLVED'),
('E3-H06','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-06-30','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,null,1,false,'CTX-A',1,'BLOCKED'),
('E3-H07','DI-A','DI-A','SCHOOL-A','T-A','ASS-A',null,'2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,null,1,false,'CTX-A',1,'BLOCKED'),
('E3-H08','DI-A','DI-A','SCHOOL-A','T-A',null,'GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,null,1,false,'CTX-A',1,'BLOCKED'),
('E3-H09',null,null,'SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,null,1,true,'CTX-A',1,'BLOCKED'),
('E3-H10','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,'T-B','2026-08-21',1,false,'CTX-A',1,'RESOLVED'),
('E3-H11','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,true,true,null,null,1,false,'CTX-A',1,'BLOCKED'),
('E3-H12','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',false,false,true,null,null,1,false,'CTX-A',1,'BLOCKED'),
('E3-H13','DI-A','DI-B','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,null,2,false,'CTX-A',1,'SOURCE_UNCERTAIN'),
('E3-H14','DI-A','DI-A','SCHOOL-C','T-A','ASS-C','GRADE-C','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,null,1,false,'CTX-C',1,'RESOLVED'),
('E3-H15','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-06-30','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,null,1,false,'CTX-A',1,'BLOCKED'),
('E3-H16','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-06-30','2026-08-20',true,false,true,null,null,1,false,'CTX-A',1,'BLOCKED'),
('E3-H17','DI-A','DI-A','SCHOOL-A','T-A','ASS-B','GRADE-B','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,true,null,null,1,false,'CTX-A',2,'SOURCE_UNCERTAIN'),
('E3-H18','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-08-20',true,false,false,null,null,1,false,'CTX-A',1,'BLOCKED'),
('E3-H19','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-02-02',true,false,true,null,null,1,false,'CTX-A',1,'RESOLVED'),
('E3-H20','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-12-18',true,false,true,null,null,1,false,'CTX-A',1,'RESOLVED'),
('E3-H21','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-02','2026-12-18','2026-12-19',true,false,true,null,null,1,false,'CTX-A',1,'BLOCKED'),
('E3-H22','DI-A','DI-A','SCHOOL-A','T-A','ASS-A','GRADE-A','2026-02-02','2026-12-18','2026-02-03','2026-12-18','2026-02-02',true,false,true,null,null,1,false,'CTX-A',1,'BLOCKED');

WITH evaluated AS (
  SELECT h.case_id,
    CASE
      WHEN NOT h.occurrence_homologated THEN 'BLOCKED'
      WHEN h.school_id IS NULL THEN 'BLOCKED'
      WHEN NOT h.provenance_ok THEN 'BLOCKED'
      WHEN h.concurrency_unresolved THEN 'BLOCKED'
      WHEN h.inference_attempted THEN 'BLOCKED'
      WHEN h.di_context_count IS NULL OR h.di_context_count < 1 THEN 'UNRESOLVED'
      WHEN h.di_context_count > 1 THEN 'SOURCE_UNCERTAIN'
      WHEN h.association_context_count IS NULL OR h.association_context_count < 1 THEN 'BLOCKED'
      WHEN h.association_context_count > 1 THEN 'SOURCE_UNCERTAIN'
      WHEN h.di_active IS NULL OR h.di_assignment IS NULL THEN 'UNRESOLVED'
      WHEN h.di_active <> h.di_assignment THEN 'SOURCE_UNCERTAIN'
      WHEN h.substitution_teacher_id IS NOT NULL
        AND h.substitution_teacher_id <> h.teacher_id
        AND (h.substitution_effective_date IS NULL OR h.substitution_effective_date <= h.occurrence_date)
        THEN 'BLOCKED'
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
SELECT case_id, observed_state, expected_state, observed_state = expected_state AS pass
FROM evaluated
ORDER BY case_id;
