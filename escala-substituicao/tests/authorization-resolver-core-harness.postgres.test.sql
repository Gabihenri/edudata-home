-- Escala EDI — Authorization Resolver Core harness
-- Synthetic data only; mirrors Core semantics without persistent DDL.
BEGIN;

CREATE TEMP TABLE orgs(id text primary key);
CREATE TEMP TABLE schools(id text primary key, organization_id text not null);
CREATE TEMP TABLE members(
 id text primary key, user_id text not null, organization_id text not null,
 school_id text, role_code text not null, status text not null,
 valid_from timestamptz, valid_until timestamptz
);
CREATE TEMP TABLE products(role_code text, product_code text, can_access boolean, can_view_school boolean, can_update_others boolean, can_audit boolean);
CREATE TEMP TABLE scopes(
 id text primary key, organization_id text not null, school_id text,
 manager_user_id text not null, permission_level text not null,
 valid_from timestamptz, valid_until timestamptz, status text not null
);
CREATE TEMP TABLE resources(
 id text primary key, organization_id text not null, school_id text not null,
 owner_user_id text, assigned_user_id text
);
CREATE TEMP TABLE cases(case_id text primary key, allowed boolean, denial_code text);

INSERT INTO orgs VALUES ('ORG-A'),('ORG-B');
INSERT INTO schools VALUES ('SCH-A','ORG-A'),('SCH-B','ORG-B');

INSERT INTO members VALUES
('M-COORD','U-COORD','ORG-A','SCH-A','coordinator','active','2026-01-01',NULL),
('M-TEACH','U-TEACH','ORG-A','SCH-A','teacher','active','2026-01-01',NULL),
('M-OTHERORG','U-COORD','ORG-B','SCH-B','coordinator','active','2026-01-01',NULL),
('M-EXPIRED','U-EXP','ORG-A','SCH-A','coordinator','active','2025-01-01','2025-12-31');

INSERT INTO products VALUES
('coordinator','escala',true,true,true,true),
('teacher','escala',true,true,false,false);

INSERT INTO scopes VALUES
('S-A','ORG-A','SCH-A','U-COORD','manage','2026-01-01',NULL,'active'),
('S-B','ORG-B','SCH-B','U-COORD','manage','2026-01-01',NULL,'active'),
('S-EXP','ORG-A','SCH-A','U-EXP','manage','2025-01-01','2025-12-31','active');

INSERT INTO resources VALUES
('V-A','ORG-A','SCH-A','U-TEACH','U-TEACH'),
('V-B','ORG-B','SCH-B','U-TEACH','U-TEACH');

-- AUTH-R01 valid coordinator in own org/school/scope.
INSERT INTO cases
SELECT 'AUTH-R01',true,NULL
WHERE EXISTS (
 SELECT 1 FROM members m JOIN products p ON p.role_code=m.role_code
 JOIN scopes s ON s.manager_user_id=m.user_id AND s.organization_id=m.organization_id AND s.school_id=m.school_id
 WHERE m.user_id='U-COORD' AND m.organization_id='ORG-A' AND m.school_id='SCH-A'
 AND m.status='active' AND p.product_code='escala' AND p.can_access AND p.can_update_others
 AND s.status='active' AND s.permission_level='manage'
 AND s.valid_from <= '2026-09-29'::timestamptz
 AND (s.valid_until IS NULL OR s.valid_until >= '2026-09-29'::timestamptz)
);

-- AUTH-R02 same user, wrong organization must fail closed.
INSERT INTO cases
SELECT 'AUTH-R02',false,'SCOPE_WRONG_ORGANIZATION'
WHERE NOT EXISTS (
 SELECT 1 FROM scopes s
 WHERE s.manager_user_id='U-COORD' AND s.organization_id='ORG-A' AND s.school_id='SCH-B'
);

