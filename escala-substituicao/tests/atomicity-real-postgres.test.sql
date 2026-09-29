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
INSERT INTO atomic_state VALUES ('CHECK-R01','PENDING',0);
INSERT INTO atomic_state
SELECT 'CHECK-R01',state,audit_count FROM atomic_state WHERE id='OP1';

-- AT-R02: successful unit remains committed inside transaction.
UPDATE atomic_state SET state='CONFIRMED',audit_count=audit_count+1 WHERE id='OP1';
INSERT INTO atomic_state VALUES ('CHECK-R02','PENDING',0);
INSERT INTO atomic_state
SELECT 'CHECK-R02',state,audit_count FROM atomic_state WHERE id='OP1';

-- AT-R03: failed unit can be rolled back without losing prior committed work.
SAVEPOINT before_failure;
UPDATE atomic_state SET state='BROKEN' WHERE id='OP1';
ROLLBACK TO SAVEPOINT before_failure;
INSERT INTO atomic_state VALUES ('CHECK-R03','PENDING',0);
INSERT INTO atomic_state
SELECT 'CHECK-R03',state,audit_count FROM atomic_state WHERE id='OP1';

SELECT count(*) FILTER (WHERE id='CHECK-R01' AND state='PENDING' AND audit_count=0) AS pass_r01,
       count(*) FILTER (WHERE id='CHECK-R02' AND state='CONFIRMED' AND audit_count=1) AS pass_r02,
       count(*) FILTER (WHERE id='CHECK-R03' AND state='CONFIRMED' AND audit_count=1) AS pass_r03
FROM atomic_state;

ROLLBACK;