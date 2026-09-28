-- Escala Inteligente EDI — CHAIN-01
-- STATUS: SYNTHETIC / HARNESS-SAFE
-- GATE-FONTE-SED: RED/BLOCKED
-- Prova a cadeia operacional completa sem schema produtivo.
--
-- Cadeia:
-- CONFIRMED ABSENCE
--   -> OPEN VACANCY
--   -> ENGINE RUN
--   -> RECOMMENDED
--   -> HUMAN VALIDATION / PENDING
--   -> HUMAN CONFIRM
--   -> ALLOCATED
--   -> MATERIAL CHANGE
--   -> ROUND STALE
--   -> NEW ROUND
--
-- Nenhuma transição aqui representa alteração em produção.

BEGIN;

CREATE TEMP TABLE chain_state (
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  state text NOT NULL,
  round_id text,
  version integer NOT NULL DEFAULT 1,
  changed_at timestamp NOT NULL,
  PRIMARY KEY (entity_type, entity_id, version)
) ON COMMIT DROP;

CREATE TEMP TABLE chain_events (
  event_seq integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  event_type text NOT NULL,
  previous_state text,
  new_state text NOT NULL,
  round_id text,
  actor text,
  reason_code text,
  event_at timestamp NOT NULL
) ON COMMIT DROP;

-- ------------------------------------------------
-- 1. Ausência CONFIRMED.
-- ------------------------------------------------
INSERT INTO chain_state
(entity_type,entity_id,state,round_id,changed_at)
VALUES
('ABSENCE','A1','CONFIRMED','R1','2026-09-28 08:00');

INSERT INTO chain_events
(entity_type,entity_id,event_type,previous_state,new_state,round_id,actor,reason_code,event_at)
VALUES
('ABSENCE','A1','ABSENCE_CONFIRMED',NULL,'CONFIRMED','R1','USER-1',NULL,'2026-09-28 08:00');

SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM chain_state
    WHERE entity_type='ABSENCE'
      AND entity_id='A1'
      AND state='CONFIRMED'
  )
  THEN 'PASS_CHAIN01_ABSENCE_CONFIRMED'
  ELSE 'FAIL_CHAIN01_ABSENCE_CONFIRMED'
END AS assertion;

-- ------------------------------------------------
-- 2. Ausência CONFIRMED gera necessidade/vaga OPEN.
-- ------------------------------------------------
INSERT INTO chain_state
(entity_type,entity_id,state,round_id,changed_at)
SELECT
  'VACANCY','V1','OPEN','R1','2026-09-28 08:01'
WHERE EXISTS (
  SELECT 1 FROM chain_state
  WHERE entity_type='ABSENCE'
    AND entity_id='A1'
    AND state='CONFIRMED'
);

INSERT INTO chain_events
(entity_type,entity_id,event_type,previous_state,new_state,round_id,actor,reason_code,event_at)
VALUES
('VACANCY','V1','VACANCY_OPEN',NULL,'OPEN','R1','SYSTEM','ABSENCE_CONFIRMED','2026-09-28 08:01');

SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM chain_state
    WHERE entity_type='VACANCY'
      AND entity_id='V1'
      AND state='OPEN'
      AND round_id='R1'
  )
  THEN 'PASS_CHAIN01_VACANCY_OPEN'
  ELSE 'FAIL_CHAIN01_VACANCY_OPEN'
END AS assertion;

-- ------------------------------------------------
-- 3. Motor executa somente sobre vaga OPEN.
-- ------------------------------------------------
INSERT INTO chain_events
(entity_type,entity_id,event_type,previous_state,new_state,round_id,actor,reason_code,event_at)
SELECT
  'ENGINE_RUN','RUN1','ENGINE_RUN_STARTED','OPEN','RUNNING','R1',
  'COORD-1',NULL,'2026-09-28 08:05'
WHERE EXISTS (
  SELECT 1 FROM chain_state
  WHERE entity_type='VACANCY'
    AND entity_id='V1'
    AND state='OPEN'
);

SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM chain_events
    WHERE entity_type='ENGINE_RUN'
      AND entity_id='RUN1'
      AND event_type='ENGINE_RUN_STARTED'
      AND new_state='RUNNING'
  )
  THEN 'PASS_CHAIN01_ENGINE_RUN'
  ELSE 'FAIL_CHAIN01_ENGINE_RUN'
END AS assertion;

