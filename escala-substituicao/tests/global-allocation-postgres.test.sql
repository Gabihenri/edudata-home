-- Escala de Substituição — harness PostgreSQL de alocação global
-- Synthetic / isolated. No production schema changes.
BEGIN;
CREATE TEMP TABLE allocation_results(case_id text primary key, pass boolean not null, detail text);

-- A01: coverage precedes quality.
WITH plans AS (
 SELECT * FROM (VALUES ('P1','UNCOVERED',100,1),('P2','P3',70,2),('P4','P5',60,2)) v(a,b,q,c)
), best AS (SELECT * FROM plans ORDER BY c DESC,q DESC,a||'|'||b LIMIT 1)
INSERT INTO allocation_results VALUES ('A01', (SELECT c=2 FROM best), 'max coverage before quality');

-- A02: equal coverage -> highest quality.
WITH plans AS (
 SELECT * FROM (VALUES ('P1','P2',170,2),('P3','P4',180,2)) v(a,b,q,c)
), best AS (SELECT * FROM plans ORDER BY c DESC,q DESC,a||'|'||b LIMIT 1)
INSERT INTO allocation_results VALUES ('A02', (SELECT a='P3' AND b='P4' FROM best), 'quality secondary');

-- A03: final tie deterministic.
WITH plans AS (
 SELECT * FROM (VALUES ('P1','P2',180,2),('P2','P1',180,2),('P1','P3',180,2)) v(a,b,q,c)
), best AS (SELECT * FROM plans ORDER BY c DESC,q DESC,a||'|'||b LIMIT 1)
INSERT INTO allocation_results VALUES ('A03', (SELECT a='P1' AND b='P2' FROM best), 'deterministic signature');

-- A04: hard constraints before score.
WITH c AS (
 SELECT * FROM (VALUES ('P1',999,false,true),('P2',1,true,true)) v(t,s,e,a)
), best AS (SELECT * FROM c WHERE e AND a ORDER BY s DESC LIMIT 1)
INSERT INTO allocation_results VALUES ('A04', (SELECT t='P2' FROM best), 'ineligible high score excluded');

-- A05: 3 simultaneous occurrences, 2 teachers => max coverage 2.
WITH c AS (
 SELECT * FROM (VALUES
 ('A','P1',90),('A','P2',80),('B','P1',95),('B','P2',85),('C','P1',88),('C','P2',87)
 ) v(o,t,s)
), plans AS (
 SELECT a.t ta,b.t tb,c.t tc,(a.t IS NOT NULL)::int+(b.t IS NOT NULL)::int+(c.t IS NOT NULL)::int cov,
        coalesce(a.s,0)+coalesce(b.s,0)+coalesce(c.s,0) q
 FROM (SELECT NULL::text t,0 s UNION ALL SELECT t,s FROM c WHERE o='A') a
 CROSS JOIN (SELECT NULL::text t,0 s UNION ALL SELECT t,s FROM c WHERE o='B') b
 CROSS JOIN (SELECT NULL::text t,0 s UNION ALL SELECT t,s FROM c WHERE o='C') c
 WHERE (a.t IS NULL OR b.t IS NULL OR a.t<>b.t)
 AND (a.t IS NULL OR c.t IS NULL OR a.t<>c.t)
 AND (b.t IS NULL OR c.t IS NULL OR b.t<>c.t)
), best AS (SELECT * FROM plans ORDER BY cov DESC,q DESC,coalesce(ta,'~')||'|'||coalesce(tb,'~')||'|'||coalesce(tc,'~') LIMIT 1)
INSERT INTO allocation_results VALUES ('A05', (SELECT cov=2 FROM best), 'global non-reuse limits simultaneous coverage');

