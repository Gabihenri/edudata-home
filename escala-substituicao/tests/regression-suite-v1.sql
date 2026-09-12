-- Escala de Substituição — suite agregadora de regressão v1
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Manifesto central da bateria R01–R13; não executa SQL externo.

WITH test_registry AS (
  SELECT * FROM (VALUES
    ('R01','tests/global-allocation-adversarial-v1.sql','CASO 1','critical','coverage'),
    ('R02','tests/global-allocation-adversarial-v1.sql','CASO 2','high','determinism'),
    ('R03','tests/global-allocation-adversarial-v1.sql','CASO 3','critical','temporal_conflict'),
    ('R04','tests/global-allocation-adversarial-v1.sql','CASO 4','critical','eligibility'),
    ('R05','tests/global-allocation-adversarial-v1.sql','CASO 4','critical','availability'),
    ('R06','tests/global-allocation-adversarial-v1.sql','CASO 5','critical','uncovered'),
    ('R07','tests/global-allocation-adversarial-v1.sql','CASO 6','critical','hard_constraints'),
    ('R08','tests/global-allocation-adversarial-v1.sql','CASO 7','high','explainability'),
    ('R09','tests/global-allocation-reproducibility-v1.sql','principal','high','global_plan_reproducibility'),
    ('R10','tests/human-override-preservation-v1.sql','principal','high','human_governance'),
    ('R11','tests/snapshot-reexecution-v1.sql','principal','critical','material_change_reexecution'),
    ('R12','tests/snapshot-change-state-v1.sql','principal','critical','change_state_safety'),
    ('R13','tests/round-persistence-v1.sql','principal','critical','round_persistence')
  ) v(test_id,harness,test_case,severity,invariant)
)
SELECT
  COUNT(*) AS total_regression_cases,
  COUNT(*) FILTER (WHERE severity='critical') AS critical_cases,
  COUNT(*) FILTER (WHERE severity='high') AS high_cases,
  COUNT(DISTINCT harness) AS harnesses,
  CASE WHEN COUNT(*)=13 AND COUNT(DISTINCT harness)=7
       THEN 'PASS_REGRESSION_REGISTRY_COMPLETE'
       ELSE 'FAIL_REGRESSION_REGISTRY_COMPLETE' END AS assertion
FROM test_registry;

-- O runner deve executar os sete harnesses referenciados e registrar evidência
-- de cada caso. Esta suite, isoladamente, é um manifesto e não declara PASS
-- da execução dos harnesses.

-- R13 cobre especificamente:
-- 1. preservação da recomendação algorítmica original;
-- 2. persistência separada da decisão humana;
-- 3. reconstrução de rodadas históricas por ocorrência;
-- 4. criação de nova rodada após invalidação sem mutação retroativa;
-- 5. identidade auditável da rodada.

-- Critério de promoção:
-- qualquer falha crítica R01/R03/R04/R05/R06/R07/R11/R12/R13 bloqueia a promoção.
-- qualquer falha R02/R08/R09/R10 também impede declarar a suíte íntegra.
-- GATE-FONTE-SED continua independente desta bateria e permanece RED/BLOCKED.