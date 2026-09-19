-- Escala de Substituição — suite agregadora de regressão v1
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Manifesto central da bateria R01–R16; não executa SQL externo.

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
    ('R13','tests/round-persistence-v1.sql','principal','critical','round_persistence'),
    ('R14','tests/global-allocation-optimality-v1.sql','principal','critical','global_optimality'),
    ('R15','tests/global-allocation-adversarial-v1.sql','CASO 8','high','distinct_same_component_occurrences'),
    ('R16','tests/global-allocation-adversarial-v1.sql','CASO 9','high','multi_associated_teachers_context')
  ) v(test_id,harness,test_case,severity,invariant)
)
SELECT COUNT(*) AS total_regression_cases,
 COUNT(*) FILTER (WHERE severity='critical') AS critical_cases,
 COUNT(*) FILTER (WHERE severity='high') AS high_cases,
 COUNT(DISTINCT harness) AS harnesses,
 CASE WHEN COUNT(*)=16 AND COUNT(DISTINCT harness)=8
 THEN 'PASS_REGRESSION_REGISTRY_COMPLETE' ELSE 'FAIL_REGRESSION_REGISTRY_COMPLETE' END AS assertion
FROM test_registry;

-- BASELINE_HARNESS='tests/global-allocation-v1.sql'
-- O harness baseline é executado pelo runner e integra a cadeia estrutural,
-- embora não seja um caso R01–R16 do manifesto adversarial.

-- O runner deve executar os oito harnesses referenciados e registrar evidência
-- de cada caso. Esta suite, isoladamente, é um manifesto e não declara PASS
-- da execução dos harnesses.
-- R14 cobre cobertura primária, qualidade secundária, desempate determinístico,
-- restrições duras, não reutilização global e planos parcialmente descobertos.
-- R15 preserva ocorrências distintas do mesmo componente no mesmo dia.
-- R16 preserva contexto de múltiplos docentes sem converter associação em
-- responsabilidade efetiva.
-- Critério de promoção: falha em qualquer R01–R16 impede declarar a suíte íntegra.
-- GATE-FONTE-SED continua independente e RED/BLOCKED.
