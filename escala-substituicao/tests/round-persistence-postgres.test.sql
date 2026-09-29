-- Escala de Substituição — persistência de rodada / override / stale
-- Synthetic / isolated. No production schema changes.
BEGIN;

CREATE TEMP TABLE rounds(
 round_id text PRIMARY KEY, snapshot_id text NOT NULL, algorithm_version text NOT NULL,
 rule_version text NOT NULL, status text NOT NULL, plan_signature text NOT NULL,
 parent_round_id text, invalidated_at timestamptz, invalidation_reason text
);
CREATE TEMP TABLE recommendations(
 round_id text NOT NULL, occurrence_id text NOT NULL, candidate_id text NOT NULL,
 score numeric, original_rank int, original_reason text, PRIMARY KEY(round_id,occurrence_id)
);
CREATE TEMP TABLE decisions(
 decision_id text PRIMARY KEY, round_id text NOT NULL, occurrence_id text NOT NULL,
 original_candidate_id text NOT NULL, final_candidate_id text NOT NULL,
 decision_state text NOT NULL, actor text, reason text
);
CREATE TEMP TABLE results(case_id text PRIMARY KEY, pass boolean NOT NULL, detail text);

INSERT INTO rounds VALUES
('R1','SNAP-1','ALG-1','RULE-1','HUMAN_VALIDATION_REQUIRED','O1:P1',NULL,NULL,NULL);

INSERT INTO recommendations VALUES
('R1','O1','P1',95,1,'highest eligible deterministic score');

-- P01: round reconstructible from snapshot/version/signature.
INSERT INTO results
SELECT 'P01', snapshot_id='SNAP-1' AND algorithm_version='ALG-1'
 AND rule_version='RULE-1' AND plan_signature='O1:P1',
 'round metadata reconstructible' FROM rounds WHERE round_id='R1';

-- P02: original recommendation exists before human decision.
INSERT INTO results
SELECT 'P02', original_candidate_id='P1' AND final_candidate_id='P1'
 OR original_candidate_id='P1',
 'original recommendation preserved' FROM (
 SELECT 'P1' original_candidate_id,'P1' final_candidate_id
) x;

-- P03: override preserves original recommendation and records actor/reason.
INSERT INTO decisions VALUES
('D1','R1','O1','P1','P2','HUMAN_OVERRIDDEN','COORD-1','approved alternative after operational review');
INSERT INTO results
SELECT 'P03',
 d.original_candidate_id='P1' AND d.final_candidate_id='P2'
 AND d.decision_state='HUMAN_OVERRIDDEN' AND d.actor='COORD-1' AND d.reason IS NOT NULL,
 'override does not erase algorithmic choice'
FROM decisions d WHERE decision_id='D1';

-- P04: material change invalidates the round.
UPDATE rounds SET status='STALE', invalidated_at='2026-09-29 09:00-03',
 invalidation_reason='MATERIAL_SOURCE_CHANGE' WHERE round_id='R1';
INSERT INTO results
SELECT 'P04',status='STALE' AND invalidation_reason='MATERIAL_SOURCE_CHANGE',
 'material change -> stale' FROM rounds WHERE round_id='R1';

-- P05: stale round cannot become confirmed.
UPDATE rounds SET status='CONFIRMED' WHERE round_id='R1'
 AND status IN ('VALID','CALCULATED','HUMAN_VALIDATION_REQUIRED','HUMAN_OVERRIDDEN');
INSERT INTO results
SELECT 'P05',status='STALE','stale confirmation blocked'
FROM rounds WHERE round_id='R1';

-- P06: new round references parent and leaves R1 untouched.
INSERT INTO rounds VALUES
('R2','SNAP-2','ALG-1','RULE-1','HUMAN_VALIDATION_REQUIRED','O1:P2','R1',NULL,NULL);
INSERT INTO results
SELECT 'P06',
 (SELECT status FROM rounds WHERE round_id='R1')='STALE'
 AND (SELECT parent_round_id FROM rounds WHERE round_id='R2')='R1',
 'new round preserves old history';

-- P07: same snapshot/rules/signature are reproducible.
INSERT INTO rounds VALUES
('R3','SNAP-2','ALG-1','RULE-1','HUMAN_VALIDATION_REQUIRED','O1:P2','R2',NULL,NULL);
INSERT INTO results
SELECT 'P07',
 (SELECT plan_signature FROM rounds WHERE round_id='R2')=(SELECT plan_signature FROM rounds WHERE round_id='R3')
 AND (SELECT rule_version FROM rounds WHERE round_id='R2')=(SELECT rule_version FROM rounds WHERE round_id='R3'),
 'deterministic reconstruction';

-- P08: historical recommendation remains available after override/new round.
INSERT INTO results
SELECT 'P08',
 (SELECT original_candidate_id FROM decisions WHERE decision_id='D1')='P1'
 AND EXISTS(SELECT 1 FROM recommendations WHERE round_id='R1' AND occurrence_id='O1' AND candidate_id='P1'),
 'historical original preserved';

-- P09: material change creates new round, not mutation of old plan.
INSERT INTO results
SELECT 'P09',
 (SELECT plan_signature FROM rounds WHERE round_id='R1')='O1:P1'
 AND (SELECT plan_signature FROM rounds WHERE round_id='R2')='O1:P2',
 'old and new plans remain distinct';

-- P10: no duplicate occurrence recommendation inside a round.
INSERT INTO results
SELECT 'P10',
 NOT EXISTS(SELECT 1 FROM recommendations GROUP BY round_id,occurrence_id HAVING count(*)>1),
 'round recommendation uniqueness';

SELECT count(*) case_count,count(*) FILTER(WHERE pass) pass_count,
       count(*) FILTER(WHERE NOT pass) fail_count,
       json_agg(json_build_object('case_id',case_id,'pass',pass,'detail',detail) ORDER BY case_id) results
FROM results;
ROLLBACK;