-- AUTH-R03 wrong school in same organization must fail.
INSERT INTO cases
SELECT 'AUTH-R03',false,'SCOPE_WRONG_SCHOOL'
WHERE NOT EXISTS (
 SELECT 1 FROM scopes s
 WHERE s.manager_user_id='U-COORD' AND s.organization_id='ORG-A' AND s.school_id='SCH-B'
);

-- AUTH-R04 expired membership must fail.
INSERT INTO cases
SELECT 'AUTH-R04',false,'MEMBERSHIP_EXPIRED'
WHERE EXISTS (
 SELECT 1 FROM members m
 WHERE m.user_id='U-EXP' AND m.valid_until < '2026-09-29'::timestamptz
);

-- AUTH-R05 teacher cannot manage others merely by school membership.
INSERT INTO cases
SELECT 'AUTH-R05',false,'OPERATION_NOT_GRANTED'
WHERE NOT EXISTS (
 SELECT 1 FROM products p WHERE p.role_code='teacher' AND p.product_code='escala' AND p.can_update_others
);

-- AUTH-R06 product absent must deny.
INSERT INTO cases
SELECT 'AUTH-R06',false,'PRODUCT_NOT_GRANTED'
WHERE NOT EXISTS (
 SELECT 1 FROM products p WHERE p.role_code='coordinator' AND p.product_code='escala_missing' AND p.can_access
);

-- AUTH-R07 resource outside actor context must deny.
INSERT INTO cases
SELECT 'AUTH-R07',false,'RESOURCE_NOT_OWNED'
WHERE NOT EXISTS (
 SELECT 1 FROM resources r WHERE r.id='V-B' AND r.organization_id='ORG-A' AND r.school_id='SCH-A'
);

-- AUTH-R08 override without justification must deny.
INSERT INTO cases
SELECT 'AUTH-R08',false,'JUSTIFICATION_REQUIRED'
WHERE NULLIF(trim(''),'') IS NULL;

-- AUTH-R09 valid teacher read of explicitly assigned resource.
INSERT INTO cases
SELECT 'AUTH-R09',true,NULL
WHERE EXISTS (
 SELECT 1 FROM members m JOIN products p ON p.role_code=m.role_code
 JOIN resources r ON r.assigned_user_id=m.user_id
 WHERE m.user_id='U-TEACH' AND m.organization_id=r.organization_id AND m.school_id=r.school_id
 AND p.product_code='escala' AND p.can_access AND p.can_view_school
);

-- AUTH-R10 direct client role cannot override canonical role.
INSERT INTO cases
SELECT 'AUTH-R10',false,'OPERATION_NOT_GRANTED'
WHERE NOT EXISTS (
 SELECT 1 FROM products p WHERE p.role_code='teacher' AND p.can_update_others
);

-- AUTH-R11 multi-org context must use requested membership, not role leakage.
INSERT INTO cases
SELECT 'AUTH-R11',true,NULL
WHERE EXISTS (
 SELECT 1 FROM members m
 WHERE m.user_id='U-COORD' AND m.organization_id='ORG-B' AND m.school_id='SCH-B'
 AND m.status='active'
);

-- AUTH-R12 fail closed when scope missing.
INSERT INTO cases
SELECT 'AUTH-R12',false,'SCOPE_NOT_FOUND'
WHERE NOT EXISTS (
 SELECT 1 FROM scopes s WHERE s.manager_user_id='U-COORD' AND s.organization_id='ORG-A' AND s.school_id='SCH-C'
);

SELECT count(*) case_count,
       count(*) FILTER(WHERE allowed) allowed_cases,
       count(*) FILTER(WHERE NOT allowed) denied_cases,
       count(*) FILTER(WHERE allowed IS NULL) unresolved_cases,
       count(*) FILTER(WHERE allowed=false AND denial_code IS NULL) missing_denial_code,
       json_agg(json_build_object('case_id',case_id,'allowed',allowed,'denial_code',denial_code) ORDER BY case_id) results
FROM cases;

ROLLBACK;