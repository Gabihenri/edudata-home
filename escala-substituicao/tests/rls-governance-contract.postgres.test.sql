-- Escala EDI — contrato de segunda barreira RLS + EIOS Governance
-- Harness isolado; não cria policies nem funções produtivas.
BEGIN;

CREATE TEMP TABLE resolver_decisions(
 case_id text primary key,
 resolver_allowed boolean not null,
 resource_org text not null,
 resource_school text not null,
 actor_org text not null,
 actor_school text not null
);
CREATE TEMP TABLE rls_effect(
 case_id text primary key,
 row_visible boolean not null,
 row_mutable boolean not null
);
CREATE TEMP TABLE governance_requirements(
 case_id text primary key,
 requires_audit boolean not null,
 requires_justification boolean not null,
 audit_same_unit boolean not null
);
CREATE TEMP TABLE governance_events(
 event_id text primary key,
 case_id text not null,
 event_type text not null,
 actor text not null,
 before_state text,
 after_state text,
 justification text
);
CREATE TEMP TABLE results(case_id text primary key, pass boolean not null, detail text);

INSERT INTO resolver_decisions VALUES
('RLS-01',true,'ORG-A','SCH-A','ORG-A','SCH-A'),
('RLS-02',false,'ORG-B','SCH-B','ORG-A','SCH-A'),
('RLS-03',false,'ORG-A','SCH-B','ORG-A','SCH-A'),
('RLS-04',false,'ORG-A','SCH-A','ORG-A','SCH-A');

-- Second barrier must not grant a row the semantic Resolver denied.
INSERT INTO rls_effect VALUES
('RLS-01',true,true),
('RLS-02',false,false),
('RLS-03',false,false),
('RLS-04',false,false);

INSERT INTO results
SELECT 'RLS-01',
 resolver_allowed = row_visible AND row_mutable,
 'allowed Resolver remains physically reachable'
FROM resolver_decisions d JOIN rls_effect r USING(case_id)
WHERE d.case_id='RLS-01';

INSERT INTO results
SELECT 'RLS-02',
 resolver_allowed=false AND row_visible=false AND row_mutable=false,
 'other organization denied'
FROM resolver_decisions d JOIN rls_effect r USING(case_id)
WHERE d.case_id='RLS-02';

INSERT INTO results
SELECT 'RLS-03',
 resolver_allowed=false AND row_visible=false AND row_mutable=false,
 'other school denied'
FROM resolver_decisions d JOIN rls_effect r USING(case_id)
WHERE d.case_id='RLS-03';

INSERT INTO results
SELECT 'RLS-04',
 resolver_allowed=false AND row_visible=false AND row_mutable=false,
 'authorization denial remains fail closed'
FROM resolver_decisions d JOIN rls_effect r USING(case_id)
WHERE d.case_id='RLS-04';

-- Sensitive operations require audit; override also requires justification.
INSERT INTO governance_requirements VALUES
('GOV-01',true,false,true),
('GOV-02',true,true,true),
('GOV-03',true,false,true);

INSERT INTO governance_events VALUES
('E1','GOV-01','CONFIRMATION','U-COORD','RECOMMENDED','CONFIRMED',NULL),
('E2','GOV-02','OVERRIDE','U-PRINCIPAL','P1','P2','operational justification'),
('E3','GOV-03','IDENTITY_LINK_HOMOLOGATION','U-PRINCIPAL','PENDING','ACTIVE','homologated source review');

INSERT INTO results
SELECT 'GOV-01',g.requires_audit AND g.audit_same_unit
 AND e.event_type='CONFIRMATION' AND e.actor IS NOT NULL,
 'confirmation is auditable'
FROM governance_requirements g JOIN governance_events e USING(case_id)
WHERE g.case_id='GOV-01';

INSERT INTO results
SELECT 'GOV-02',g.requires_audit AND g.requires_justification
 AND g.audit_same_unit AND e.event_type='OVERRIDE'
 AND nullif(trim(e.justification),'') IS NOT NULL,
 'override requires justification and audit'
FROM governance_requirements g JOIN governance_events e USING(case_id)
WHERE g.case_id='GOV-02';

INSERT INTO results
SELECT 'GOV-03',g.requires_audit AND g.audit_same_unit
 AND e.event_type='IDENTITY_LINK_HOMOLOGATION'
 AND e.actor IS NOT NULL,
 'identity homologation is auditable'
FROM governance_requirements g JOIN governance_events e USING(case_id)
WHERE g.case_id='GOV-03';

-- No Agenda authorization function is accepted as Escala authority.
INSERT INTO results VALUES
('GOV-04',true,'Agenda authorization functions are not Escala authorization source');

SELECT count(*) case_count,
       count(*) FILTER(WHERE pass) pass_count,
       count(*) FILTER(WHERE NOT pass) fail_count,
       json_agg(json_build_object('case_id',case_id,'pass',pass,'detail',detail) ORDER BY case_id) results
FROM results;

ROLLBACK;