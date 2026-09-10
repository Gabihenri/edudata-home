-- Escala de Substituição — Harness PostgreSQL
-- Score + ranking v1.
-- Synthetic / isolated test. No production tables are modified.

BEGIN;

CREATE SCHEMA escala_score_test;

CREATE TABLE escala_score_test.candidates (
  id uuid PRIMARY KEY,
  teacher_id uuid NOT NULL,
  eligibility_status text NOT NULL CHECK (eligibility_status IN ('eligible', 'ineligible', 'blocked', 'pending_validation')),
  component_match numeric(4,3) NOT NULL CHECK (component_match BETWEEN 0 AND 1),
  area_match numeric(4,3) NOT NULL CHECK (area_match BETWEEN 0 AND 1),
  availability_fit numeric(4,3) NOT NULL CHECK (availability_fit BETWEEN 0 AND 1),
  continuity numeric(4,3) NOT NULL CHECK (continuity BETWEEN 0 AND 1),
  distribution_balance numeric(4,3) NOT NULL CHECK (distribution_balance BETWEEN 0 AND 1),
  proximity numeric(4,3) NOT NULL CHECK (proximity BETWEEN 0 AND 1),
  institutional_preference numeric(4,3) NOT NULL CHECK (institutional_preference BETWEEN 0 AND 1)
);

CREATE TABLE escala_score_test.score_runs (
  id uuid PRIMARY KEY,
  rule_set_version text NOT NULL,
  snapshot_reference text NOT NULL
);

