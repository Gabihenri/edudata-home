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
  valid_substitutions_count integer NOT NULL CHECK (valid_substitutions_count >= 0),
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
  CHECK ((ranking_status = 'excluded' AND score IS NULL AND rank_position IS NULL)
      OR (ranking_status IN ('scored', 'ranked', 'pending_validation') AND score IS NOT NULL))
);

INSERT INTO escala_score_test.weights VALUES
('score-v1', 30, 20, 15, 15, 10, 5, 5),
('score-v2', 35, 15, 15, 15, 10, 5, 5);

INSERT INTO escala_score_test.score_runs (id, rule_set_version, snapshot_reference) VALUES
('90000000-0000-0000-0000-000000000001', 'score-v1', 'snapshot-2026-09-10-v1'),
('90000000-0000-0000-0000-000000000002', 'score-v2', 'snapshot-2026-09-10-v2');

INSERT INTO escala_score_test.candidates VALUES
('10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',true,0,'eligible',1,1,1,1,1,1,'homologated',1),
('10000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000002',true,0,'eligible',1,1,1,1,1,1,'homologated',1),
('10000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000003',true,0,'eligible',0,1,1,1,1,1,'homologated',1),
('10000000-0000-0000-0000-000000000004','50000000-0000-0000-0000-000000000004',true,0,'ineligible',1,1,1,1,1,1,'homologated',1),
('10000000-0000-0000-0000-000000000005','50000000-0000-0000-0000-000000000005',true,1,'eligible',1,1,1,1,1,1,'homologated',1),
('10000000-0000-0000-0000-000000000006','50000000-0000-0000-0000-000000000006',true,3,'eligible',1,1,1,1,1,1,'homologated',1),
('10000000-0000-0000-0000-000000000007','50000000-0000-0000-0000-000000000007',true,0,'eligible',1,1,1,1,1,1,'not_available',1),
('10000000-0000-0000-0000-000000000008','50000000-0000-0000-0000-000000000008',true,0,'eligible',0.5,1,1,1,1,1,'homologated',1),
('10000000-0000-0000-0000-000000000009','50000000-0000-0000-0000-000000000009',true,0,'eligible',0.5,0,1,1,1,1,'homologated',1);

CREATE OR REPLACE FUNCTION escala_score_test.effective_proximity(p_candidate_id uuid)
RETURNS numeric LANGUAGE sql AS $$
  SELECT CASE WHEN proximity_evidence_status='homologated' THEN proximity ELSE 0 END
  FROM escala_score_test.candidates WHERE id=p_candidate_id;
$$;

CREATE OR REPLACE FUNCTION escala_score_test.calculate_score(p_candidate_id uuid, p_rule_set_version text)
RETURNS numeric LANGUAGE sql AS $$
  SELECT round(c.component_match*w.component_weight+c.area_match*w.area_weight+c.availability_fit*w.availability_weight+c.continuity*w.continuity_weight+c.distribution_balance*w.distribution_weight+escala_score_test.effective_proximity(c.id)*w.proximity_weight+c.institutional_preference*w.preference_weight,3)
  FROM escala_score_test.candidates c JOIN escala_score_test.weights w ON w.rule_set_version=p_rule_set_version
  WHERE c.id=p_candidate_id AND c.eligibility_status='eligible';
$$;

-- v1: only eligible candidates enter scoring/ranking.
WITH calculated AS (
 SELECT c.*, escala_score_test.calculate_score(c.id,'score-v1') score FROM escala_score_test.candidates c WHERE c.eligibility_status='eligible'
), ranked AS (
 SELECT *, row_number() OVER (ORDER BY score DESC,component_match DESC,area_match DESC,continuity DESC,valid_substitutions_count ASC,teacher_id ASC) rank_position FROM calculated
)
INSERT INTO escala_score_test.scores
SELECT '90000000-0000-0000-0000-000000000001',candidate_id,score,'ranked',rank_position,
 round(component_match*w.component_weight,3),round(area_match*w.area_weight,3),round(availability_fit*w.availability_weight,3),round(continuity*w.continuity_weight,3),round(distribution_balance*w.distribution_weight,3),round(escala_score_test.effective_proximity(candidate_id)*w.proximity_weight,3),round(institutional_preference*w.preference_weight,3),
 jsonb_build_object('rule_set_version','score-v1','criteria',jsonb_build_array(
 jsonb_build_object('code','SCORE-01','weight',w.component_weight,'normalized_value',component_match),
 jsonb_build_object('code','SCORE-02','weight',w.area_weight,'normalized_value',area_match),
 jsonb_build_object('code','SCORE-03','weight',w.availability_weight,'normalized_value',availability_fit),
 jsonb_build_object('code','SCORE-04','weight',w.continuity_weight,'normalized_value',continuity),
 jsonb_build_object('code','SCORE-05','weight',w.distribution_weight,'normalized_value',distribution_balance),
 jsonb_build_object('code','SCORE-06','weight',w.proximity_weight,'normalized_value',escala_score_test.effective_proximity(candidate_id),'evidence_status',proximity_evidence_status,'reason_code',CASE WHEN proximity_evidence_status<>'homologated' THEN 'PROXIMITY_NOT_AVAILABLE' ELSE NULL END),
 jsonb_build_object('code','SCORE-07','weight',w.preference_weight,'normalized_value',institutional_preference)))
