-- Escala de Substituição — Harness PostgreSQL
-- Score + ranking v1.
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
  UNIQUE (run_id, candidate_id),
  CHECK (
    (ranking_status = 'excluded' AND score IS NULL AND rank_position IS NULL)
    OR
    (ranking_status IN ('scored', 'ranked', 'pending_validation') AND score IS NOT NULL)
  )
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
('score-v1', 30, 20, 15, 15, 10, 5, 5),
('score-v2', 30, 20, 15, 15, 10, 5, 5);

INSERT INTO escala_score_test.score_runs (id, rule_set_version, snapshot_reference) VALUES
('90000000-0000-0000-0000-000000000001', 'score-v1', 'snapshot-2026-09-10-v1'),
('90000000-0000-0000-0000-000000000002', 'score-v2', 'snapshot-2026-09-10-v2');

-- S01: eligible candidate with maximum evidence across all criteria.
INSERT INTO escala_score_test.candidates VALUES
('10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', true, 'eligible', 1, 1, 1, 1, 1, 1, 'homologated', 1);

-- S02: component match differentiates otherwise equal candidates.
INSERT INTO escala_score_test.candidates VALUES
('10000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', true, 'eligible', 1, 1, 1, 1, 1, 1, 'homologated', 1);
INSERT INTO escala_score_test.candidates VALUES
('10000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', true, 'eligible', 0, 1, 1, 1, 1, 1, 'homologated', 1);

-- S03: an ineligible candidate must never receive an operational score/rank.
INSERT INTO escala_score_test.candidates VALUES
('10000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000004', true, 'ineligible', 1, 1, 1, 1, 1, 1, 'homologated', 1);

-- S04: complete tie is resolved by a homologated academic technical id.
INSERT INTO escala_score_test.candidates VALUES
('10000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000005', true, 'eligible', 1, 1, 1, 1, 1, 1, 'homologated', 1);
INSERT INTO escala_score_test.candidates VALUES
('10000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000006', true, 'eligible', 1, 1, 1, 1, 1, 1, 'homologated', 1);

-- S05: proximity evidence is explicitly unavailable.
INSERT INTO escala_score_test.candidates VALUES
('10000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000007', true, 'eligible', 1, 1, 1, 1, 1, 1, 'not_available', 1);

-- S08: candidate with intermediate component match for effective multi-candidate ranking.
INSERT INTO escala_score_test.candidates VALUES
('10000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000008', true, 'eligible', 0.5, 1, 1, 1, 1, 1, 'homologated', 1);

