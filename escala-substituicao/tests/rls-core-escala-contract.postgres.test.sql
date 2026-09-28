-- Escala Inteligente EDI — contrato RLS do Core
-- STATUS: SYNTHETIC / CONTRACT HARNESS
-- GATE-FONTE-SED: RED/BLOCKED
--
-- Não altera políticas reais.
-- Define somente invariantes que a futura RLS da Escala deverá provar.

BEGIN;

CREATE TEMP TABLE rls_contract (
  case_id text PRIMARY KEY,
  subject text NOT NULL,
  expected_result text NOT NULL
) ON COMMIT DROP;

INSERT INTO rls_contract VALUES
('RLS-01','teacher_profiles sem escopo do ator',
 'DENY'),
('RLS-02','teacher_profiles no mesmo contexto escolar autorizado',
 'ALLOW'),
('RLS-03','teacher_profiles de outra escola',
 'DENY'),
('RLS-04','teacher_profiles de outra organização',
 'DENY'),
('RLS-05','identity_audit_logs para ator sem can_audit',
 'DENY'),
('RLS-06','identity_audit_logs para ator com can_audit e escopo',
 'ALLOW'),
('RLS-07','identity_product_permissions não concede operação sozinho',
 'DENY'),
('RLS-08','metadata_role contradiz Core',
 'CORE_WINS'),
('RLS-09','membership inativo',
 'DENY'),
('RLS-10','scope expirado/revogado',
 'DENY');

CREATE TEMP TABLE rls_fixture (
  user_id text,
  organization_id text,
  school_id text,
  role_code text,
  active boolean,
  can_audit boolean,
  scope_active boolean
) ON COMMIT DROP;

INSERT INTO rls_fixture VALUES
('U_TEACHER','ORG_A','SCHOOL_A','teacher',true,false,true),
('U_COORD','ORG_A','SCHOOL_A','coordinator',true,true,true),
('U_OTHER','ORG_B','SCHOOL_B','principal',true,true,true),
('U_EXPIRED','ORG_A','SCHOOL_A','coordinator',true,true,false),
('U_INACTIVE','ORG_A','SCHOOL_A','coordinator',false,true,true);

-- RLS-01 / RLS-02: a policy futura não deve ser "authenticated = all".
SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM rls_fixture
    WHERE user_id='U_TEACHER'
      AND organization_id='ORG_A'
      AND school_id='SCHOOL_A'
      AND active=true
      AND scope_active=true
  )
  THEN 'PASS_RLS02_SAME_CONTEXT_CAN_BE_AUTHORIZED'
  ELSE 'FAIL_RLS02_SAME_CONTEXT_CAN_BE_AUTHORIZED'
END AS assertion;

SELECT CASE
  WHEN NOT EXISTS (
    SELECT 1 FROM rls_fixture
    WHERE user_id='U_TEACHER'
      AND organization_id='ORG_B'
      AND school_id='SCHOOL_B'
  )
  THEN 'PASS_RLS04_CROSS_ORG_DENIED'
  ELSE 'FAIL_RLS04_CROSS_ORG_DENIED'
END AS assertion;

-- RLS-05 / RLS-06: auditoria administrativa é diferente de catálogo.
SELECT CASE
  WHEN NOT EXISTS (
    SELECT 1 FROM rls_fixture
    WHERE user_id='U_TEACHER' AND can_audit=true
  )
  THEN 'PASS_RLS05_NON_AUDITOR_DENIED'
  ELSE 'FAIL_RLS05_NON_AUDITOR_DENIED'
END AS assertion;

SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM rls_fixture
    WHERE user_id='U_COORD'
      AND can_audit=true
      AND active=true
      AND scope_active=true
  )
  THEN 'PASS_RLS06_AUDITOR_CONTEXT_AVAILABLE'
  ELSE 'FAIL_RLS06_AUDITOR_CONTEXT_AVAILABLE'
END AS assertion;

-- RLS-07: ler catálogo não equivale a possuir produto/operação.
SELECT CASE
  WHEN 'identity_product_permissions' <> 'authorization_grant'
  THEN 'PASS_RLS07_PERMISSION_CATALOG_NOT_AUTHORIZATION'
  ELSE 'FAIL_RLS07_PERMISSION_CATALOG_NOT_AUTHORIZATION'
END AS assertion;

-- RLS-08: metadata nunca deve ser fonte da decisão.
SELECT CASE
  WHEN 'principal' <> (
    SELECT role_code FROM rls_fixture WHERE user_id='U_TEACHER'
  )
  THEN 'PASS_RLS08_CORE_ROLE_DIFFERS_FROM_METADATA'
  ELSE 'FAIL_RLS08_CORE_ROLE_DIFFERS_FROM_METADATA'
END AS assertion;

-- RLS-09 / RLS-10.
SELECT CASE
  WHEN NOT EXISTS (
    SELECT 1 FROM rls_fixture
    WHERE user_id='U_INACTIVE' AND active=true
  )
  THEN 'PASS_RLS09_INACTIVE_MEMBERSHIP_DENIED'
  ELSE 'FAIL_RLS09_INACTIVE_MEMBERSHIP_DENIED'
END AS assertion;

SELECT CASE
  WHEN NOT EXISTS (
    SELECT 1 FROM rls_fixture
    WHERE user_id='U_EXPIRED' AND scope_active=true
  )
  THEN 'PASS_RLS10_EXPIRED_SCOPE_DENIED'
  ELSE 'FAIL_RLS10_EXPIRED_SCOPE_DENIED'
END AS assertion;

SELECT CASE
  WHEN COUNT(*)=10
  THEN 'PASS_RLS_CONTRACT_COUNT_10'
  ELSE 'FAIL_RLS_CONTRACT_COUNT_10'
END AS assertion
FROM rls_contract;

COMMIT;

-- Critério:
-- PASS_* = contrato sintético.
-- FAIL_* = lacuna.
-- A RLS real continua RED até haver policy específica, testes com atores
-- reais/sintéticos e prova de cross-organization/cross-school.
-- Nenhuma policy produtiva é criada por este arquivo.
