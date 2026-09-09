-- Escala de Substituição — Harness de autorização
-- NÃO É MIGRAÇÃO DE PRODUÇÃO.
-- Valida o contrato 42 sem depender do catálogo real.

BEGIN;
DROP SCHEMA IF EXISTS escala_perm_test CASCADE;
CREATE SCHEMA escala_perm_test;
SET search_path = escala_perm_test, public;

CREATE TABLE roles (code text PRIMARY KEY);
CREATE TABLE memberships (
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  school_id uuid,
  role_code text NOT NULL REFERENCES roles(code),
  active boolean NOT NULL DEFAULT true,
  can_view_school boolean NOT NULL DEFAULT false,
  can_manage_users boolean NOT NULL DEFAULT false,
  can_audit boolean NOT NULL DEFAULT false
);
CREATE TABLE product_permissions (
  role_code text NOT NULL REFERENCES roles(code),
  permission text NOT NULL,
  PRIMARY KEY(role_code, permission)
);
CREATE TABLE responsibility_scopes (
  manager_user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  school_id uuid,
  active boolean NOT NULL DEFAULT true
);

INSERT INTO roles VALUES
 ('teacher'),('coordinator'),('vice_principal'),('principal'),('supervisor'),
 ('regional_manager'),('institution_admin');

-- Contrato mínimo da matriz.
INSERT INTO product_permissions VALUES
 ('teacher','escala.view_vacancies'),
 ('teacher','escala.view_candidates'),
 ('teacher','escala.view_explanations'),
 ('coordinator','escala.view_vacancies'),
 ('coordinator','escala.view_candidates'),
 ('coordinator','escala.view_explanations'),
 ('coordinator','escala.run_engine'),
 ('coordinator','escala.rerun_engine'),
 ('coordinator','escala.confirm_substitution'),
 ('coordinator','escala.view_audit'),
 ('vice_principal','escala.view_vacancies'),
 ('vice_principal','escala.view_candidates'),
 ('vice_principal','escala.view_explanations'),
 ('vice_principal','escala.run_engine'),
 ('vice_principal','escala.rerun_engine'),
 ('vice_principal','escala.confirm_substitution'),
 ('vice_principal','escala.override_decision'),
 ('vice_principal','escala.view_audit'),
 ('principal','escala.view_vacancies'),
 ('principal','escala.view_candidates'),
 ('principal','escala.view_explanations'),
 ('principal','escala.run_engine'),
 ('principal','escala.rerun_engine'),
 ('principal','escala.confirm_substitution'),
 ('principal','escala.override_decision'),
 ('principal','escala.manage_teacher_identity_links'),
 ('principal','escala.view_audit'),
 ('supervisor','escala.view_vacancies'),
 ('supervisor','escala.view_candidates'),
 ('supervisor','escala.view_explanations'),
 ('supervisor','escala.run_engine'),
 ('supervisor','escala.rerun_engine'),
 ('supervisor','escala.confirm_substitution'),
 ('supervisor','escala.override_decision'),
 ('supervisor','escala.view_audit'),
 ('supervisor','escala.manage_teacher_identity_links'),
 ('regional_manager','escala.view_vacancies'),
 ('regional_manager','escala.view_candidates'),
 ('regional_manager','escala.view_explanations'),
 ('regional_manager','escala.run_engine'),
 ('regional_manager','escala.rerun_engine'),
 ('regional_manager','escala.confirm_substitution'),
 ('regional_manager','escala.override_decision'),
 ('regional_manager','escala.view_audit'),
 ('regional_manager','escala.manage_teacher_identity_links'),
 ('institution_admin','escala.view_vacancies'),
 ('institution_admin','escala.view_candidates'),
 ('institution_admin','escala.view_explanations'),
 ('institution_admin','escala.run_engine'),
 ('institution_admin','escala.rerun_engine'),
 ('institution_admin','escala.confirm_substitution'),
 ('institution_admin','escala.override_decision'),
 ('institution_admin','escala.view_audit'),
 ('institution_admin','escala.manage_teacher_identity_links');

CREATE FUNCTION allowed(p_user uuid,p_org uuid,p_school uuid,p_permission text)
RETURNS boolean LANGUAGE sql AS $$
  SELECT EXISTS (
    SELECT 1
    FROM memberships m
    JOIN product_permissions pp ON pp.role_code=m.role_code AND pp.permission=p_permission
    LEFT JOIN responsibility_scopes rs
      ON rs.manager_user_id=m.user_id
     AND rs.organization_id=p_org
     AND (rs.school_id IS NULL OR rs.school_id=p_school)
     AND rs.active
    WHERE m.user_id=p_user
      AND m.organization_id=p_org
      AND m.active
      AND (m.school_id IS NULL OR m.school_id=p_school)
      AND (p_permission NOT IN ('escala.override_decision','escala.manage_teacher_identity_links') OR rs.manager_user_id IS NOT NULL)
  );
$$;

-- DOC-AUTH-01: professor pode consultar, não executar.
INSERT INTO memberships VALUES ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','teacher',true,false,false,false);
DO $$ BEGIN
 IF NOT allowed('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','escala.view_candidates') THEN RAISE EXCEPTION 'AUTH-01 failed'; END IF;
 IF allowed('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','escala.run_engine') THEN RAISE EXCEPTION 'AUTH-01b failed'; END IF;
END $$;

-- DOC-AUTH-02: coordenador executa dentro da escola com escopo.
INSERT INTO memberships VALUES ('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','coordinator',true,false,false,true);
INSERT INTO responsibility_scopes VALUES ('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',true);
DO $$ BEGIN
 IF NOT allowed('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','escala.run_engine') THEN RAISE EXCEPTION 'AUTH-02 failed'; END IF;
END $$;

-- DOC-AUTH-03: mesma pessoa sem escopo não pode override/homologar.
DELETE FROM responsibility_scopes WHERE manager_user_id='10000000-0000-0000-0000-000000000002';
DO $$ BEGIN
 IF allowed('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','escala.override_decision') THEN RAISE EXCEPTION 'AUTH-03 failed'; END IF;
 IF allowed('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','escala.manage_teacher_identity_links') THEN RAISE EXCEPTION 'AUTH-03b failed'; END IF;
END $$;

-- DOC-AUTH-04: escopo de escola não autoriza outra escola.
INSERT INTO responsibility_scopes VALUES ('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',true);
DO $$ BEGIN
 IF allowed('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','escala.manage_teacher_identity_links') THEN RAISE EXCEPTION 'AUTH-04 failed'; END IF;
END $$;

-- DOC-AUTH-05: conta inativa não pode operar.
UPDATE memberships SET active=false WHERE user_id='10000000-0000-0000-0000-000000000002';
DO $$ BEGIN
 IF allowed('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','escala.run_engine') THEN RAISE EXCEPTION 'AUTH-05 failed'; END IF;
END $$;

-- DOC-AUTH-06: ausência do produto/permissão deve negar por padrão.
DO $$ BEGIN
 IF allowed('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','escala.nonexistent_permission') THEN RAISE EXCEPTION 'AUTH-06 failed'; END IF;
END $$;

SELECT 'AUTH-01..AUTH-06 assertions completed' AS audit_result;
ROLLBACK;
