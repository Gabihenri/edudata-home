-- Escala de Substituição — Harness PostgreSQL
-- Score + ranking v1/v2.
-- Synthetic / isolated test. No production tables are modified.
-- Contract basis: docs/58-contrato-pontuacao-ranking-v1.md

BEGIN;

CREATE SCHEMA escala_score_test;

CREATE TABLE escala_score_test.candidates (
  id uuid PRIMARY KEY,
  teacher_id uuid NOT NULL,
  teacher_id_homologated boolean NOT NULL,
  eligibility_status text NOT NULL CHECK (eligibility_status IN ('eligible', 'ineligible', 'blocked', 'pending_validation')),
  component_match numeric(4,3) NOT NULL CHECK (component_match BETWEEN 0 AND 1),
  area_match numeric(4,3) NOT NULL CHECK (area_match BETWEEN 0 AND 1),
  availability_fit numeric(4,3) NOT NULL CHECK (availability_fit BETWEEN 0 AND 1),
  continuity numeric(4,3) NOT NULL CHECK (continuity BETWEEN 0 AND 1),
  distribution_balance numeric(4,3) NOT NULL CHECK (distribution_balance BETWEEN 0 AND 1),
  proximity numeric(4,3) NOT NULL CHECK (proximity BETWEEN 0 AND 1),
  proximity_evidence_status text NOT NULL CHECK (proximity_evidence_status IN ('homologated', 'not_available', 'invalid')),
  institutional_preference numeric(4,3) NOT NULL CHECK (institutional_preference BETWEEN 0 AND 1)
);

