-- Escala de Substituição — contrato sintético de persistência de rodada v1
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Não usa schema, IDs ou dados reais da SED.
-- Objetivo: garantir que uma nova decisão/rodada não sobrescreva a recomendação
-- algorítmica original e que override e invalidação permaneçam auditáveis.

BEGIN;

CREATE TEMP TABLE round_history (
  run_id TEXT,
  round_version INTEGER,
  snapshot_version TEXT,
  occurrence_id TEXT,
  algorithm_teacher TEXT,
  algorithm_score INTEGER,
  algorithm_state TEXT,
  human_teacher TEXT,
  human_state TEXT,
  round_state TEXT
) ON COMMIT DROP;

-- Rodada 1: recomendação algorítmica original.
INSERT INTO round_history VALUES
  ('RUN-001', 1, 'SNAP-001', 'O1', 'P1', 95,
   'RECOMMENDATION_READY', NULL, NULL, 'VALIDATION_PENDING');

-- Rodada 2: mesma ocorrência, com decisão humana P2.
-- A recomendação algorítmica original é copiada como histórico da rodada,
-- enquanto a decisão humana ocupa campos distintos.
INSERT INTO round_history VALUES
  ('RUN-001', 2, 'SNAP-002', 'O1', 'P1', 95,
   'RECOMMENDATION_READY', 'P2', 'HUMAN_OVERRIDDEN', 'HUMAN_DECISION_RECORDED');

-- 1. A rodada anterior continua intacta.
SELECT CASE
  WHEN (SELECT algorithm_teacher FROM round_history
        WHERE round_version=1 AND occurrence_id='O1')='P1'
   AND (SELECT algorithm_score FROM round_history
        WHERE round_version=1 AND occurrence_id='O1')=95
   AND (SELECT human_teacher FROM round_history
        WHERE round_version=1 AND occurrence_id='O1') IS NULL
  THEN 'PASS_ROUND_1_IMMUTABLE'
  ELSE 'FAIL_ROUND_1_IMMUTABLE'
END AS assertion;

-- 2. O override é persistido separadamente da recomendação.
SELECT CASE
  WHEN (SELECT algorithm_teacher FROM round_history
        WHERE round_version=2 AND occurrence_id='O1')='P1'
   AND (SELECT human_teacher FROM round_history
        WHERE round_version=2 AND occurrence_id='O1')='P2'
   AND (SELECT human_state FROM round_history
        WHERE round_version=2 AND occurrence_id='O1')='HUMAN_OVERRIDDEN'
  THEN 'PASS_OVERRIDE_STORED_SEPARATELY'
  ELSE 'FAIL_OVERRIDE_STORED_SEPARATELY'
END AS assertion;

-- 3. A nova rodada não substitui a rodada anterior: ambas permanecem
-- reconstruíveis para a mesma ocorrência.
SELECT CASE
  WHEN (SELECT COUNT(*) FROM round_history WHERE occurrence_id='O1')=2
   AND (SELECT COUNT(*) FROM round_history WHERE round_version IN (1,2))=2
  THEN 'PASS_HISTORICAL_ROUNDS_RECONSTRUCTIBLE'
  ELSE 'FAIL_HISTORICAL_ROUNDS_RECONSTRUCTIBLE'
END AS assertion;

-- 4. Invalidação gera uma nova rodada/evento e não altera o registro anterior.
INSERT INTO round_history VALUES
  ('RUN-001', 3, 'SNAP-003', 'O1', 'P3', 88,
   'RECOMMENDATION_READY', NULL, NULL, 'RECALCULATED_AFTER_INVALIDATION');

SELECT CASE
  WHEN (SELECT algorithm_teacher FROM round_history
        WHERE round_version=1 AND occurrence_id='O1')='P1'
   AND (SELECT algorithm_teacher FROM round_history
        WHERE round_version=2 AND occurrence_id='O1')='P1'
   AND (SELECT algorithm_teacher FROM round_history
        WHERE round_version=3 AND occurrence_id='O1')='P3'
   AND (SELECT COUNT(*) FROM round_history WHERE occurrence_id='O1')=3
  THEN 'PASS_INVALIDATION_CREATES_NEW_HISTORICAL_ROUND'
  ELSE 'FAIL_INVALIDATION_CREATES_NEW_HISTORICAL_ROUND'
END AS assertion;

-- 5. Nenhuma rodada histórica pode ser identificada apenas pela ocorrência:
-- a versão da rodada é parte da identidade auditável.
SELECT CASE
  WHEN (SELECT COUNT(DISTINCT round_version) FROM round_history
        WHERE occurrence_id='O1')=3
  THEN 'PASS_ROUND_VERSION_PART_OF_IDENTITY'
  ELSE 'FAIL_ROUND_VERSION_PART_OF_IDENTITY'
END AS assertion;

ROLLBACK;

-- O teste é intencionalmente sintético. Ele valida o contrato lógico de
-- persistência; não valida integração com SED nem DDL de produção.