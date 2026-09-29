-- Escala EDI — atomicidade transacional real, sem schema produtivo
BEGIN;
CREATE TEMP TABLE atomic_state(
 id text PRIMARY KEY,
 state text NOT NULL,
 audit_count integer NOT NULL DEFAULT 0
);
INSERT INTO atomic_state VALUES ('OP1','PENDING',0);
CREATE TEMP TABLE atomic_checks(case_id text PRIMARY KEY, pass boolean);

-- AT-R01: savepoint rollback restores state.
SAVEPOINT before_confirm;
UPDATE atomic_state SET state='CONFIRMED',audit_count=audit_count+1 WHERE id='OP1';
ROLLBACK TO SAVEPOINT before_confirm;
INSERT INTO atomic_checks SELECT 'AT-R01', state='PENDING' AND audit_count=0 FROM atomic_state WHERE id='OP1';

-- AT-R02: successful unit remains committed inside transaction.
UPDATE atomic_state SET state='CONFIRMED',audit_count=audit_count+1 WHERE id='OP1';
INSERT INTO atomic_checks SELECT 'AT-R02', state='CONFIRMED' AND audit_count=1 FROM atomic_state WHERE id='OP1';

-- AT-R03: failed unit can be rolled back without losing prior committed work.
SAVEPOINT before_failure;
UPDATE atomic_state SET state='BROKEN' WHERE id='OP1';
ROLLBACK TO SAVEPOINT before_failure;
INSERT INTO atomic_checks SELECT 'AT-R03', state='CONFIRMED' AND audit_count=1 FROM atomic_state WHERE id='OP1';

SELECT count(*) AS case_count, count(*) FILTER(WHERE pass) AS pass_count, count(*) FILTER(WHERE NOT pass) AS fail_count, json_agg(json_build_object('case_id',case_id,'pass',pass) ORDER BY case_id) results FROM atomic_checks;