CREATE TABLE escala_score_test.score_runs (
  id uuid PRIMARY KEY,
  rule_set_version text NOT NULL,
  snapshot_reference text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE escala_score_test.weights (
  rule_set_version text PRIMARY KEY,
  component_weight numeric(5,2) NOT NULL,
  area_weight numeric(5,2) NOT NULL,
  availability_weight numeric(5,2) NOT NULL,
  continuity_weight numeric(5,2) NOT NULL,
  distribution_weight numeric(5,2) NOT NULL,
  proximity_weight numeric(5,2) NOT NULL,
  preference_weight numeric(5,2) NOT NULL
);

CREATE TABLE escala_score_test.scores (
  run_id uuid NOT NULL REFERENCES escala_score_test.score_runs(id),
  candidate_id uuid NOT NULL REFERENCES escala_score_test.candidates(id),
  score numeric(7,3),
  ranking_status text NOT NULL CHECK (ranking_status IN ('excluded', 'scored', 'ranked', 'pending_validation')),
  rank_position integer,
  component_contribution numeric(7,3),
  area_contribution numeric(7,3),
  availability_contribution numeric(7,3),
  continuity_contribution numeric(7,3),
  distribution_contribution numeric(7,3),
  proximity_contribution numeric(7,3),
  preference_contribution numeric(7,3),
  score_breakdown jsonb,
  UNIQUE (run_id, candidate_id),
  CHECK (
    (ranking_status = 'excluded' AND score IS NULL AND rank_position IS NULL)
    OR
    (ranking_status IN ('scored', 'ranked', 'pending_validation') AND score IS NOT NULL)
  )
);

INSERT INTO escala_score_test.weights VALUES
('score-v1', 30, 20, 15, 15, 10, 5, 5),
-- Controlled v2 change: component weight +5, area weight -5.
('score-v2', 35, 15, 15, 15, 10, 5, 5);

INSERT INTO escala_score_test.score_runs (id, rule_set_version, snapshot_reference) VALUES
('90000000-0000-0000-0000-000000000001', 'score-v1', 'snapshot-2026-09-10-v1'),
('90000000-0000-0000-0000-000000000002', 'score-v2', 'snapshot-2026-09-10-v2');

INSERT INTO escala_score_test.candidates VALUES
('10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', true, 'eligible', 1, 1, 1, 1, 1, 1, 'homologated', 1),
('10000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', true, 'eligible', 1, 1, 1, 1, 1, 1, 'homologated', 1),
('10000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', true, 'eligible', 0, 1, 1, 1, 1, 1, 'homologated', 1),
('10000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000004', true, 'ineligible', 1, 1, 1, 1, 1, 1, 'homologated', 1),
('10000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000005', true, 'eligible', 1, 1, 1, 1, 1, 1, 'homologated', 1),
('10000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000006', true, 'eligible', 1, 1, 1, 1, 1, 1, 'homologated', 1),
('10000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000007', true, 'eligible', 1, 1, 1, 1, 1, 1, 'not_available', 1),
('10000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000008', true, 'eligible', 0.5, 1, 1, 1, 1, 1, 'homologated', 1),
('10000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000009', true, 'eligible', 0.5, 0, 1, 1, 1, 1, 'homologated', 1);

CREATE OR REPLACE FUNCTION escala_score_test.calculate_score(
  p_candidate_id uuid,
  p_rule_set_version text
) RETURNS numeric
LANGUAGE sql
AS $$
  SELECT round(
    c.component_match * w.component_weight +
    c.area_match * w.area_weight +
    c.availability_fit * w.availability_weight +
    c.continuity * w.continuity_weight +
    c.distribution_balance * w.distribution_weight +
    c.proximity * w.proximity_weight +
    c.institutional_preference * w.preference_weight,
    3
  )
  FROM escala_score_test.candidates c
  JOIN escala_score_test.weights w ON w.rule_set_version = p_rule_set_version
  WHERE c.id = p_candidate_id
    AND c.eligibility_status = 'eligible';
$$;

-- Calculate and materialize v1 from eligible candidates only.
WITH calculated AS (
  SELECT c.id AS candidate_id, c.teacher_id, c.component_match, c.area_match,
         c.continuity, c.distribution_balance,
         escala_score_test.calculate_score(c.id, 'score-v1') AS score
  FROM escala_score_test.candidates c
  WHERE c.eligibility_status = 'eligible'
), ranked AS (
  SELECT *, row_number() OVER (
    ORDER BY score DESC, component_match DESC, area_match DESC,
             continuity DESC, distribution_balance DESC, teacher_id ASC
  ) AS rank_position
  FROM calculated
)
INSERT INTO escala_score_test.scores (
  run_id, candidate_id, score, ranking_status, rank_position,
  component_contribution, area_contribution, availability_contribution,
  continuity_contribution, distribution_contribution, proximity_contribution,
  preference_contribution, score_breakdown
)
SELECT '90000000-0000-0000-0000-000000000001', r.candidate_id, r.score, 'ranked', r.rank_position,
       round(c.component_match * w.component_weight, 3),
       round(c.area_match * w.area_weight, 3),
       round(c.availability_fit * w.availability_weight, 3),
       round(c.continuity * w.continuity_weight, 3),
       round(c.distribution_balance * w.distribution_weight, 3),
       round(c.proximity * w.proximity_weight, 3),
       round(c.institutional_preference * w.preference_weight, 3),
       jsonb_build_object('rule_set_version','score-v1','criteria',jsonb_build_array(
         jsonb_build_object('code','SCORE-01','weight',w.component_weight,'normalized_value',c.component_match),
         jsonb_build_object('code','SCORE-02','weight',w.area_weight,'normalized_value',c.area_match),
         jsonb_build_object('code','SCORE-03','weight',w.availability_weight,'normalized_value',c.availability_fit),
         jsonb_build_object('code','SCORE-04','weight',w.continuity_weight,'normalized_value',c.continuity),
         jsonb_build_object('code','SCORE-05','weight',w.distribution_weight,'normalized_value',c.distribution_balance),
         jsonb_build_object('code','SCORE-06','weight',w.proximity_weight,'normalized_value',c.proximity,
           'evidence_status',c.proximity_evidence_status,
           'reason_code',CASE WHEN c.proximity_evidence_status='not_available' THEN 'PROXIMITY_NOT_AVAILABLE' ELSE NULL END),
         jsonb_build_object('code','SCORE-07','weight',w.preference_weight,'normalized_value',c.institutional_preference)
       ))
FROM ranked r
JOIN escala_score_test.candidates c ON c.id=r.candidate_id
JOIN escala_score_test.weights w ON w.rule_set_version='score-v1';

INSERT INTO escala_score_test.scores (
  run_id, candidate_id, score, ranking_status, rank_position,
  component_contribution, area_contribution, availability_contribution,
  continuity_contribution, distribution_contribution, proximity_contribution,
  preference_contribution, score_breakdown
) VALUES
('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', NULL, 'excluded', NULL,
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- Capture the v1 historical result before the v2 run.
CREATE TEMP TABLE escala_score_test.v1_history AS
SELECT candidate_id, score, ranking_status, rank_position, score_breakdown
FROM escala_score_test.scores
WHERE run_id='90000000-0000-0000-0000-000000000001';

-- Calculate and materialize v2 using changed weights and the same source candidates.
WITH calculated AS (
  SELECT c.id AS candidate_id, c.teacher_id, c.component_match, c.area_match,
         c.continuity, c.distribution_balance,
         escala_score_test.calculate_score(c.id, 'score-v2') AS score
  FROM escala_score_test.candidates c
  WHERE c.eligibility_status = 'eligible'
), ranked AS (
  SELECT *, row_number() OVER (
    ORDER BY score DESC, component_match DESC, area_match DESC,
             continuity DESC, distribution_balance DESC, teacher_id ASC
  ) AS rank_position
  FROM calculated
)
INSERT INTO escala_score_test.scores (
  run_id, candidate_id, score, ranking_status, rank_position,
  component_contribution, area_contribution, availability_contribution,
  continuity_contribution, distribution_contribution, proximity_contribution,
  preference_contribution, score_breakdown
)
SELECT '90000000-0000-0000-0000-000000000002', r.candidate_id, r.score, 'ranked', r.rank_position,
       round(c.component_match * w.component_weight, 3),
       round(c.area_match * w.area_weight, 3),
       round(c.availability_fit * w.availability_weight, 3),
       round(c.continuity * w.continuity_weight, 3),
       round(c.distribution_balance * w.distribution_weight, 3),
       round(c.proximity * w.proximity_weight, 3),
       round(c.institutional_preference * w.preference_weight, 3),
       jsonb_build_object('rule_set_version','score-v2')
FROM ranked r
JOIN escala_score_test.candidates c ON c.id=r.candidate_id
JOIN escala_score_test.weights w ON w.rule_set_version='score-v2';

-- GATE-01
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM escala_score_test.weights
    WHERE component_weight+area_weight+availability_weight+continuity_weight+
          distribution_weight+proximity_weight+preference_weight<>100)
  THEN RAISE EXCEPTION 'GATE-01 failed: score weights do not total 100'; END IF;
END $$;

-- GATE-02
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM escala_score_test.scores WHERE score IS NOT NULL AND (score<0 OR score>100))
  THEN RAISE EXCEPTION 'GATE-02 failed: score outside 0-100 range'; END IF;
