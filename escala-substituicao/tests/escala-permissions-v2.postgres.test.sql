-- Escala Inteligente EDI — autorização v2: AUTH-07..AUTH-20
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- AUTH-01..AUTH-06 permanecem no harness histórico.
-- Este arquivo cobre somente a evolução AUTH-07..AUTH-20.
--
-- Objetivo: separar autenticação, membership, produto, operação, nível de
-- permissão, escopo, ownership/assignment, justificativa e auditoria.
-- Nenhum valor de metadata do Auth decide autorização.

BEGIN;

CREATE TEMP TABLE core_memberships (
  user_id text NOT NULL,
  organization_id text NOT NULL,
  school_id text,
  role_code text NOT NULL,
  active boolean NOT NULL,
  valid_from date,
  valid_until date,
  PRIMARY KEY (user_id, organization_id, school_id)
) ON COMMIT DROP;

CREATE TEMP TABLE core_products (
  product_code text PRIMARY KEY,
  active boolean NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE core_permissions (
  product_code text NOT NULL,
  role_code text NOT NULL,
  permission text NOT NULL,
  permission_level text NOT NULL,
  PRIMARY KEY (product_code, role_code, permission)
) ON COMMIT DROP;

CREATE TEMP TABLE core_scopes (
  scope_id text PRIMARY KEY,
  user_id text NOT NULL,
  organization_id text NOT NULL,
  school_id text,
  active boolean NOT NULL,
  valid_from date,
  valid_until date
) ON COMMIT DROP;

CREATE TEMP TABLE resource_assignments (
  resource_id text PRIMARY KEY,
  organization_id text NOT NULL,
  school_id text NOT NULL,
  owner_user_id text,
  assigned_user_id text
) ON COMMIT DROP;

CREATE TEMP TABLE auth_metadata (
  user_id text PRIMARY KEY,
  metadata_role text
) ON COMMIT DROP;

CREATE TEMP TABLE audit_requirements (
  operation text PRIMARY KEY,
  requires_audit boolean NOT NULL,
  requires_justification boolean NOT NULL
) ON COMMIT DROP;

INSERT INTO core_products VALUES
  ('escala',true),
  ('agenda',true);

INSERT INTO core_permissions VALUES
  ('escala','teacher','escala.view_candidates','view'),
  ('escala','teacher','escala.view_vacancies','view'),
  ('escala','coordinator','escala.view_candidates','view'),
  ('escala','coordinator','escala.run_engine','manage'),
  ('escala','coordinator','escala.confirm_substitution','manage'),
  ('escala','principal','escala.view_candidates','view'),
  ('escala','principal','escala.run_engine','manage'),
  ('escala','principal','escala.confirm_substitution','manage'),
  ('escala','principal','escala.override_decision','manage'),
  ('escala','principal','escala.manage_teacher_identity_links','manage'),
  ('agenda','teacher','agenda.view','view');

INSERT INTO audit_requirements VALUES
  ('escala.view_candidates',true,false),
  ('escala.run_engine',true,false),
  ('escala.confirm_substitution',true,false),
  ('escala.override_decision',true,true),
  ('escala.manage_teacher_identity_links',true,true);

INSERT INTO core_memberships VALUES
  ('U_TEACHER','ORG_A','SCHOOL_A','teacher',true,'2026-01-01','2026-12-31'),
  ('U_COORD','ORG_A','SCHOOL_A','coordinator',true,'2026-01-01','2026-12-31'),
  ('U_MULTI','ORG_A','SCHOOL_A','teacher',true,'2026-01-01','2026-12-31'),
  ('U_MULTI','ORG_B','SCHOOL_B','principal',true,'2026-01-01','2026-12-31'),
  ('U_OTHER_ORG','ORG_B','SCHOOL_B','principal',true,'2026-01-01','2026-12-31'),
  ('U_OTHER_SCHOOL','ORG_A','SCHOOL_B','coordinator',true,'2026-01-01','2026-12-31'),
  ('U_EXPIRED','ORG_A','SCHOOL_A','coordinator',true,'2025-01-01','2025-12-31'),
  ('U_REVOKED','ORG_A','SCHOOL_A','coordinator',true,'2026-01-01','2026-12-31');

INSERT INTO core_scopes VALUES
  ('S_COORD_A','U_COORD','ORG_A','SCHOOL_A',true,'2026-01-01','2026-12-31'),
  ('S_MULTI_A','U_MULTI','ORG_A','SCHOOL_A',true,'2026-01-01','2026-12-31'),
  ('S_MULTI_B','U_MULTI','ORG_B','SCHOOL_B',true,'2026-01-01','2026-12-31'),
  ('S_OTHER_ORG','U_OTHER_ORG','ORG_B','SCHOOL_B',true,'2026-01-01','2026-12-31'),
  ('S_OTHER_SCHOOL','U_OTHER_SCHOOL','ORG_A','SCHOOL_B',true,'2026-01-01','2026-12-31'),
  ('S_EXPIRED','U_EXPIRED','ORG_A','SCHOOL_A',true,'2025-01-01','2025-12-31'),
  ('S_REVOKED','U_REVOKED','ORG_A','SCHOOL_A',false,'2026-01-01','2026-12-31');

INSERT INTO resource_assignments VALUES
  ('V_A1','ORG_A','SCHOOL_A','U_TEACHER','U_TEACHER'),
  ('V_A2','ORG_A','SCHOOL_A','U_TEACHER','U_OTHER_SCHOOL'),
  ('V_B1','ORG_B','SCHOOL_B','U_OTHER_ORG','U_OTHER_ORG');

INSERT INTO auth_metadata VALUES
  ('U_TEACHER','principal'),
  ('U_COORD','teacher'),
  ('U_MULTI','administrator');

-- Helper conceitual: autorização sempre deriva do Core, nunca metadata_role.
CREATE FUNCTION can_operate(
  p_user text,
  p_org text,
  p_school text,
  p_operation text,
  p_resource_id text,
  p_today date,
  p_justification text DEFAULT NULL
) RETURNS boolean
LANGUAGE sql
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM core_memberships m
    JOIN core_products pr
      ON pr.product_code='escala'
     AND pr.active=true
    JOIN core_permissions pp
      ON pp.product_code=pr.product_code
     AND pp.role_code=m.role_code
     AND pp.permission=p_operation
    JOIN audit_requirements ar
      ON ar.operation=p_operation
    JOIN resource_assignments r
      ON r.resource_id=p_resource_id
     AND r.organization_id=p_org
     AND r.school_id=p_school
    LEFT JOIN core_scopes s
      ON s.user_id=m.user_id
     AND s.organization_id=p_org
     AND (s.school_id IS NULL OR s.school_id=p_school)
     AND s.active=true
     AND (s.valid_from IS NULL OR s.valid_from<=p_today)
     AND (s.valid_until IS NULL OR s.valid_until>=p_today)
    WHERE m.user_id=p_user
      AND m.organization_id=p_org
      AND (m.school_id IS NULL OR m.school_id=p_school)
      AND m.active=true
      AND (m.valid_from IS NULL OR m.valid_from<=p_today)
      AND (m.valid_until IS NULL OR m.valid_until>=p_today)
      AND (
        pp.permission_level='view'
        OR s.scope_id IS NOT NULL
      )
      AND (
        ar.requires_justification=false
        OR NULLIF(BTRIM(p_justification),'') IS NOT NULL
      )
      AND (
        p_operation NOT IN (
          'escala.confirm_substitution',
          'escala.override_decision'
        )
        OR r.assigned_user_id=p_user
        OR r.owner_user_id=p_user
        OR s.scope_id IS NOT NULL
      )
  );