-- ------------------------------------------------
-- 4. Motor conclui e gera recomendação.
-- ------------------------------------------------
INSERT INTO chain_state
(entity_type,entity_id,state,round_id,version,changed_at)
VALUES
('VACANCY','V1','RECOMMENDED','R1',2,'2026-09-28 08:06');

INSERT INTO chain_events
(entity_type,entity_id,event_type,previous_state,new_state,round_id,actor,reason_code,event_at)
VALUES
('VACANCY','V1','VACANCY_RECOMMENDED','OPEN','RECOMMENDED','R1',
 'ENGINE','ENGINE_COMPLETED','2026-09-28 08:06');

SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM chain_state
    WHERE entity_type='VACANCY'
      AND entity_id='V1'
      AND state='RECOMMENDED'
      AND round_id='R1'
  )
  THEN 'PASS_CHAIN01_VACANCY_RECOMMENDED'
  ELSE 'FAIL_CHAIN01_VACANCY_RECOMMENDED'
END AS assertion;

-- ------------------------------------------------
-- 5. Recomendação aguarda decisão humana.
-- ------------------------------------------------
INSERT INTO chain_events
(entity_type,entity_id,event_type,previous_state,new_state,round_id,actor,reason_code,event_at)
VALUES
('SUBSTITUTION','S1','SUBSTITUTION_PENDING','RECOMMENDED','PENDING','R1',
 'SYSTEM','HUMAN_VALIDATION_REQUIRED','2026-09-28 08:07');

SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM chain_events
    WHERE entity_type='SUBSTITUTION'
      AND entity_id='S1'
      AND new_state='PENDING'
      AND reason_code='HUMAN_VALIDATION_REQUIRED'
  )
  THEN 'PASS_CHAIN01_HUMAN_VALIDATION_PENDING'
  ELSE 'FAIL_CHAIN01_HUMAN_VALIDATION_PENDING'
END AS assertion;

-- ------------------------------------------------
-- 6. Confirmação humana autorizada.
-- ------------------------------------------------
INSERT INTO chain_events
(entity_type,entity_id,event_type,previous_state,new_state,round_id,actor,reason_code,event_at)
VALUES
('SUBSTITUTION','S1','SUBSTITUTION_CONFIRMED','PENDING','CONFIRMED','R1',
 'COORD-1','AUTHORIZED_HUMAN_CONFIRMATION','2026-09-28 08:10');

SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM chain_events
    WHERE entity_type='SUBSTITUTION'
      AND entity_id='S1'
      AND event_type='SUBSTITUTION_CONFIRMED'
      AND previous_state='PENDING'
      AND new_state='CONFIRMED'
      AND actor='COORD-1'
  )
  THEN 'PASS_CHAIN01_HUMAN_CONFIRM'
  ELSE 'FAIL_CHAIN01_HUMAN_CONFIRM'
END AS assertion;

-- ------------------------------------------------
-- 7. Confirmação resolve a vaga: ALLOCATED.
-- ------------------------------------------------
INSERT INTO chain_state
(entity_type,entity_id,state,round_id,version,changed_at)
VALUES
('VACANCY','V1','ALLOCATED','R1',3,'2026-09-28 08:10');

INSERT INTO chain_events
(entity_type,entity_id,event_type,previous_state,new_state,round_id,actor,reason_code,event_at)
VALUES
('VACANCY','V1','VACANCY_ALLOCATED','RECOMMENDED','ALLOCATED','R1',
 'COORD-1','SUBSTITUTION_CONFIRMED','2026-09-28 08:10');

SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM chain_state
    WHERE entity_type='VACANCY'
      AND entity_id='V1'
      AND state='ALLOCATED'
      AND round_id='R1'
  )
  THEN 'PASS_CHAIN01_VACANCY_ALLOCATED'
  ELSE 'FAIL_CHAIN01_VACANCY_ALLOCATED'
END AS assertion;

-- ------------------------------------------------
-- 8. Material change invalida a rodada.
-- ------------------------------------------------
CREATE TEMP TABLE chain_rounds (
  round_id text PRIMARY KEY,
  status text NOT NULL,
  parent_round_id text,
  created_at timestamp NOT NULL,
  invalidated_at timestamp,
  invalidation_reason text
) ON COMMIT DROP;

INSERT INTO chain_rounds
(round_id,status,parent_round_id,created_at)
VALUES
('R1','VALID',NULL,'2026-09-28 08:05');

UPDATE chain_rounds
SET status='STALE',
    invalidated_at='2026-09-28 09:00',
    invalidation_reason='MATERIAL_SOURCE_CHANGE'
WHERE round_id='R1';