END $$;

-- GATE-03
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM escala_score_test.scores s JOIN escala_score_test.candidates c ON c.id=s.candidate_id
    WHERE c.eligibility_status<>'eligible' AND
      (s.score IS NOT NULL OR s.rank_position IS NOT NULL OR s.ranking_status IN ('scored','ranked')))
  THEN RAISE EXCEPTION 'GATE-03 failed: score bypassed HARD eligibility gate'; END IF;
END $$;

-- GATE-04
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM escala_score_test.scores
    WHERE score IS NOT NULL AND score<>component_contribution+area_contribution+availability_contribution+
      continuity_contribution+distribution_contribution+proximity_contribution+preference_contribution)
  THEN RAISE EXCEPTION 'GATE-04 failed: contribution breakdown does not reconstruct score'; END IF;
END $$;

-- GATE-05
DO $$ BEGIN
  IF escala_score_test.calculate_score('10000000-0000-0000-0000-000000000002','score-v1')
     <= escala_score_test.calculate_score('10000000-0000-0000-0000-000000000003','score-v1')
  THEN RAISE EXCEPTION 'GATE-05 failed: component match did not affect score'; END IF;
END $$;

-- GATE-06
DO $$ DECLARE evidence_status text; BEGIN
  SELECT proximity_evidence_status INTO evidence_status FROM escala_score_test.candidates
  WHERE id='10000000-0000-0000-0000-000000000007';
  IF evidence_status<>'not_available' THEN RAISE EXCEPTION 'GATE-06 failed: proximity evidence state is not explicit'; END IF;
  IF escala_score_test.calculate_score('10000000-0000-0000-0000-000000000007','score-v1')
     >= escala_score_test.calculate_score('10000000-0000-0000-0000-000000000001','score-v1')
  THEN RAISE EXCEPTION 'GATE-06 failed: missing proximity evidence created an advantage'; END IF;
END $$;