-- S06: contribution breakdown is reconstructible from weights and normalized values.
INSERT INTO escala_score_test.scores VALUES
('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 100, 'ranked', 1, 30, 20, 15, 15, 10, 5, 5);

-- S07: ineligible candidate is explicitly excluded and has no score.
INSERT INTO escala_score_test.scores (
  run_id, candidate_id, score, ranking_status, rank_position,
  component_contribution, area_contribution, availability_contribution,
  continuity_contribution, distribution_contribution, proximity_contribution,
  preference_contribution
) VALUES
('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', NULL, 'excluded', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- S08 materialized scores for three eligible candidates to validate actual ranking order.
INSERT INTO escala_score_test.scores VALUES
('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 100, 'ranked', 1, 30, 20, 15, 15, 10, 5, 5),
('90000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000008', 85, 'ranked', 2, 15, 20, 15, 15, 10, 5, 5),
('90000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', 70, 'ranked', 3, 0, 20, 15, 15, 10, 5, 5);

-- S09: same candidate evaluated under a new rule-set run; prior run remains historical.
INSERT INTO escala_score_test.scores VALUES
('90000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 100, 'ranked', 1, 30, 20, 15, 15, 10, 5, 5);

-- GATE-01: weights must total exactly 100 for every supported rule-set version.
DO $$
DECLARE bad_count integer;
BEGIN
  SELECT count(*) INTO bad_count
  FROM escala_score_test.weights
  WHERE component_weight + area_weight + availability_weight + continuity_weight +
        distribution_weight + proximity_weight + preference_weight <> 100;
  IF bad_count <> 0 THEN
    RAISE EXCEPTION 'GATE-01 failed: score weights do not total 100';
  END IF;
END $$;

-- GATE-02: operational scores must remain in the normalized 0-100 range.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM escala_score_test.scores WHERE score IS NOT NULL AND (score < 0 OR score > 100)) THEN
    RAISE EXCEPTION 'GATE-02 failed: score outside 0-100 range';
  END IF;
END $$;

-- GATE-03: an ineligible candidate cannot have score or operational rank.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM escala_score_test.scores s
    JOIN escala_score_test.candidates c ON c.id = s.candidate_id
    WHERE c.eligibility_status <> 'eligible'
      AND (s.ranking_status IN ('scored', 'ranked') OR s.rank_position IS NOT NULL OR s.score IS NOT NULL)
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
  WHERE candidate_id = '10000000-0000-0000-0000-000000000001'
    AND run_id = '90000000-0000-0000-0000-000000000001';
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

-- GATE-06: unavailable proximity evidence is explicit and cannot create an advantage.
DO $$
DECLARE evidence_status text;
DECLARE no_proximity_score numeric;
DECLARE full_score numeric;
BEGIN
  SELECT proximity_evidence_status, 30*component_match + 20*area_match + 15*availability_fit +
         15*continuity + 10*distribution_balance + 5*proximity + 5*institutional_preference
    INTO evidence_status, no_proximity_score
  FROM escala_score_test.candidates WHERE id = '10000000-0000-0000-0000-000000000007';
  SELECT 30*component_match + 20*area_match + 15*availability_fit + 15*continuity +
         10*distribution_balance + 5*proximity + 5*institutional_preference
    INTO full_score
  FROM escala_score_test.candidates WHERE id = '10000000-0000-0000-0000-000000000001';
  IF evidence_status <> 'not_available' THEN
    RAISE EXCEPTION 'GATE-06 failed: proximity evidence state is not explicit';
  END IF;
  IF no_proximity_score >= full_score THEN
    RAISE EXCEPTION 'GATE-06 failed: missing proximity evidence created an advantage';
  END IF;
END $$;

-- GATE-07: tie-break uses a homologated academic technical identifier deterministically.
DO $$
DECLARE first_teacher uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM escala_score_test.candidates
    WHERE id IN ('10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000006')
      AND teacher_id_homologated = false
  ) THEN
    RAISE EXCEPTION 'GATE-07 failed: tie-break candidate lacks homologated technical id';
  END IF;
  SELECT teacher_id INTO first_teacher
  FROM escala_score_test.candidates
  WHERE id IN ('10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000006')
  ORDER BY teacher_id
  LIMIT 1;
  IF first_teacher <> '50000000-0000-0000-0000-000000000005' THEN
    RAISE EXCEPTION 'GATE-07 failed: deterministic technical tie-break not reproducible';
  END IF;
END $$;

-- GATE-08: run provenance retains rule-set version and snapshot reference.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM escala_score_test.score_runs
    WHERE id = '90000000-0000-0000-0000-000000000001'
      AND rule_set_version = 'score-v1'
      AND snapshot_reference = 'snapshot-2026-09-10-v1'
  ) THEN
    RAISE EXCEPTION 'GATE-08 failed: score run provenance missing';
  END IF;
END $$;

-- GATE-09: materialized ranking must order eligible candidates by score, not insertion order.
DO $$
DECLARE ranked_ids uuid[];
BEGIN
  SELECT array_agg(candidate_id ORDER BY rank_position)
    INTO ranked_ids
  FROM escala_score_test.scores
  WHERE run_id = '90000000-0000-0000-0000-000000000001'
    AND ranking_status = 'ranked';
  IF ranked_ids <> ARRAY[
    '10000000-0000-0000-0000-000000000002'::uuid,
    '10000000-0000-0000-0000-000000000008'::uuid,
    '10000000-0000-0000-0000-000000000003'::uuid,
    '10000000-0000-0000-0000-000000000001'::uuid
  ] THEN
    RAISE EXCEPTION 'GATE-09 failed: multi-candidate ranking order is not reproducible';
  END IF;
END $$;

-- GATE-10: changing rule-set version requires a new run and does not overwrite the old run.
DO $$
DECLARE run_count integer;
DECLARE historical_count integer;
BEGIN
  SELECT count(*) INTO run_count FROM escala_score_test.score_runs;
  SELECT count(*) INTO historical_count
  FROM escala_score_test.scores
  WHERE candidate_id = '10000000-0000-0000-0000-000000000001';
  IF run_count <> 2 OR historical_count <> 2 THEN
    RAISE EXCEPTION 'GATE-10 failed: rule-set change did not create a new historical run';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM escala_score_test.scores
    WHERE run_id = '90000000-0000-0000-0000-000000000001'
      AND candidate_id = '10000000-0000-0000-0000-000000000001'
      AND score = 100
  ) THEN
    RAISE EXCEPTION 'GATE-10 failed: historical score was overwritten or lost';
  END IF;
END $$;

-- GATE-11: excluded score is semantically NULL, not numeric zero.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM escala_score_test.scores
    WHERE ranking_status = 'excluded'
      AND (score IS NOT NULL OR rank_position IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'GATE-11 failed: excluded candidate has score/rank';
  END IF;
END $$;

-- GATE-12: proximity unavailable is explicitly explainable by status and does not masquerade as homologated evidence.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM escala_score_test.candidates
    WHERE proximity_evidence_status = 'not_available'
      AND proximity <> 0
  ) THEN
    RAISE EXCEPTION 'GATE-12 failed: unavailable proximity evidence received non-zero value';
  END IF;
END $$;

ROLLBACK;