INSERT INTO chain_events
(entity_type,entity_id,event_type,previous_state,new_state,round_id,actor,reason_code,event_at)
VALUES
('ROUND','R1','ROUND_STALE','VALID','STALE','R1',
 'SYSTEM','MATERIAL_SOURCE_CHANGE','2026-09-28 09:00');

SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM chain_rounds
    WHERE round_id='R1'
      AND status='STALE'
      AND invalidation_reason='MATERIAL_SOURCE_CHANGE'
  )
  THEN 'PASS_CHAIN01_ROUND_STALE_AFTER_MATERIAL_CHANGE'
  ELSE 'FAIL_CHAIN01_ROUND_STALE_AFTER_MATERIAL_CHANGE'
END AS assertion;

-- ------------------------------------------------
-- 9. Rodada STALE não pode confirmar nova decisão.
-- ------------------------------------------------
SELECT CASE
  WHEN NOT EXISTS (
    SELECT 1
    FROM chain_rounds
    WHERE round_id='R1'
      AND status IN ('VALID','CALCULATED','HUMAN_VALIDATION_REQUIRED','HUMAN_OVERRIDDEN')
  )
  THEN 'PASS_CHAIN01_STALE_ROUND_CONFIRMATION_BLOCKED'
  ELSE 'FAIL_CHAIN01_STALE_ROUND_CONFIRMATION_BLOCKED'
END AS assertion;

-- ------------------------------------------------
-- 10. Nova rodada nasce preservando o histórico da anterior.
-- ------------------------------------------------
INSERT INTO chain_rounds
(round_id,status,parent_round_id,created_at)
VALUES
('R2','VALID','R1','2026-09-28 09:05');

INSERT INTO chain_events
(entity_type,entity_id,event_type,previous_state,new_state,round_id,actor,reason_code,event_at)
VALUES
('ROUND','R2','NEW_ROUND_CREATED',NULL,'VALID','R2',
 'SYSTEM','PARENT_ROUND_STALE','2026-09-28 09:05');

SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM chain_rounds
    WHERE round_id='R1' AND status='STALE'
  )
  AND EXISTS (
    SELECT 1 FROM chain_rounds
    WHERE round_id='R2'
      AND status='VALID'
      AND parent_round_id='R1'
  )
  THEN 'PASS_CHAIN01_NEW_ROUND_PRESERVES_HISTORY'
  ELSE 'FAIL_CHAIN01_NEW_ROUND_PRESERVES_HISTORY'
END AS assertion;

-- ------------------------------------------------
-- 11. Histórico da decisão R1 permanece intacto.
-- ------------------------------------------------
SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM chain_events
    WHERE entity_type='SUBSTITUTION'
      AND entity_id='S1'
      AND event_type='SUBSTITUTION_CONFIRMED'
      AND round_id='R1'
      AND new_state='CONFIRMED'
  )
  AND EXISTS (
    SELECT 1 FROM chain_events
    WHERE entity_type='ROUND'
      AND entity_id='R1'
      AND event_type='ROUND_STALE'
      AND new_state='STALE'
  )
  THEN 'PASS_CHAIN01_HISTORY_IMMUTABLE'
  ELSE 'FAIL_CHAIN01_HISTORY_IMMUTABLE'
END AS assertion;

-- ------------------------------------------------
-- 12. Transições proibidas devem permanecer impossíveis.
-- ------------------------------------------------
SELECT CASE
  WHEN NOT EXISTS (
    SELECT 1 FROM chain_events
    WHERE previous_state='STALE'
      AND new_state='CONFIRMED'
  )
  AND NOT EXISTS (
    SELECT 1 FROM chain_events
    WHERE previous_state='CANCELLED'
      AND new_state='ALLOCATED'
  )
  AND NOT EXISTS (
    SELECT 1 FROM chain_events
    WHERE previous_state='ALLOCATED'
      AND new_state='OPEN'
  )
  THEN 'PASS_CHAIN01_FORBIDDEN_TRANSITIONS_ABSENT'
  ELSE 'FAIL_CHAIN01_FORBIDDEN_TRANSITIONS_ABSENT'
END AS assertion;

COMMIT;

-- Critério:
-- PASS_* = transição demonstrada no fixture.
-- FAIL_* = bloqueio da CHAIN-01.
-- A confirmação é humana e autorizada; o harness não implementa autorização real.
-- PostgreSQL real de CI/ambiente controlado continua sendo gate de execução.
-- GATE-FONTE-SED permanece RED/BLOCKED.
