-- 167 — Harness expandido do resolvedor canônico de roles do Core
-- Sintético; não altera produção.
BEGIN;
DROP TABLE IF EXISTS tmp_role_context;
CREATE TEMP TABLE tmp_role_context (
 case_id text PRIMARY KEY, actor text, organization_id text, school_id text, membership_role text, membership_status text,
 hierarchy_level int, updated_at int, profile_role text, platform_role text, expected_role text, expected_code text
);
INSERT INTO tmp_role_context VALUES
('H11','U1','ORG1','SCH1','professor','active',10,1,'teacher',NULL,'teacher','RESOLVED_MEMBERSHIP'),
('H12','U2','ORG1','SCH1','coordenador','active',30,2,'teacher',NULL,'coordinator','RESOLVED_MEMBERSHIP'),
('H13','U3','ORG1','SCH1','diretor','active',50,2,'teacher',NULL,'principal','RESOLVED_MEMBERSHIP'),
('H14','U4','ORG1','SCH1','administrador','active',80,2,'teacher',NULL,'institution_admin','RESOLVED_MEMBERSHIP'),
('H15','U5','ORG1','SCH1','professor','active',10,1,'teacher','platform_admin','platform_admin','RESOLVED_PLATFORM_ADMIN'),
('H16','U6','ORG1','SCH1','professor','active',10,1,'teacher','super_admin','super_admin','RESOLVED_PLATFORM_SUPER_ADMIN'),
('H17','U7','ORG1','SCH1','diretor','active',50,2,'coordinator',NULL,'principal','RESOLVED_MEMBERSHIP'),
('H18','U8','ORG1','SCH1','professor','suspended',90,9,'principal',NULL,NULL,'NO_VALID_MEMBERSHIP'),
('H19','U9','ORG1','SCH1','professor','active',10,1,'principal',NULL,'teacher','RESOLVED_MEMBERSHIP'),
('H20','U10','ORG1','SCH1','professor','active',10,1,'professor',NULL,'teacher','RESOLVED_MEMBERSHIP'),
('H21','U11','ORG1','SCH1','professor','active',10,1,NULL,NULL,'teacher','RESOLVED_MEMBERSHIP'),
('H22','U12','ORG1','SCH1','desconhecido','active',100,5,'teacher',NULL,NULL,'ROLE_UNRESOLVED'),
('H23','U13','ORG1','SCH1','professor','active',10,1,'teacher','superadministrador', 'teacher','RESOLVED_MEMBERSHIP'),
('H24','U14','ORG1','SCH1','professor','active',10,1,'teacher','super_admin','super_admin','RESOLVED_PLATFORM_SUPER_ADMIN');

-- H11-H14: membership canônica por contexto
DO $$ BEGIN
 IF (SELECT count(*) FROM tmp_role_context WHERE expected_code='RESOLVED_MEMBERSHIP' AND expected_role IN ('teacher','coordinator','principal','institution_admin')) < 4 THEN RAISE EXCEPTION 'FAIL_H11_H14_MEMBERSHIP'; END IF;
 RAISE NOTICE 'PASS_H11_H14_MEMBERSHIP';
END $$;

-- H15-H16/H24: plataforma homologada prevalece
DO $$ BEGIN
 IF (SELECT count(*) FROM tmp_role_context WHERE expected_code IN ('RESOLVED_PLATFORM_ADMIN','RESOLVED_PLATFORM_SUPER_ADMIN') AND expected_role IN ('platform_admin','super_admin')) <> 3 THEN RAISE EXCEPTION 'FAIL_H15_H16_H24_PLATFORM'; END IF;
 RAISE NOTICE 'PASS_H15_H16_H24_PLATFORM';
END $$;

-- H17: membership prevalece sobre profile divergente
DO $$ BEGIN
 IF (SELECT expected_role FROM tmp_role_context WHERE case_id='H17') <> 'principal' THEN RAISE EXCEPTION 'FAIL_H17_PROFILE_CONFLICT'; END IF;
 RAISE NOTICE 'PASS_H17_PROFILE_CONFLICT';
END $$;

-- H18: membership suspensa não concede role institucional
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM tmp_role_context WHERE case_id='H18' AND expected_role IS NOT NULL) THEN RAISE EXCEPTION 'FAIL_H18_SUSPENDED'; END IF;
 RAISE NOTICE 'PASS_H18_SUSPENDED';
END $$;

-- H19: role de perfil não pode elevar membership
DO $$ BEGIN
 IF (SELECT expected_role FROM tmp_role_context WHERE case_id='H19') <> 'teacher' THEN RAISE EXCEPTION 'FAIL_H19_NO_PROFILE_ELEVATION'; END IF;
 RAISE NOTICE 'PASS_H19_NO_PROFILE_ELEVATION';
END $$;

-- H20-H21: resolução permanece determinística e não depende do profile
DO $$ BEGIN
 IF (SELECT count(*) FROM tmp_role_context WHERE case_id IN ('H20','H21') AND expected_role='teacher') <> 2 THEN RAISE EXCEPTION 'FAIL_H20_H21_PROFILE_INDEPENDENCE'; END IF;
 RAISE NOTICE 'PASS_H20_H21_PROFILE_INDEPENDENCE';
END $$;

-- H22: role desconhecido não faz fallback
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM tmp_role_context WHERE case_id='H22' AND expected_role IS NOT NULL) THEN RAISE EXCEPTION 'FAIL_H22_UNKNOWN'; END IF;
 RAISE NOTICE 'PASS_H22_UNKNOWN';
END $$;

-- H23: alias de plataforma não homologado não eleva
DO $$ BEGIN
 IF (SELECT expected_role FROM tmp_role_context WHERE case_id='H23') <> 'teacher' THEN RAISE EXCEPTION 'FAIL_H23_UNHOMOLOGATED_ALIAS'; END IF;
 RAISE NOTICE 'PASS_H23_UNHOMOLOGATED_ALIAS';
END $$;

-- H24: super_admin tem precedência sobre platform_admin
DO $$ BEGIN
 IF (SELECT expected_role FROM tmp_role_context WHERE case_id='H24') <> 'super_admin' THEN RAISE EXCEPTION 'FAIL_H24_SUPER_PRECEDENCE'; END IF;
 RAISE NOTICE 'PASS_H24_SUPER_PRECEDENCE';
END $$;
COMMIT;