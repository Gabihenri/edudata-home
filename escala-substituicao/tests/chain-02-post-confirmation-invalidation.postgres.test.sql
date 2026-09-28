-- Escala Inteligente EDI — CHAIN-02
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Prova a invalidação/reversão após uma decisão já confirmada.
--
-- Regra central:
-- confirmação histórica NÃO é apagada nem reescrita quando a ausência
-- posteriormente é cancelada.
--
-- O harness não escolhe o estado físico definitivo da vaga após a
-- invalidação. Ele registra o evento de invalidação e preserva a decisão
-- original para auditoria.

BEGIN;

CREATE TEMP TABLE chain02_decisions (
  decision_id text PRIMARY KEY,
  vacancy_id text NOT NULL,
  substitution_id text NOT NULL,
  round_id text NOT NULL,
  state text NOT NULL,
  teacher_id text NOT NULL,
  confirmed_by text,
  confirmed_at timestamp,
  invalidated_at timestamp,
  invalidated_by text,
  invalidation_reason text,
  causative_event_id text
) ON COMMIT DROP;

CREATE TEMP TABLE chain02_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  entity_id text NOT NULL,
  previous_state text,
  new_state text NOT NULL,
  actor text NOT NULL,
  reason_code text,
  causative_event_id text,
  event_at timestamp NOT NULL
) ON COMMIT DROP;

-- ------------------------------------------------
-- 1. Estado inicial: substituição CONFIRMED.
-- ------------------------------------------------
INSERT INTO chain02_decisions (
  decision_id,vacancy_id,substitution_id,round_id,state,teacher_id,
  confirmed_by,confirmed_at
) VALUES (
  'D1','V1','S1','R1','CONFIRMED','P1',
  'COORD-1','2026-09-28 08:10'
);

INSERT INTO chain02_events (
  event_id,event_type,entity_id,previous_state,new_state,actor,
  reason_code,causative_event_id,event_at
) VALUES (
  'E1','SUBSTITUTION_CONFIRMED','S1','PENDING','CONFIRMED',
  'COORD-1','AUTHORIZED_HUMAN_CONFIRMATION',NULL,'2026-09-28 08:10'
);

SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM chain02_decisions
    WHERE decision_id='D1'
      AND state='CONFIRMED'
      AND teacher_id='P1'
      AND confirmed_by='COORD-1'
  )
  THEN 'PASS_CHAIN02_INITIAL_CONFIRMATION'
  ELSE 'FAIL_CHAIN02_INITIAL_CONFIRMATION'
END AS assertion;

-- ------------------------------------------------
-- 2. Evento causador: ausência A1 é CANCELLED.
-- ------------------------------------------------
INSERT INTO chain02_events (
  event_id,event_type,entity_id,previous_state,new_state,actor,
  reason_code,causative_event_id,event_at
) VALUES (
  'E2','ABSENCE_CANCELLED','A1','CONFIRMED','CANCELLED',
  'COORD-1','ABSENCE_CANCELLED_AFTER_CONFIRMATION',NULL,'2026-09-28 09:00'
);

SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM chain02_events
    WHERE event_id='E2'
      AND event_type='ABSENCE_CANCELLED'
      AND previous_state='CONFIRMED'
      AND new_state='CANCELLED'
  )
  THEN 'PASS_CHAIN02_CAUSATIVE_ABSENCE_CANCELLATION'
  ELSE 'FAIL_CHAIN02_CAUSATIVE_ABSENCE_CANCELLATION'
END AS assertion;

-- ------------------------------------------------
-- 3. Decisão histórica não é sobrescrita: registra invalidação.
-- ------------------------------------------------
UPDATE chain02_decisions
SET state='INVALIDATED',
    invalidated_at='2026-09-28 09:01',
    invalidated_by='COORD-1',
    invalidation_reason='ABSENCE_CANCELLED_AFTER_CONFIRMATION',
    causative_event_id='E2'
WHERE decision_id='D1'
  AND state='CONFIRMED';

INSERT INTO chain02_events (
  event_id,event_type,entity_id,previous_state,new_state,actor,
  reason_code,causative_event_id,event_at
) VALUES (
  'E3','SUBSTITUTION_INVALIDATED','S1','CONFIRMED','INVALIDATED',
  'COORD-1','ABSENCE_CANCELLED_AFTER_CONFIRMATION','E2','2026-09-28 09:01'
);

SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM chain02_decisions
    WHERE decision_id='D1'
      AND state='INVALIDATED'
      AND invalidated_by='COORD-1'
      AND invalidated_at='2026-09-28 09:01'
      AND invalidation_reason='ABSENCE_CANCELLED_AFTER_CONFIRMATION'
      AND causative_event_id='E2'
  )
  THEN 'PASS_CHAIN02_INVALIDATION_RECORDED'
  ELSE 'FAIL_CHAIN02_INVALIDATION_RECORDED'
END AS assertion;

-- ------------------------------------------------
-- 4. Registro original permanece no ledger de eventos.
-- ------------------------------------------------
SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM chain02_events
    WHERE event_id='E1'
      AND event_type='SUBSTITUTION_CONFIRMED'
      AND previous_state='PENDING'
      AND new_state='CONFIRMED'
      AND actor='COORD-1'
  )
  AND EXISTS (
    SELECT 1 FROM chain02_events
    WHERE event_id='E3'
      AND event_type='SUBSTITUTION_INVALIDATED'
      AND previous_state='CONFIRMED'
      AND new_state='INVALIDATED'
  )
  THEN 'PASS_CHAIN02_ORIGINAL_DECISION_HISTORY_PRESERVED'
  ELSE 'FAIL_CHAIN02_ORIGINAL_DECISION_HISTORY_PRESERVED'
