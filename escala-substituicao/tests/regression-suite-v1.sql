-- Escala de Substituição — suite agregadora de regressão v1
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Este arquivo não executa SQL externo nem depende de schema de produção.
-- Ele funciona como manifesto executável/documental da bateria mínima.

WITH test_registry AS (
  SELECT * FROM (VALUES
    ('R01','tests/global-allocation-adversarial-v1.sql','CASO 1','critical','coverage'),
    ('R02','tests/global-allocation-adversarial-v1.sql','CASO 2','critical','determinism'),
    ('R03','tests/global-allocation-adversarial-v1.sql','CASO 3','critical','temporal_conflict'),
    ('R04','tests/global-allocation-adversarial-v1.sql','CASO 4','critical','eligibility'),
    ('R05','tests/global-allocation-adversarial-v1.sql','CASO 4','critical','availability'),
    ('R06','tests/global-allocation-adversarial-v1.sql','CASO 5','critical','uncovered'),
    ('R07','tests/global-allocation-adversarial-v1.sql','CASO 6','critical','hard_constraints'),
    ('R08','tests/global-allocation-adversarial-v1.sql','CASO 7','high','explainability'),
    ('R09','tests/global-allocation-determinism-v1.sql','principal','high','reproducibility'),
    ('R10','tests/human-override-preservation-v1.sql','principal','high','human_governance')
  ) v(test_id,harness,test_case,severity,invariant)
)
SELECT
  COUNT(*) AS total_regression_cases,
  COUNT(*) FILTER (WHERE severity='critical') AS critical_cases,
  COUNT(*) FILTER (WHERE severity='high') AS high_cases,
  COUNT(DISTINCT harness) AS harnesses,
  CASE WHEN COUNT(*)=10 THEN 'PASS_REGRESSION_REGISTRY_COMPLETE'
       ELSE 'FAIL_REGRESSION_REGISTRY_COMPLETE' END AS assertion
FROM test_registry;

-- O runner futuro deverá executar os arquivos referenciados acima e substituir
-- o manifesto por evidências reais de execução. Até lá, esta suite não declara
-- PASS global de execução; ela apenas garante que R01–R10 estão registrados.

-- Critério de promoção:
-- qualquer falha crítica R01/R03/R04/R05/R06/R07 bloqueia a promoção.
-- qualquer falha R02/R08/R09/R10 também impede declarar a suíte íntegra.
-- GATE-FONTE-SED continua independente desta bateria e permanece RED/BLOCKED.