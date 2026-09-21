-- Escala de Substituição — ledger sintético de eventos da rodada v1
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Não usa schema, IDs ou dados reais da SED.
--
-- Objetivo:
-- 1) garantir que a linha do tempo seja reconstruível por eventos;
-- 2) preservar a recomendação algorítmica após intervenção humana;
-- 3) registrar invalidação material sem apagar o histórico;
-- 4) impedir que uma rodada inválida seja tratada como confirmada.

BEGIN;

CREATE TEMP TABLE event_ledger (
  sequence_no INTEGER PRIMARY KEY,
  occurrence_id TEXT NOT NULL,
  round_version INTEGER NOT NULL,
  snapshot_version TEXT NOT NULL,
  event_type TEXT NOT NULL,
  previous_teacher TEXT,
  new_teacher TEXT,
  decision_source TEXT NOT NULL,
  validation_state TEXT NOT NULL,
  reason TEXT
) ON COMMIT DROP;

-- R01: recomendação inicial do algoritmo.
INSERT INTO event_ledger VALUES
  (1, 'O1', 1, 'SNAP-001', 'ROUND_RECOMMENDED',
   NULL, 'P1', 'ALGORITHM', 'VALIDATION_REQUIRED', 'initial recommendation');

-- Alteração material: a rodada vigente deixa de ser confirmável.
INSERT INTO event_ledger VALUES
  (2, 'O1', 1, 'SNAP-001', 'MATERIAL_CHANGE',
   'P1', NULL, 'SYSTEM', 'STALE', 'availability changed');

-- R02: algoritmo recalcula a ocorrência após a alteração.
INSERT INTO event_ledger VALUES
  (3, 'O1', 2, 'SNAP-002', 'ROUND_RECALCULATED',
   NULL, 'P1', 'ALGORITHM', 'VALIDATION_REQUIRED', 'recalculated from new snapshot');

-- Decisão humana preserva a recomendação P1 e registra P2 separadamente.
INSERT INTO event_ledger VALUES
  (4, 'O1', 2, 'SNAP-002', 'HUMAN_OVERRIDE',
   'P1', 'P2', 'HUMAN', 'HUMAN_OVERRIDDEN', 'operational decision');

-- A validação posterior deve se referir à decisão humana, não apagar o evento anterior.
INSERT INTO event_ledger VALUES
  (5, 'O1', 2, 'SNAP-002', 'VALIDATED',
   'P1', 'P2', 'HUMAN', 'VALIDATED', 'human validation recorded');

-- 1. A sequência temporal é reconstruível.
SELECT CASE
  WHEN (SELECT string_agg(event_type, '>' ORDER BY sequence_no)
        FROM event_ledger WHERE occurrence_id='O1')
       = 'ROUND_RECOMMENDED>MATERIAL_CHANGE>ROUND_RECALCULATED>HUMAN_OVERRIDE>VALIDATED'
  THEN 'PASS_TIMELINE_RECONSTRUCTIBLE'
  ELSE 'FAIL_TIMELINE_RECONSTRUCTIBLE'
END AS assertion;

-- 2. O override preserva a recomendação original.
SELECT CASE
  WHEN (SELECT previous_teacher FROM event_ledger
        WHERE event_type='HUMAN_OVERRIDE' AND occurrence_id='O1')='P1'
   AND (SELECT new_teacher FROM event_ledger
        WHERE event_type='HUMAN_OVERRIDE' AND occurrence_id='O1')='P2'
  THEN 'PASS_HUMAN_OVERRIDE_PRESERVES_ORIGINAL'
  ELSE 'FAIL_HUMAN_OVERRIDE_PRESERVES_ORIGINAL'
END AS assertion;

-- 3. A alteração material deixa a rodada 1 em estado não confirmável.
SELECT CASE
  WHEN (SELECT validation_state FROM event_ledger
        WHERE event_type='MATERIAL_CHANGE' AND round_version=1)='STALE'
  THEN 'PASS_MATERIAL_CHANGE_INVALIDATES_ROUND'
  ELSE 'FAIL_MATERIAL_CHANGE_INVALIDATES_ROUND'
END AS assertion;

-- 4. A validação final pertence à nova rodada e à decisão humana.
SELECT CASE
  WHEN (SELECT round_version FROM event_ledger WHERE event_type='VALIDATED')=2
   AND (SELECT decision_source FROM event_ledger WHERE event_type='VALIDATED')='HUMAN'
   AND (SELECT new_teacher FROM event_ledger WHERE event_type='VALIDATED')='P2'
  THEN 'PASS_VALIDATION_BINDS_TO_NEW_DECISION'
  ELSE 'FAIL_VALIDATION_BINDS_TO_NEW_DECISION'
END AS assertion;

-- 5. Nenhum evento sintético produz estado oficial.
SELECT CASE
  WHEN NOT EXISTS (
    SELECT 1 FROM event_ledger
    WHERE validation_state IN ('OFFICIAL_CONFIRMED', 'OFFICIAL_PENDING')
  )
  THEN 'PASS_NO_OFFICIAL_STATE_SYNTHETIC'
  ELSE 'FAIL_NO_OFFICIAL_STATE_SYNTHETIC'
END AS assertion;

ROLLBACK;

-- Este harness valida apenas o contrato lógico do ledger de auditoria.
-- Não valida integração, identidade ou confirmação oficial da SED.
