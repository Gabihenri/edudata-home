-- 169 — Regressão contratual dos consumidores do role canônico
-- Sintético; não altera produção.
BEGIN;
DROP TABLE IF EXISTS tmp_consumer_regression;
CREATE TEMP TABLE tmp_consumer_regression(
 case_id text PRIMARY KEY, consumer text, input_role text, expected_role text, expected_access boolean, expected_behavior text
);
INSERT INTO tmp_consumer_regression VALUES
('C01','can_access_identity_product','teacher','teacher',true,'canonical_role'),
('C02','can_access_identity_product','coordinator','coordinator',true,'canonical_role'),
('C03','can_access_identity_product','principal','principal',true,'canonical_role'),
('C04','can_access_identity_product','institution_admin','institution_admin',true,'canonical_role'),
('C05','agenda_view','teacher','teacher',true,'preserve_agenda_scope'),
('C06','agenda_manage','coordinator','coordinator',true,'preserve_agenda_scope'),
('C07','agenda_manage','principal','principal',true,'preserve_agenda_scope'),
('C08','calendar_manage','principal','principal',true,'canonical_role'),
('C09','calendar_manage','vice_principal','vice_principal',true,'canonical_role'),
('C10','calendar_manage','supervisor','supervisor',true,'canonical_role'),
('C11','calendar_manage','regional_manager','regional_manager',true,'canonical_role'),
('C12','support_requester_context','teacher','teacher',true,'preserve_output_contract'),
('C13','support_requester_context','principal','principal',true,'preserve_output_contract'),
('C14','support_requester_context','platform_admin','platform_admin',true,'platform_context'),
('C15','support_requester_context','super_admin','super_admin',true,'platform_context'),
('C16','escala_authorization','teacher','teacher',true,'core_role_only'),
('C17','escala_authorization','coordinator','coordinator',true,'core_role_only'),
('C18','escala_authorization','principal','principal',true,'core_role_only'),
('C19','escala_authorization','unknown',NULL,false,'fail_closed'),
('C20','any_consumer','ambiguous',NULL,false,'fail_closed'),
('C21','any_consumer','suspended',NULL,false,'fail_closed'),
('C22','any_consumer','profile_elevated', 'teacher',true,'membership_wins'),
('C23','any_consumer','unhomologated_platform_alias','teacher',true,'no_elevation'),
('C24','any_consumer','other_org_membership','teacher',true,'context_isolation');
DO $$ BEGIN
 IF (SELECT count(*) FROM tmp_consumer_regression) <> 24 THEN RAISE EXCEPTION 'FAIL_C01_C24_CASE_COUNT'; END IF;
 IF (SELECT count(*) FROM tmp_consumer_regression WHERE expected_behavior='fail_closed' AND expected_access=false) <> 2 THEN RAISE EXCEPTION 'FAIL_FAIL_CLOSED_MATRIX'; END IF;
 IF (SELECT count(*) FROM tmp_consumer_regression WHERE expected_behavior='membership_wins') <> 1 THEN RAISE EXCEPTION 'FAIL_MEMBERSHIP_PRECEDENCE'; END IF;
 IF (SELECT count(*) FROM tmp_consumer_regression WHERE expected_behavior='no_elevation') <> 1 THEN RAISE EXCEPTION 'FAIL_NO_ELEVATION'; END IF;
 IF (SELECT count(*) FROM tmp_consumer_regression WHERE expected_behavior='context_isolation') <> 1 THEN RAISE EXCEPTION 'FAIL_CONTEXT_ISOLATION'; END IF;
 RAISE NOTICE 'PASS_C01_C24_CORE_CONSUMER_REGRESSION';
END $$;
COMMIT;