FROM ranked r JOIN escala_score_test.weights w ON w.rule_set_version='score-v1';

INSERT INTO escala_score_test.scores (run_id,candidate_id,score,ranking_status,rank_position,score_breakdown)
VALUES ('90000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004',NULL,'excluded',NULL,NULL);

CREATE TEMP TABLE escala_score_test.v1_history AS SELECT candidate_id,score,ranking_status,rank_position,score_breakdown FROM escala_score_test.scores WHERE run_id='90000000-0000-0000-0000-000000000001';

-- v2: same source snapshot, controlled weight change, detailed explanation preserved.
WITH calculated AS (
 SELECT c.*, escala_score_test.calculate_score(c.id,'score-v2') score FROM escala_score_test.candidates c WHERE c.eligibility_status='eligible'
), ranked AS (
 SELECT *, row_number() OVER (ORDER BY score DESC,component_match DESC,area_match DESC,continuity DESC,valid_substitutions_count ASC,teacher_id ASC) rank_position FROM calculated
)
INSERT INTO escala_score_test.scores
SELECT '90000000-0000-0000-0000-000000000002',candidate_id,score,'ranked',rank_position,
 round(component_match*w.component_weight,3),round(area_match*w.area_weight,3),round(availability_fit*w.availability_weight,3),round(continuity*w.continuity_weight,3),round(distribution_balance*w.distribution_weight,3),round(escala_score_test.effective_proximity(candidate_id)*w.proximity_weight,3),round(institutional_preference*w.preference_weight,3),
 jsonb_build_object('rule_set_version','score-v2','criteria',jsonb_build_array(
 jsonb_build_object('code','SCORE-01','weight',w.component_weight,'normalized_value',component_match),jsonb_build_object('code','SCORE-02','weight',w.area_weight,'normalized_value',area_match),jsonb_build_object('code','SCORE-03','weight',w.availability_weight,'normalized_value',availability_fit),jsonb_build_object('code','SCORE-04','weight',w.continuity_weight,'normalized_value',continuity),jsonb_build_object('code','SCORE-05','weight',w.distribution_weight,'normalized_value',distribution_balance),jsonb_build_object('code','SCORE-06','weight',w.proximity_weight,'normalized_value',escala_score_test.effective_proximity(candidate_id),'evidence_status',proximity_evidence_status,'reason_code',CASE WHEN proximity_evidence_status<>'homologated' THEN 'PROXIMITY_NOT_AVAILABLE' ELSE NULL END),jsonb_build_object('code','SCORE-07','weight',w.preference_weight,'normalized_value',institutional_preference)))
FROM ranked r JOIN escala_score_test.weights w ON w.rule_set_version='score-v2';

DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM escala_score_test.weights WHERE component_weight+area_weight+availability_weight+continuity_weight+distribution_weight+proximity_weight+preference_weight<>100) THEN RAISE EXCEPTION 'GATE-01 failed'; END IF;
 IF EXISTS (SELECT 1 FROM escala_score_test.scores WHERE score IS NOT NULL AND (score<0 OR score>100)) THEN RAISE EXCEPTION 'GATE-02 failed'; END IF;
 IF EXISTS (SELECT 1 FROM escala_score_test.scores s JOIN escala_score_test.candidates c ON c.id=s.candidate_id WHERE c.eligibility_status<>'eligible' AND (s.score IS NOT NULL OR s.rank_position IS NOT NULL OR s.ranking_status IN ('scored','ranked'))) THEN RAISE EXCEPTION 'GATE-03 failed'; END IF;
 IF EXISTS (SELECT 1 FROM escala_score_test.scores WHERE score IS NOT NULL AND score<>component_contribution+area_contribution+availability_contribution+continuity_contribution+distribution_contribution+proximity_contribution+preference_contribution) THEN RAISE EXCEPTION 'GATE-04 failed'; END IF;
 IF escala_score_test.calculate_score('10000000-0000-0000-0000-000000000002','score-v1')<=escala_score_test.calculate_score('10000000-0000-0000-0000-000000000003','score-v1') THEN RAISE EXCEPTION 'GATE-05 failed'; END IF;
 IF escala_score_test.calculate_score('10000000-0000-0000-0000-000000000007','score-v1')>=escala_score_test.calculate_score('10000000-0000-0000-0000-000000000001','score-v1') THEN RAISE EXCEPTION 'GATE-06 failed'; END IF;
 IF (SELECT proximity_contribution FROM escala_score_test.scores WHERE run_id='90000000-0000-0000-0000-000000000001' AND candidate_id='10000000-0000-0000-0000-000000000007')<>0 THEN RAISE EXCEPTION 'GATE-06 contribution failed'; END IF;
 IF (SELECT score FROM escala_score_test.scores WHERE run_id='90000000-0000-0000-0000-000000000001' AND candidate_id='10000000-0000-0000-0000-000000000007')<>95 THEN RAISE EXCEPTION 'GATE-06 expected score 95'; END IF;
 IF (SELECT candidate_id FROM escala_score_test.scores WHERE run_id='90000000-0000-0000-0000-000000000001' AND rank_position=(SELECT min(rank_position) FROM escala_score_test.scores WHERE run_id='90000000-0000-0000-0000-000000000001' AND candidate_id IN ('10000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000006')))<>'10000000-0000-0000-0000-000000000005' THEN RAISE EXCEPTION 'GATE-07 failed: fewer valid substitutions must win tie'; END IF;
 IF NOT EXISTS (SELECT 1 FROM escala_score_test.score_runs WHERE id='90000000-0000-0000-0000-000000000001' AND rule_set_version='score-v1' AND snapshot_reference='snapshot-2026-09-10-v1') OR NOT EXISTS (SELECT 1 FROM escala_score_test.score_runs WHERE id='90000000-0000-0000-0000-000000000002' AND rule_set_version='score-v2' AND snapshot_reference='snapshot-2026-09-10-v2') THEN RAISE EXCEPTION 'GATE-08 failed'; END IF;
 IF EXISTS (SELECT 1 FROM escala_score_test.scores WHERE score_breakdown IS NOT NULL AND jsonb_array_length(score_breakdown->'criteria')<>7) THEN RAISE EXCEPTION 'GATE-04 explanation failed'; END IF;
 IF escala_score_test.calculate_score('10000000-0000-0000-0000-000000000008','score-v1')=escala_score_test.calculate_score('10000000-0000-0000-0000-000000000008','score-v2') THEN RAISE EXCEPTION 'GATE-10 failed'; END IF;
 IF EXISTS (SELECT 1 FROM escala_score_test.v1_history h JOIN escala_score_test.scores s ON s.run_id='90000000-0000-0000-0000-000000000001' AND s.candidate_id=h.candidate_id WHERE h.score IS DISTINCT FROM s.score OR h.ranking_status IS DISTINCT FROM s.ranking_status OR h.rank_position IS DISTINCT FROM s.rank_position OR h.score_breakdown IS DISTINCT FROM s.score_breakdown) THEN RAISE EXCEPTION 'GATE-11 failed'; END IF;
 IF (SELECT score_breakdown #>> '{criteria,5,reason_code}' FROM escala_score_test.scores WHERE run_id='90000000-0000-0000-0000-000000000001' AND candidate_id='10000000-0000-0000-0000-000000000007')<>'PROXIMITY_NOT_AVAILABLE' THEN RAISE EXCEPTION 'GATE-12 failed'; END IF;
 IF EXISTS (SELECT run_id,candidate_id,count(*) FROM escala_score_test.scores GROUP BY run_id,candidate_id HAVING count(*)>1) OR (SELECT count(*) FROM escala_score_test.scores WHERE candidate_id='10000000-0000-0000-0000-000000000008')<>2 THEN RAISE EXCEPTION 'GATE-13 failed'; END IF;
END $$;

ROLLBACK;
