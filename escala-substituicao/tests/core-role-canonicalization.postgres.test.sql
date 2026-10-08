-- Core Role Canonicalization Harness v1
-- Isolated synthetic fixture. No production DDL/data.
-- Purpose: compare legacy membership roles with canonical identity roles
-- and verify product-permission resolution without implementing either strategy.

DROP TABLE IF EXISTS tmp_role_resolution;
DROP TABLE IF EXISTS tmp_product_permissions;
DROP TABLE IF EXISTS tmp_memberships;
DROP TABLE IF EXISTS tmp_roles;

CREATE TEMP TABLE tmp_roles (
  code text PRIMARY KEY,
  hierarchy_level integer NOT NULL
);

CREATE TEMP TABLE tmp_memberships (
  user_key text PRIMARY KEY,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'active'
);

CREATE TEMP TABLE tmp_product_permissions (
  product_code text NOT NULL,
  role_code text NOT NULL,
  can_access boolean NOT NULL,
  PRIMARY KEY (product_code, role_code)
);

CREATE TEMP TABLE tmp_role_resolution (
  legacy_role text PRIMARY KEY,
  canonical_role text NOT NULL
);

INSERT INTO tmp_roles(code, hierarchy_level) VALUES
 ('teacher',10),
 ('coordinator',30),
 ('vice_principal',40),
 ('principal',50),
 ('supervisor',60),
 ('regional_manager',70),
 ('institution_admin',80),
 ('platform_admin',90),
 ('super_admin',100);

INSERT INTO tmp_memberships(user_key, role) VALUES
 ('u_teacher','professor'),
 ('u_coord','coordenador'),
 ('u_principal','diretor'),
 ('u_admin','administrador');

INSERT INTO tmp_product_permissions(product_code, role_code, can_access) VALUES
 ('agenda_edi','teacher',true),
 ('agenda_edi','coordinator',true),
 ('agenda_edi','vice_principal',true),
 ('agenda_edi','principal',true),
 ('agenda_edi','supervisor',true),
 ('agenda_edi','regional_manager',true),
 ('agenda_edi','institution_admin',true);

INSERT INTO tmp_role_resolution VALUES
 ('professor','teacher'),
 ('coordenador','coordinator'),
 ('diretor','principal'),
 ('administrador','institution_admin');

-- H01: every legacy membership role has exactly one canonical resolution.
DO $$
DECLARE c integer;
BEGIN
  SELECT count(*) INTO c
  FROM tmp_memberships m
  LEFT JOIN tmp_role_resolution r ON r.legacy_role=m.role
  WHERE r.canonical_role IS NULL;
  IF c <> 0 THEN RAISE EXCEPTION 'FAIL_H01_UNRESOLVED_LEGACY_ROLE'; END IF;
END $$;

-- H02: every resolved canonical role exists in canonical catalog.
DO $$
DECLARE c integer;
BEGIN
  SELECT count(*) INTO c
  FROM tmp_role_resolution r
  LEFT JOIN tmp_roles cr ON cr.code=r.canonical_role
  WHERE cr.code IS NULL;
  IF c <> 0 THEN RAISE EXCEPTION 'FAIL_H02_UNKNOWN_CANONICAL_ROLE'; END IF;
END $$;

-- H03: product permission lookup through canonical resolution grants teacher.
DO $$
DECLARE ok boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM tmp_memberships m
    JOIN tmp_role_resolution r ON r.legacy_role=m.role
    JOIN tmp_product_permissions p ON p.role_code=r.canonical_role
    WHERE m.user_key='u_teacher'
      AND p.product_code='agenda_edi'
      AND p.can_access
  ) INTO ok;
  IF NOT ok THEN RAISE EXCEPTION 'FAIL_H03_TEACHER_ACCESS'; END IF;
END $$;

-- H04: coordinator resolves only to coordinator, never teacher/principal.
DO $$
DECLARE c integer;
BEGIN
  SELECT count(*) INTO c
  FROM tmp_memberships m
  JOIN tmp_role_resolution r ON r.legacy_role=m.role
  WHERE m.user_key='u_coord' AND r.canonical_role='coordinator';
  IF c <> 1 THEN RAISE EXCEPTION 'FAIL_H04_COORDINATOR_RESOLUTION'; END IF;
END $$;

-- H05: director resolves to principal.
DO $$
DECLARE c integer;
BEGIN
  SELECT count(*) INTO c
  FROM tmp_memberships m
  JOIN tmp_role_resolution r ON r.legacy_role=m.role
  WHERE m.user_key='u_principal' AND r.canonical_role='principal';
  IF c <> 1 THEN RAISE EXCEPTION 'FAIL_H05_PRINCIPAL_RESOLUTION'; END IF;
END $$;

-- H06: administrator resolves to institution_admin, not platform_admin.
DO $$
DECLARE c integer;
BEGIN
  SELECT count(*) INTO c
  FROM tmp_memberships m
  JOIN tmp_role_resolution r ON r.legacy_role=m.role
  WHERE m.user_key='u_admin' AND r.canonical_role='institution_admin';
  IF c <> 1 THEN RAISE EXCEPTION 'FAIL_H06_ADMIN_RESOLUTION'; END IF;
END $$;

-- H07: canonical roles with no legacy equivalent remain representable.
DO $$
DECLARE c integer;
BEGIN
  SELECT count(*) INTO c
  FROM tmp_roles r
  WHERE r.code IN ('vice_principal','supervisor','regional_manager','platform_admin','super_admin');
  IF c <> 5 THEN RAISE EXCEPTION 'FAIL_H07_CANONICAL_ROLE_CATALOG'; END IF;
END $$;

-- H08: inactive membership must not produce product access.
UPDATE tmp_memberships SET status='suspended' WHERE user_key='u_teacher';

DO $$
DECLARE ok boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM tmp_memberships m
    JOIN tmp_role_resolution r ON r.legacy_role=m.role
    JOIN tmp_product_permissions p ON p.role_code=r.canonical_role
    WHERE m.user_key='u_teacher'
      AND m.status='active'
      AND p.product_code='agenda_edi'
      AND p.can_access
  ) INTO ok;
  IF ok THEN RAISE EXCEPTION 'FAIL_H08_INACTIVE_MEMBERSHIP_ACCESS'; END IF;
END $$;

-- H09: unknown legacy role fails closed.
INSERT INTO tmp_memberships(user_key, role) VALUES ('u_unknown','legacy_unknown');

DO $$
DECLARE ok boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM tmp_memberships m
    JOIN tmp_role_resolution r ON r.legacy_role=m.role
    WHERE m.user_key='u_unknown'
  ) INTO ok;
  IF ok THEN RAISE EXCEPTION 'FAIL_H09_UNKNOWN_ROLE_NOT_FAIL_CLOSED'; END IF;
END $$;

-- H10: canonical product permission does not imply a legacy membership
-- without a valid canonical resolution.
DO $$
DECLARE ok boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM tmp_memberships m
    JOIN tmp_product_permissions p ON p.role_code=m.role
    WHERE m.user_key='u_teacher'
      AND p.product_code='agenda_edi'
      AND p.can_access
  ) INTO ok;
  IF ok THEN RAISE EXCEPTION 'FAIL_H10_DIRECT_LEGACY_CANONICAL_JOIN'; END IF;
END $$;

SELECT 'PASS_CORE_ROLE_CANONICALIZATION_H01_H10' AS result;
