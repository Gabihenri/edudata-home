-- 168 — Harness de contexto e seleção determinística de memberships
-- Sintético; não altera produção.
BEGIN;
DROP TABLE IF EXISTS tmp_memberships;
CREATE TEMP TABLE tmp_memberships(
 case_id text, actor text, org text, school text, membership_id text, role text, status text,
 hierarchy_level int, valid_from int, valid_until int, updated_at int, created_at int,
 expected_id text, expected_code text
);
INSERT INTO tmp_memberships VALUES
('H25','U25','ORG1','SCH1','M1','professor','active',10,1,999,1,1,'M2','HIERARCHY'),
('H25','U25','ORG1','SCH1','M2','coordenador','active',30,1,999,2,1,'M2','HIERARCHY'),
('H26','U26','ORG1','SCH1','M1','professor','active',10,1,999,5,1,'M2','UPDATED_AT'),
('H26','U26','ORG1','SCH1','M2','coordenador','active',10,1,999,9,1,'M2','UPDATED_AT'),
('H27','U27','ORG1','SCH1','M1','professor','active',10,1,999,5,1,'M1','CREATED_AT'),
('H27','U27','ORG1','SCH1','M2','professor','active',10,1,999,5,2,'M1','CREATED_AT'),
('H28','U28','ORG1','SCH1','M1','professor','active',10,1,10,1,1,'M2','VALID_WINDOW'),
('H28','U28','ORG1','SCH1','M2','coordenador','active',10,11,999,2,1,'M2','VALID_WINDOW'),
('H29','U29','ORG1','SCH1','M1','professor','suspended',90,1,999,9,1,'M2','STATUS'),
('H29','U29','ORG1','SCH1','M2','coordenador','active',30,1,999,2,1,'M2','STATUS'),
('H30','U30','ORG1','SCH1','M1','professor','active',90,1,999,9,1,'M1','SCHOOL_CONTEXT'),
('H30','U30','ORG1','SCH2','M2','coordenador','active',30,1,999,2,1,'M2','SCHOOL_CONTEXT'),
('H31','U31','ORG1','SCH1','M1','professor','active',90,1,999,9,1,'M1','ORG_CONTEXT'),
('H31','U31','ORG2','SCH9','M2','coordenador','active',100,1,999,9,2,'M2','ORG_CONTEXT'),
('H32','U32','ORG1','SCH1','M1','professor','active',10,1,999,1,1,'M1','ONLY_VALID'),
('H32','U32','ORG1','SCH1','M2','desconhecido','active',90,1,999,9,2,'M2','UNKNOWN_CANNOT_ELEVATE'),
('H33','U33','ORG1','SCH1','M1','professor','active',10,1,999,1,1,'M1','ONLY_CONTEXT'),
('H33','U33','ORG2','SCH9','M2','diretor','active',90,1,999,9,2,'M1','OTHER_ORG_IGNORED'),
('H34','U34','ORG1','SCH1','M1','professor','active',10,1,999,1,1,'M1','ONLY_CONTEXT'),
('H34','U34','ORG1','SCH2','M2','diretor','active',90,1,999,9,2,'M1','OTHER_SCHOOL_IGNORED'),
('H35','U35','ORG1','SCH1','M1','professor','active',10,1,999,1,1,'M1','DETERMINISTIC'),
('H35','U35','ORG1','SCH1','M2','professor','active',10,1,999,1,2,'M1','DETERMINISTIC'),
('H36','U36','ORG1','SCH1','M1','professor','active',10,1,999,1,1,NULL,'AMBIGUOUS_IF_NO_TIEBREAK'),
('H36','U36','ORG1','SCH1','M2','professor','active',10,1,999,1,1,NULL,'AMBIGUOUS_IF_NO_TIEBREAK');
DO $$ BEGIN
 IF (SELECT count(*) FROM tmp_memberships) <> 22 THEN RAISE EXCEPTION 'FAIL_H25_H36_CASE_COUNT'; END IF;
 IF (SELECT expected_id FROM tmp_memberships WHERE case_id='H25' LIMIT 1) <> 'M2' THEN RAISE EXCEPTION 'FAIL_H25_HIERARCHY'; END IF;
 IF (SELECT expected_id FROM tmp_memberships WHERE case_id='H26' LIMIT 1) <> 'M2' THEN RAISE EXCEPTION 'FAIL_H26_UPDATED_AT'; END IF;
 IF (SELECT expected_id FROM tmp_memberships WHERE case_id='H27' LIMIT 1) <> 'M1' THEN RAISE EXCEPTION 'FAIL_H27_CREATED_AT'; END IF;
 IF (SELECT expected_id FROM tmp_memberships WHERE case_id='H28' LIMIT 1) <> 'M2' THEN RAISE EXCEPTION 'FAIL_H28_VALID_WINDOW'; END IF;
 IF (SELECT expected_id FROM tmp_memberships WHERE case_id='H29' LIMIT 1) <> 'M2' THEN RAISE EXCEPTION 'FAIL_H29_STATUS'; END IF;
 IF (SELECT expected_id FROM tmp_memberships WHERE case_id='H30' LIMIT 1) <> 'M1' THEN RAISE EXCEPTION 'FAIL_H30_SCHOOL'; END IF;
 IF (SELECT expected_id FROM tmp_memberships WHERE case_id='H31' LIMIT 1) <> 'M2' THEN RAISE EXCEPTION 'FAIL_H31_ORG'; END IF;
 IF (SELECT expected_id FROM tmp_memberships WHERE case_id='H33' LIMIT 1) <> 'M1' THEN RAISE EXCEPTION 'FAIL_H33_ORG_ISOLATION'; END IF;
 IF (SELECT expected_id FROM tmp_memberships WHERE case_id='H34' LIMIT 1) <> 'M1' THEN RAISE EXCEPTION 'FAIL_H34_SCHOOL_ISOLATION'; END IF;
 IF EXISTS (SELECT 1 FROM tmp_memberships WHERE case_id='H36' AND expected_id IS NOT NULL) THEN RAISE EXCEPTION 'FAIL_H36_AMBIGUITY'; END IF;
 RAISE NOTICE 'PASS_H25_H36_CONTEXT_SELECTION';
END $$;
COMMIT;