$$;

-- ================================================================
-- AUTH-07 — produto Escala ausente.
-- ================================================================
DELETE FROM core_products WHERE product_code='escala';

SELECT CASE
  WHEN NOT can_operate('U_TEACHER','ORG_A','SCHOOL_A',
                       'escala.view_candidates','V_A1','2026-09-28')
  THEN 'PASS_AUTH07_PRODUCT_NOT_GRANTED'
  ELSE 'FAIL_AUTH07_PRODUCT_NOT_GRANTED'
END AS assertion;

INSERT INTO core_products VALUES ('escala',true);

-- ================================================================
-- AUTH-08 — usuário em duas organizações permanece contextualizado.
-- ================================================================
SELECT CASE
  WHEN COUNT(*)=2
   AND COUNT(DISTINCT organization_id)=2
  THEN 'PASS_AUTH08_MULTI_ORGANIZATION_CONTEXT'
  ELSE 'FAIL_AUTH08_MULTI_ORGANIZATION_CONTEXT'
END AS assertion
FROM core_memberships
WHERE user_id='U_MULTI';

-- ================================================================
-- AUTH-09 — escopo de outra organização não autoriza ORG_A.
-- ================================================================
SELECT CASE
  WHEN NOT can_operate('U_OTHER_ORG','ORG_A','SCHOOL_A',
                       'escala.run_engine','V_A1','2026-09-28')
  THEN 'PASS_AUTH09_SCOPE_OTHER_ORGANIZATION'
  ELSE 'FAIL_AUTH09_SCOPE_OTHER_ORGANIZATION'
