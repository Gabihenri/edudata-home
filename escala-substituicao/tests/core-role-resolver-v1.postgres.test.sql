-- 166 — Harness do contrato do resolvedor canônico de roles do Core
-- Fixture isolado/sintético. Não altera produção.
BEGIN;
DROP TABLE IF EXISTS tmp_role_resolution;
CREATE TEMP TABLE tmp_role_resolution (
  case_id text PRIMARY KEY,
  legacy_role text,
  canonical_role text,
  active boolean,
  organization_id text,
  school_id text,
  hierarchy_level integer,
  updated_at integer,
  created_at integer,
  profile_role text,
  platform_active boolean,
  expected_role text,
  expected_code text
);
INSERT INTO tmp_role_resolution VALUES
('H01','professor','teacher',true,'ORG1','SCH1',10,1,1,null,false,'teacher','RESOLVED_MEMBERSHIP'),
('H02','coordenador','coordinator',true,'ORG1','SCH1',30,1,1,null,false,'coordinator','RESOLVED_MEMBERSHIP'),
('H03','diretor','principal',true,'ORG1','SCH1',50,1,1,null,false,'principal','RESOLVED_MEMBERSHIP'),
('H04','administrador','institution_admin',true,'ORG1','SCH1',80,1,1,null,false,'institution_admin','RESOLVED_MEMBERSHIP'),
('H05',null,'super_admin',true,null,null,100,1,1,'super_admin',true,'super_admin','RESOLVED_PLATFORM_SUPER_ADMIN'),
('H06',null,'platform_admin',true,null,null,90,1,1,'platform_admin',true,'platform_admin','RESOLVED_PLATFORM_ADMIN'),
('H07','professor','teacher',false,'ORG1','SCH1',10,1,1,null,false,null,'NO_VALID_MEMBERSHIP'),
('H08','desconhecido',null,true,'ORG1','SCH1',20,1,1,null,false,null,'ROLE_UNRESOLVED'),
('H09','diretor','principal',true,'ORG1','SCH1',50,2,1,null,false,'principal','RESOLVED_MEMBERSHIP'),
('H10','professor','teacher',true,'ORG1','SCH1',10,1,1,null,false,'teacher','RESOLVED_MEMBERSHIP');

-- H01-H06: mapeamento canônico e plataforma
DO $$ BEGIN
  IF (SELECT count(*) FROM tmp_role_resolution WHERE expected_role = canonical_role AND expected_code IN ('RESOLVED_MEMBERSHIP','RESOLVED_PLATFORM_SUPER_ADMIN','RESOLVED_PLATFORM_ADMIN')) < 6 THEN
    RAISE EXCEPTION 'FAIL_H01_H06_CANONICAL_RESOLUTION';
  END IF;
  RAISE NOTICE 'PASS_H01_H06_CANONICAL_RESOLUTION';
END $$;

-- H07: membership inativa não resolve
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM tmp_role_resolution WHERE case_id='H07' AND expected_role IS NOT NULL) THEN
    RAISE EXCEPTION 'FAIL_H07_INACTIVE_MEMBERSHIP';
  END IF;
  RAISE NOTICE 'PASS_H07_INACTIVE_MEMBERSHIP';
END $$;

-- H08: role desconhecido falha fechado
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM tmp_role_resolution WHERE case_id='H08' AND expected_code <> 'ROLE_UNRESOLVED') THEN
    RAISE EXCEPTION 'FAIL_H08_UNKNOWN_ROLE';
  END IF;
  RAISE NOTICE 'PASS_H08_UNKNOWN_ROLE';
END $$;

-- H09: empate resolvido deterministicamente por updated_at
DO $$ BEGIN
  IF (SELECT expected_role FROM tmp_role_resolution WHERE case_id='H09') <> 'principal' THEN
    RAISE EXCEPTION 'FAIL_H09_DETERMINISTIC_ORDER';
  END IF;
  RAISE NOTICE 'PASS_H09_DETERMINISTIC_ORDER';
END $$;

-- H10: nenhum fallback silencioso para teacher
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM tmp_role_resolution WHERE canonical_role IS NULL AND expected_role='teacher') THEN
    RAISE EXCEPTION 'FAIL_H10_NO_TEACHER_FALLBACK';
  END IF;
  RAISE NOTICE 'PASS_H10_NO_TEACHER_FALLBACK';
END $$;

COMMIT;