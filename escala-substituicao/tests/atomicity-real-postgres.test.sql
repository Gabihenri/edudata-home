-- Escala EDI — atomicidade transacional real, sem schema produtivo
BEGIN;
CREATE TEMP TABLE atomic_state(
 id text PRIMARY KEY,
 state text NOT NULL,
 audit_count integer NOT NULL DEFAULT 0
);
INSERT INTO atomic_state VALUES ('OP1','PENDING',0);

-- AT-R01: savepoint rollback restores state.
SAVEPOINT before_confirm;
UPDATE atomic_state SET state='CONFIRMED',audit_count=audit_count+1 WHERE id='OP1';
ROLLBACK TO SAVEPOINT before_confirm;
SELECT state,audit_count FROM atomic_state WHERE id='OP1';

-- AT-R02: successful unit remains committed inside transaction.
UPDATE atomic_state SET state='CONFIRMED',audit_count=audit_count+1 WHERE id='OP1';
SELECT state,audit_count FROM atomic_state WHERE id='OP1';

-- AT-R03: failed unit can be rolled back without losing prior committed work.
SAVEPOINT before_failure;
UPDATE atomic_state SET state='BROKEN' WHERE id='OP1';
ROLLBACK TO SAVEPOINT before_failure;
SELECT state,audit_count FROM atomic_state WHERE id='OP1';

SELECT
 (SELECT state='PENDING' AND audit_count=0 FROM atomic_state WHERE id='OP1') AS rollback_restores,
 (SELECT state='CONFIRMED' AND audit_count=1 FROM atomic_state WHERE id='OP1') AS successful_mutation,
 (SELECT state='CONFIRMED' AND audit_count=1 FROM atomic_state WHERE id='OP1') AS rollback_preserves_prior_work;

ROLLBACK;