CREATE TABLE escala_score_test.scores (
  run_id uuid NOT NULL REFERENCES escala_score_test.score_runs(id),
  candidate_id uuid NOT NULL REFERENCES escala_score_test.candidates(id),
  score numeric(7,3) NOT NULL CHECK (score BETWEEN 0 AND 100),
  ranking_status text NOT NULL CHECK (ranking_status IN ('excluded', 'scored', 'ranked', 'pending_validation')),
  rank_position integer,
  component_contribution numeric(7,3) NOT NULL,
  area_contribution numeric(7,3) NOT NULL,
  availability_contribution numeric(7,3) NOT NULL,
  continuity_contribution numeric(7,3) NOT NULL,
  distribution_contribution numeric(7,3) NOT NULL,
  proximity_contribution numeric(7,3) NOT NULL,
  preference_contribution numeric(7,3) NOT NULL,
  UNIQUE (run_id, candidate_id)
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

INSERT INTO escala_score_test.weights VALUES
('score-v1', 30, 20, 15, 15, 10, 5, 5);

INSERT INTO escala_score_test.score_runs VALUES
('90000000-0000-0000-0000-000000000001', 'score-v1', 'snapshot-2026-09-14-v1');

-- S01: eligible candidate with maximum evidence across all criteria.
INSERT INTO escala_score_test.candidates VALUES
('10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'eligible', 1, 1, 1, 1, 1, 1, 1);

-- S02: component match differentiates otherwise equal candidates.
INSERT INTO escala_score_test.candidates VALUES
('10000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'eligible', 1, 1, 1, 1, 1, 1, 1);
INSERT INTO escala_score_test.candidates VALUES
('10000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', 'eligible', 0, 1, 1, 1, 1, 1, 1);

-- S03: an ineligible candidate must never receive an operational score/rank.
INSERT INTO escala_score_test.candidates VALUES
('10000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000004', 'ineligible', 1, 1, 1, 1, 1, 1, 1);

-- S04: complete tie on score is resolved deterministically by homologated technical id.
INSERT INTO escala_score_test.candidates VALUES
('10000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000005', 'eligible', 1, 1, 1, 1, 1, 1, 1);
INSERT INTO escala_score_test.candidates VALUES
('10000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000006', 'eligible', 1, 1, 1, 1, 1, 1, 1);

-- S05: unavailable proximity evidence is represented as zero and cannot create an artificial advantage.
INSERT INTO escala_score_test.candidates VALUES
('10000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000007', 'eligible', 1, 1, 1, 1, 1, 1, 0);

-- S06: contribution breakdown is reconstructible from weights and normalized values.
INSERT INTO escala_score_test.scores VALUES
('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 100, 'ranked', 1, 30, 20, 15, 15, 10, 5, 5);

-- S07: ineligible candidate is explicitly excluded rather than scored.
INSERT INTO escala_score_test.scores (
  run_id, candidate_id, score, ranking_status, rank_position,
  component_contribution, area_contribution, availability_contribution,
  continuity_contribution, distribution_contribution, proximity_contribution,
  preference_contribution
) VALUES
('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 0, 'excluded', NULL, 0, 0, 0, 0, 0, 0, 0);

-- GATE-01: weights must total exactly 100.
DO $$
DECLARE total_weight numeric;
BEGIN
  SELECT component_weight + area_weight + availability_weight + continuity_weight +
         distribution_weight + proximity_weight + preference_weight
    INTO total_weight
  FROM escala_score_test.weights WHERE rule_set_version = 'score-v1';
  IF total_weight <> 100 THEN
    RAISE EXCEPTION 'GATE-01 failed: score weights do not total 100';
  END IF;
END $$;

-- GATE-02: score must remain in the normalized 0-100 range.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM escala_score_test.scores WHERE score < 0 OR score > 100) THEN
    RAISE EXCEPTION 'GATE-02 failed: score outside 0-100 range';
  END IF;
END $$;

-- GATE-03: an ineligible candidate cannot have a scored/ranked status or rank.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM escala_score_test.scores s
    JOIN escala_score_test.candidates c ON c.id = s.candidate_id
    WHERE c.eligibility_status <> 'eligible'
      AND (s.ranking_status IN ('scored', 'ranked') OR s.rank_position IS NOT NULL OR s.score <> 0)
  ) THEN
    RAISE EXCEPTION 'GATE-03 failed: score bypassed HARD eligibility gate';
  END IF;
END $$;

-- GATE-04: maximum evidence must reconstruct to 100 exactly.
DO $$
DECLARE reconstructed numeric;
BEGIN
  SELECT component_contribution + area_contribution + availability_contribution +
         continuity_contribution + distribution_contribution + proximity_contribution +
         preference_contribution
    INTO reconstructed
  FROM escala_score_test.scores
  WHERE candidate_id = '10000000-0000-0000-0000-000000000001';
  IF reconstructed <> 100 THEN
    RAISE EXCEPTION 'GATE-04 failed: contribution breakdown does not reconstruct score';
  END IF;
END $$;

-- GATE-05: component match is the strongest single criterion and differentiates S02.
DO $$
DECLARE full_score numeric;
DECLARE reduced_score numeric;
BEGIN
  SELECT 30*component_match + 20*area_match + 15*availability_fit + 15*continuity +
         10*distribution_balance + 5*proximity + 5*institutional_preference
    INTO full_score
  FROM escala_score_test.candidates WHERE id = '10000000-0000-0000-0000-000000000002';
  SELECT 30*component_match + 20*area_match + 15*availability_fit + 15*continuity +
         10*distribution_balance + 5*proximity + 5*institutional_preference
    INTO reduced_score
  FROM escala_score_test.candidates WHERE id = '10000000-0000-0000-0000-000000000003';
  IF full_score <= reduced_score THEN
    RAISE EXCEPTION 'GATE-05 failed: component match did not affect ranking';
  END IF;
END $$;

-- GATE-06: unavailable proximity evidence cannot produce a score advantage over full evidence.
DO $$
DECLARE full_score numeric;
DECLARE no_proximity_score numeric;
BEGIN
  SELECT 30*component_match + 20*area_match + 15*availability_fit + 15*continuity +
         10*distribution_balance + 5*proximity + 5*institutional_preference
    INTO full_score
  FROM escala_score_test.candidates WHERE id = '10000000-0000-0000-0000-000000000001';
  SELECT 30*component_match + 20*area_match + 15*availability_fit + 15*continuity +
         10*distribution_balance + 5*proximity + 5*institutional_preference
    INTO no_proximity_score
  FROM escala_score_test.candidates WHERE id = '10000000-0000-0000-0000-000000000007';
  IF no_proximity_score >= full_score THEN
    RAISE EXCEPTION 'GATE-06 failed: missing proximity evidence created an advantage';
  END IF;
END $$;

-- GATE-07: tie-break technical ordering is deterministic and does not use insertion order.
DO $$
DECLARE first_teacher uuid;
BEGIN
  SELECT teacher_id INTO first_teacher
  FROM escala_score_test.candidates
  WHERE id IN ('10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000006')
  ORDER BY teacher_id
  LIMIT 1;
  IF first_teacher <> '50000000-0000-0000-0000-000000000005' THEN
    RAISE EXCEPTION 'GATE-07 failed: deterministic technical tie-break not reproducible';
  END IF;
END $$;

-- GATE-08: the run must retain its rule-set version and snapshot reference.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM escala_score_test.score_runs
    WHERE id = '90000000-0000-0000-0000-000000000001'
      AND rule_set_version = 'score-v1'
      AND snapshot_reference = 'snapshot-2026-09-14-v1'
  ) THEN
    RAISE EXCEPTION 'GATE-08 failed: score run provenance missing';
  END IF;
END $$;

ROLLBACK;