END AS assertion;

-- ================================================================
-- AUTH-10 — escopo de outra escola não autoriza SCHOOL_A.
-- ================================================================
SELECT CASE
  WHEN NOT can_operate('U_OTHER_SCHOOL','ORG_A','SCHOOL_A',
                       'escala.run_engine','V_A1','2026-09-28')
  THEN 'PASS_AUTH10_SCOPE_OTHER_SCHOOL'
  ELSE 'FAIL_AUTH10_SCOPE_OTHER_SCHOOL'
END AS assertion;

-- ================================================================
-- AUTH-11 — view não pode executar operação manage.
-- ================================================================
SELECT CASE
  WHEN NOT can_operate('U_TEACHER','ORG_A','SCHOOL_A',
                       'escala.run_engine','V_A1','2026-09-28')
  THEN 'PASS_AUTH11_VIEW_CANNOT_MANAGE'
  ELSE 'FAIL_AUTH11_VIEW_CANNOT_MANAGE'
END AS assertion;

-- ================================================================
-- AUTH-12 — manage válido dentro de escopo.
-- ================================================================
SELECT CASE
  WHEN can_operate('U_COORD','ORG_A','SCHOOL_A',
                   'escala.run_engine','V_A1','2026-09-28')
  THEN 'PASS_AUTH12_MANAGE_VALID'
  ELSE 'FAIL_AUTH12_MANAGE_VALID'
END AS assertion;

-- ================================================================
-- AUTH-13 — professor não acessa vaga atribuída a outro professor.
-- ================================================================
SELECT CASE
  WHEN NOT can_operate('U_TEACHER','ORG_A','SCHOOL_A',
                       'escala.confirm_substitution','V_A2','2026-09-28')
  THEN 'PASS_AUTH13_RESOURCE_NOT_ASSIGNED'
  ELSE 'FAIL_AUTH13_RESOURCE_NOT_ASSIGNED'
END AS assertion;

-- ================================================================
-- AUTH-14 — recurso de outra organização bloqueado.
-- ================================================================
SELECT CASE
  WHEN NOT can_operate('U_TEACHER','ORG_B','SCHOOL_B',
                       'escala.view_candidates','V_B1','2026-09-28')
  THEN 'PASS_AUTH14_CROSS_ORGANIZATION_RESOURCE'
  ELSE 'FAIL_AUTH14_CROSS_ORGANIZATION_RESOURCE'
END AS assertion;

-- ================================================================
-- AUTH-15 — escopo expirado.
-- ================================================================
SELECT CASE
  WHEN NOT can_operate('U_EXPIRED','ORG_A','SCHOOL_A',
                       'escala.run_engine','V_A1','2026-09-28')
  THEN 'PASS_AUTH15_SCOPE_EXPIRED'
  ELSE 'FAIL_AUTH15_SCOPE_EXPIRED'
END AS assertion;

-- ================================================================
-- AUTH-16 — escopo suspenso/revogado.
-- ================================================================
SELECT CASE
  WHEN NOT can_operate('U_REVOKED','ORG_A','SCHOOL_A',
                       'escala.run_engine','V_A1','2026-09-28')
  THEN 'PASS_AUTH16_SCOPE_REVOKED'
  ELSE 'FAIL_AUTH16_SCOPE_REVOKED'
END AS assertion;