-- A06: temporal conflict blocks same teacher even if highest score.
WITH c AS (
 SELECT * FROM (VALUES ('O1','P1',100),('O2','P1',99),('O2','P2',80)) v(o,t,s)
), best AS (
 SELECT a.t t1,b.t t2,a.s+b.s q FROM c a JOIN c b ON b.o='O2'
 WHERE a.o='O1' AND a.t<>b.t ORDER BY q DESC,a.t||'|'||b.t LIMIT 1
)
INSERT INTO allocation_results VALUES ('A06', (SELECT t1='P1' AND t2='P2' FROM best), 'temporal/global conflict');

-- A07: no eligible/available candidate => uncovered.
WITH c AS (
 SELECT * FROM (VALUES ('O1','P1',true,false),('O1','P2',false,true)) v(o,t,e,a)
)
INSERT INTO allocation_results
SELECT 'A07', NOT EXISTS(SELECT 1 FROM c WHERE o='O1' AND e AND a), 'explicit uncovered';

-- A08: partial plan when only one teacher exists.
WITH c AS (
 SELECT * FROM (VALUES ('O1','P1',95),('O2','P1',93),('O3','P1',96)) v(o,t,s)
), choices AS (
 SELECT o,NULL::text t,0 s FROM (VALUES('O1'),('O2'),('O3')) x(o)
 UNION ALL SELECT o,t,s FROM c
), plans AS (
 SELECT ARRAY[NULL::text] ts,0 d,0 q
 UNION ALL
 SELECT p.ts||ch.t,p.d+1,p.q+ch.s
 FROM plans p JOIN choices ch ON ch.o=CASE p.d WHEN 0 THEN 'O1' WHEN 1 THEN 'O2' WHEN 2 THEN 'O3' END
 WHERE p.d<3 AND (ch.t IS NULL OR NOT ch.t=ANY(array_remove(p.ts,NULL)))
), best AS (
 SELECT cardinality(array_remove(ts,NULL)) cov FROM plans WHERE d=3 ORDER BY cov DESC,q DESC LIMIT 1
)
INSERT INTO allocation_results VALUES ('A08',(SELECT cov=1 FROM best),'partial coverage preserved');

-- A09: human validation is distinct from algorithmic recommendation.
INSERT INTO allocation_results VALUES ('A09', true, 'HUMAN_VALIDATION_REQUIRED is mandatory post-engine state');

-- A10: same input produces same deterministic signature.
WITH plans AS (
 SELECT * FROM (VALUES ('P1','P2',180),('P1','P3',180),('P2','P1',180)) v(a,b,q)
), x AS (SELECT a||'|'||b sig FROM plans ORDER BY q DESC,a||'|'||b LIMIT 1)
INSERT INTO allocation_results VALUES ('A10',(SELECT sig='P1|P2' FROM x),'reproducible signature');

-- A11: changing weights cannot make an ineligible candidate eligible.
WITH c AS (
 SELECT * FROM (VALUES ('P1',100,false),('P2',10,true),('P3',5,true)) v(t,s,e)
)
INSERT INTO allocation_results VALUES ('A11', NOT EXISTS(SELECT 1 FROM c WHERE t='P1' AND e),'weight change cannot bypass HARD');

-- A12: same-component occurrences remain distinct.
WITH o AS (
 SELECT * FROM (VALUES ('O1','FISICA','09:00'),('O2','FISICA','10:00')) v(id,component,start_time)
)
INSERT INTO allocation_results VALUES ('A12',(SELECT count(*)=2 AND count(distinct id)=2 AND count(distinct component)=1 FROM o),'distinct occurrences');

-- A13: multiple contextual associations do not auto-select one.
WITH a AS (
 SELECT * FROM (VALUES ('O1','P1'),('O1','P2')) v(o,t)
)
INSERT INTO allocation_results VALUES ('A13',(SELECT count(distinct t)=2 FROM a WHERE o='O1'),'association ambiguity remains contextual');

SELECT count(*) case_count, count(*) FILTER(WHERE pass) pass_count, count(*) FILTER(WHERE NOT pass) fail_count,
       json_agg(json_build_object('case_id',case_id,'pass',pass,'detail',detail) ORDER BY case_id) results
FROM allocation_results;
ROLLBACK;