-- GATE-07
DO $$ DECLARE first_teacher uuid; BEGIN
  IF EXISTS (SELECT 1 FROM escala_score_test.candidates
    WHERE id IN ('10000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000006')
      AND teacher_id_homologated=false)
  THEN RAISE EXCEPTION 'GATE-07 failed: tie-break identifier is not homologated'; END IF;
  SELECT teacher_id INTO first_teacher FROM escala_score_test.candidates
  WHERE id IN ('10000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000006')
  ORDER BY teacher_id LIMIT 1;
  IF first_teacher<>'50000000-0000-0000-0000-000000000005'
  THEN RAISE EXCEPTION 'GATE-07 failed: deterministic tie-break not reproducible'; END IF;
END $$;

-- GATE-08
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM escala_score_test.score_runs WHERE id='90000000-0000-0000-0000-000000000001' AND rule_set_version='score-v1' AND snapshot_reference='snapshot-2026-09-10-v1')
     OR NOT EXISTS (SELECT 1 FROM escala_score_test.score_runs WHERE id='90000000-0000-0000-0000-000000000002' AND rule_set_version='score-v2' AND snapshot_reference='snapshot-2026-09-10-v2')
  THEN RAISE EXCEPTION 'GATE-08 failed: run provenance missing'; END IF;
END $$;

-- GATE-09: stored ranking must equal ranking recalculated from source candidates.
DO $$ DECLARE calculated_ids uuid[]; stored_ids uuid[]; BEGIN
  SELECT array_agg(candidate_id ORDER BY rank_position) INTO stored_ids
  FROM escala_score_test.scores WHERE run_id='90000000-0000-0000-0000-000000000001' AND ranking_status='ranked';
  SELECT array_agg(candidate_id ORDER BY score DESC, component_match DESC, area_match DESC, continuity DESC, distribution_balance DESC, teacher_id ASC)
  INTO calculated_ids FROM (
    SELECT c.id candidate_id, escala_score_test.calculate_score(c.id,'score-v1') score,
           c.component_match,c.area_match,c.continuity,c.distribution_balance,c.teacher_id
    FROM escala_score_test.candidates c WHERE c.eligibility_status='eligible'
  ) q;
  IF stored_ids<>calculated_ids THEN RAISE EXCEPTION 'GATE-09 failed: stored ranking differs from deterministic calculation'; END IF;
END $$;

-- GATE-10: controlled rule-set change must alter the score of candidate 008.
DO $$ BEGIN
  IF escala_score_test.calculate_score('10000000-0000-0000-0000-000000000008','score-v1')
     = escala_score_test.calculate_score('10000000-0000-0000-0000-000000000008','score-v2')
  THEN RAISE EXCEPTION 'GATE-10 failed: changed rule-set produced identical controlled result'; END IF;
END $$;

-- GATE-11: every v1 row must remain byte-for-byte equivalent in logical fields after v2.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM escala_score_test.v1_history h
    FULL JOIN escala_score_test.scores s
      ON s.run_id='90000000-0000-0000-0000-000000000001' AND s.candidate_id=h.candidate_id
    WHERE h.candidate_id IS NULL OR s.candidate_id IS NULL
       OR h.score IS DISTINCT FROM s.score
       OR h.ranking_status IS DISTINCT FROM s.ranking_status
       OR h.rank_position IS DISTINCT FROM s.rank_position
       OR h.score_breakdown IS DISTINCT FROM s.score_breakdown
  ) THEN RAISE EXCEPTION 'GATE-11 failed: v1 historical result changed'; END IF;
END $$;

-- GATE-12: explanation exposes unavailable proximity reason code.
DO $$ DECLARE reason text; BEGIN
  SELECT score_breakdown #>> '{criteria,5,reason_code}' INTO reason
  FROM escala_score_test.scores
  WHERE run_id='90000000-0000-0000-0000-000000000001'
    AND candidate_id='10000000-0000-0000-0000-000000000007';
  IF reason<>'PROXIMITY_NOT_AVAILABLE' THEN RAISE EXCEPTION 'GATE-12 failed: proximity reason code missing'; END IF;
END $$;

-- GATE-13: same candidate can have one result per run, preserving history across runs.
DO $$ BEGIN
  IF EXISTS (SELECT run_id,candidate_id,count(*) FROM escala_score_test.scores GROUP BY run_id,candidate_id HAVING count(*)>1)
  THEN RAISE EXCEPTION 'GATE-13 failed: duplicate candidate result within a run'; END IF;
  IF (SELECT count(*) FROM escala_score_test.scores WHERE candidate_id='10000000-0000-0000-0000-000000000008')<>2
  THEN RAISE EXCEPTION 'GATE-13 failed: historical result missing'; END IF;
END $$;

ROLLBACK;