END AS assertion;

-- ------------------------------------------------
-- 5. A invalidação deve referenciar a decisão original.
-- ------------------------------------------------
SELECT CASE
  WHEN (
    SELECT causative_event_id
    FROM chain02_decisions
    WHERE decision_id='D1'
  ) = 'E2'
  AND EXISTS (
    SELECT 1 FROM chain02_events
    WHERE event_id='E3'
      AND causative_event_id='E2'
  )
  THEN 'PASS_CHAIN02_CAUSAL_REFERENCE'
  ELSE 'FAIL_CHAIN02_CAUSAL_REFERENCE'
END AS assertion;

-- ------------------------------------------------
-- 6. O motivo não pode desaparecer.
-- ------------------------------------------------
SELECT CASE
  WHEN (
    SELECT invalidation_reason
    FROM chain02_decisions
    WHERE decision_id='D1'
  ) = 'ABSENCE_CANCELLED_AFTER_CONFIRMATION'
  AND EXISTS (
    SELECT 1 FROM chain02_events
    WHERE event_id='E3'
      AND reason_code='ABSENCE_CANCELLED_AFTER_CONFIRMATION'
  )
  THEN 'PASS_CHAIN02_REASON_PRESERVED'
  ELSE 'FAIL_CHAIN02_REASON_PRESERVED'
END AS assertion;

-- ------------------------------------------------
-- 7. Não escolher estado físico definitivo da vaga.
-- ------------------------------------------------
-- A decisão fica INVALIDATED; o harness deliberadamente não executa
-- OPEN/ALLOCATED/CANCELLED sobre VACANCY. Isso evita antecipar o contrato
-- físico definitivo identificado na auditoria.
SELECT CASE
  WHEN NOT EXISTS (
    SELECT 1 FROM chain02_events
    WHERE entity_id='V1'
      AND event_type IN ('VACANCY_REOPENED','VACANCY_CANCELLED','VACANCY_ALLOCATED')
  )
  THEN 'PASS_CHAIN02_VACANCY_PHYSICAL_STATE_NOT_INFERRED'
  ELSE 'FAIL_CHAIN02_VACANCY_PHYSICAL_STATE_NOT_INFERRED'
END AS assertion;

-- ------------------------------------------------
-- 8. Uma decisão INVALIDATED não pode voltar a CONFIRMED no mesmo registro.
-- ------------------------------------------------
SELECT CASE
  WHEN NOT EXISTS (
    SELECT 1
    FROM chain02_events
    WHERE entity_id='S1'
      AND previous_state='INVALIDATED'
      AND new_state='CONFIRMED'
  )
  THEN 'PASS_CHAIN02_INVALIDATED_NOT_RECONFIRMED'
  ELSE 'FAIL_CHAIN02_INVALIDATED_NOT_RECONFIRMED'
END AS assertion;

-- ------------------------------------------------
-- 9. Nova decisão, se necessária, deve ser outro registro/rodada.
-- ------------------------------------------------
CREATE TEMP TABLE chain02_new_decision (
  decision_id text PRIMARY KEY,
  substitution_id text NOT NULL,
  round_id text NOT NULL,
  state text NOT NULL,
  supersedes_decision_id text
) ON COMMIT DROP;

INSERT INTO chain02_new_decision VALUES
  ('D2','S2','R2','PENDING','D1');

SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM chain02_new_decision
    WHERE decision_id='D2'
      AND substitution_id <> 'S1'
      AND round_id <> 'R1'
      AND supersedes_decision_id='D1'
      AND state='PENDING'
  )
  THEN 'PASS_CHAIN02_NEW_DECISION_IS_NEW_RECORD'
  ELSE 'FAIL_CHAIN02_NEW_DECISION_IS_NEW_RECORD'
END AS assertion;

-- ------------------------------------------------
-- 10. Evidência mínima de governança.
-- ------------------------------------------------
SELECT CASE
  WHEN (
    SELECT invalidated_by
    FROM chain02_decisions
    WHERE decision_id='D1'
  ) IS NOT NULL
  AND (
    SELECT invalidated_at
    FROM chain02_decisions
    WHERE decision_id='D1'
  ) IS NOT NULL
  AND (
    SELECT causative_event_id
    FROM chain02_decisions
    WHERE decision_id='D1'
  ) IS NOT NULL
  THEN 'PASS_CHAIN02_GOVERNANCE_FIELDS_PRESENT'
  ELSE 'FAIL_CHAIN02_GOVERNANCE_FIELDS_PRESENT'
END AS assertion;

COMMIT;

-- Critério:
-- PASS_* = invariante demonstrada pelo fixture.
-- FAIL_* = bloqueio da CHAIN-02.
-- A decisão original é preservada como evidência histórica.
-- O estado físico definitivo da vaga permanece deliberadamente fora do
-- contrato deste harness até homologação do modelo de produção.
-- GATE-FONTE-SED permanece RED/BLOCKED.