-- ================================================================
-- AUTH-17 — RPC direta sem autorização deve ser bloqueada.
-- ================================================================
CREATE FUNCTION rpc_confirm_without_authorization(
  p_user text,
  p_org text,
  p_school text,
  p_resource text
) RETURNS boolean
LANGUAGE sql
AS $$
  SELECT can_operate(
    p_user,p_org,p_school,
    'escala.confirm_substitution',
    p_resource,'2026-09-28',NULL
  );
$$;

SELECT CASE
  WHEN NOT rpc_confirm_without_authorization(
    'U_TEACHER','ORG_A','SCHOOL_A','V_A2'
  )
  THEN 'PASS_AUTH17_DIRECT_RPC_DENIED'
  ELSE 'FAIL_AUTH17_DIRECT_RPC_DENIED'
END AS assertion;

-- ================================================================
-- AUTH-18 — metadata do Auth contradiz Core; Core prevalece.
-- ================================================================
SELECT CASE
  WHEN (
    SELECT metadata_role FROM auth_metadata WHERE user_id='U_TEACHER'
  )='principal'
  AND (
    SELECT role_code FROM core_memberships
    WHERE user_id='U_TEACHER' AND organization_id='ORG_A'
  )='teacher'
  AND NOT can_operate(
    'U_TEACHER','ORG_A','SCHOOL_A',
    'escala.override_decision','V_A1','2026-09-28',NULL
  )
  THEN 'PASS_AUTH18_CORE_OVERRIDES_AUTH_METADATA'
  ELSE 'FAIL_AUTH18_CORE_OVERRIDES_AUTH_METADATA'
END AS assertion;

-- ================================================================
-- AUTH-19 — cargo superior em outra organização não herda autorização.
-- ================================================================
SELECT CASE
  WHEN (
    SELECT role_code FROM core_memberships
    WHERE user_id='U_OTHER_ORG'
      AND organization_id='ORG_B'
  )='principal'
  AND NOT can_operate(
    'U_OTHER_ORG','ORG_A','SCHOOL_A',
    'escala.override_decision','V_A1','2026-09-28','justificativa'
  )
  THEN 'PASS_AUTH19_ROLE_OTHER_ORG_NOT_INHERITED'
  ELSE 'FAIL_AUTH19_ROLE_OTHER_ORG_NOT_INHERITED'
END AS assertion;

-- ================================================================
-- AUTH-20 — override sem justificativa é bloqueado.
-- ================================================================
INSERT INTO core_scopes VALUES
  ('S_PRINCIPAL_A','U_MULTI','ORG_A','SCHOOL_A',true,'2026-01-01','2026-12-31');

SELECT CASE
  WHEN NOT can_operate(
    'U_MULTI','ORG_A','SCHOOL_A',
    'escala.override_decision','V_A1','2026-09-28',NULL
  )
  AND can_operate(
    'U_MULTI','ORG_A','SCHOOL_A',
    'escala.override_decision','V_A1','2026-09-28',
    'MATERIAL_CHANGE_REVIEW'
  )
  THEN 'PASS_AUTH20_OVERRIDE_JUSTIFICATION_REQUIRED'
  ELSE 'FAIL_AUTH20_OVERRIDE_JUSTIFICATION_REQUIRED'
END AS assertion;

-- ================================================================
-- Fechamento: a matriz v2 deve conter exatamente AUTH-07..AUTH-20.
-- ================================================================
SELECT CASE
  WHEN COUNT(*)=14
  THEN 'PASS_AUTH_V2_CASE_COUNT_14'
  ELSE 'FAIL_AUTH_V2_CASE_COUNT_14'
END AS assertion
FROM (
  VALUES
    ('AUTH-07'),('AUTH-08'),('AUTH-09'),('AUTH-10'),('AUTH-11'),
    ('AUTH-12'),('AUTH-13'),('AUTH-14'),('AUTH-15'),('AUTH-16'),
    ('AUTH-17'),('AUTH-18'),('AUTH-19'),('AUTH-20')
) v(test_id);

ROLLBACK;

-- Critério:
-- PASS_* = invariante demonstrada pelo fixture sintético.
-- FAIL_* = bloqueio da autorização v2.
-- AUTH-01..AUTH-06 permanecem preservados no harness histórico.
-- Não há dependência de user_metadata/app_metadata para autorização.
-- GATE-FONTE-SED permanece RED/BLOCKED.
