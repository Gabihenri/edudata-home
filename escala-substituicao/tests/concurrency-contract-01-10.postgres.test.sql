-- Escala Inteligente EDI — contrato adversarial de concorrência CONC-01..10
-- STATUS: SYNTHETIC / CONTRACT HARNESS
-- GATE-FONTE-SED: RED/BLOCKED
--
-- IMPORTANTE:
-- Este arquivo NÃO escolhe row lock, optimistic concurrency, exclusion
-- constraint, unique constraint ou combinação.
-- Ele define apenas os resultados que a implementação física deverá garantir.
--
-- Uma execução PostgreSQL concorrente real permanece pendente.

BEGIN;

CREATE TEMP TABLE conc_contract (
  case_id text PRIMARY KEY,
  scenario text NOT NULL,
  expected_result text NOT NULL
) ON COMMIT DROP;

INSERT INTO conc_contract VALUES
('CONC-01','dois usuários confirmam simultaneamente a mesma vaga',
 'EXATAMENTE_UM_SUCESSO'),
('CONC-02','segundo usuário confirma vaga já resolvida',
 'REJEICAO'),
('CONC-03','rodada STALE tenta confirmar',
 'REJEICAO'),
('CONC-04','autorização revogada antes do commit',
 'REJEICAO'),
('CONC-05','confirmação concorre com override',
 'CONFLITO_CONTROLADO'),
('CONC-06','ausência cancelada antes da confirmação',
 'REJEICAO'),
('CONC-07','ausência cancelada depois da decisão',
 'INVALIDACAO_COM_HISTORICO'),
('CONC-08','nova ausência na mesma ocorrência',
 'NOVA_NECESSIDADE'),
('CONC-09','reprocessamento repetido',
 'IDEMPOTENTE'),
('CONC-10','falha durante confirmação',
 'ROLLBACK_INTEGRAL');

-- ------------------------------------------------
-- CONC-01
-- ------------------------------------------------
CREATE TEMP TABLE c01_attempts (
  attempt_id text PRIMARY KEY,
  user_id text NOT NULL,
  outcome text NOT NULL
) ON COMMIT DROP;

INSERT INTO c01_attempts VALUES
('A1','U1','SUCCESS'),
('A2','U2','REJECTED_CONFLICT');

SELECT CASE
  WHEN (SELECT COUNT(*) FROM c01_attempts WHERE outcome='SUCCESS')=1
   AND (SELECT COUNT(*) FROM c01_attempts WHERE outcome LIKE 'REJECTED%')=1
  THEN 'PASS_CONC01_EXACTLY_ONE_SUCCESS'
  ELSE 'FAIL_CONC01_EXACTLY_ONE_SUCCESS'
END AS assertion;

-- ------------------------------------------------
-- CONC-02
-- ------------------------------------------------
CREATE TEMP TABLE c02_vacancy (
  vacancy_id text PRIMARY KEY,
  state text NOT NULL
) ON COMMIT DROP;

INSERT INTO c02_vacancy VALUES ('V1','ALLOCATED');

SELECT CASE
  WHEN state='ALLOCATED'
  THEN 'PASS_CONC02_ALREADY_RESOLVED_REJECT'
  ELSE 'FAIL_CONC02_ALREADY_RESOLVED_REJECT'
END AS assertion
FROM c02_vacancy
WHERE vacancy_id='V1';

-- ------------------------------------------------
-- CONC-03
-- ------------------------------------------------
CREATE TEMP TABLE c03_round (
  round_id text PRIMARY KEY,
  state text NOT NULL
) ON COMMIT DROP;

INSERT INTO c03_round VALUES ('R1','STALE');

SELECT CASE
  WHEN state='STALE'
  THEN 'PASS_CONC03_STALE_ROUND_REJECT'
  ELSE 'FAIL_CONC03_STALE_ROUND_REJECT'
END AS assertion
FROM c03_round
WHERE round_id='R1';

-- ------------------------------------------------
-- CONC-04
-- ------------------------------------------------
CREATE TEMP TABLE c04_authorization (
  operation_id text PRIMARY KEY,
  authorization_state text NOT NULL
) ON COMMIT DROP;

INSERT INTO c04_authorization VALUES
('OP1','REVOKED_BEFORE_COMMIT');

SELECT CASE
  WHEN authorization_state='REVOKED_BEFORE_COMMIT'
  THEN 'PASS_CONC04_AUTH_REVOKED_REJECT'
  ELSE 'FAIL_CONC04_AUTH_REVOKED_REJECT'
END AS assertion
FROM c04_authorization
WHERE operation_id='OP1';

-- ------------------------------------------------
-- CONC-05
-- ------------------------------------------------
CREATE TEMP TABLE c05_conflict (
  vacancy_id text PRIMARY KEY,
  confirmation_state text NOT NULL,
  override_state text NOT NULL,
  expected_resolution text NOT NULL
) ON COMMIT DROP;

INSERT INTO c05_conflict VALUES
('V1','ATTEMPTED','ATTEMPTED','SERIALIZED_OR_REJECTED_WITHOUT_DUAL_COMMIT');

SELECT CASE
  WHEN expected_resolution='SERIALIZED_OR_REJECTED_WITHOUT_DUAL_COMMIT'
  THEN 'PASS_CONC05_CONFIRM_OVERRIDE_CONTROLLED_CONFLICT'
  ELSE 'FAIL_CONC05_CONFIRM_OVERRIDE_CONTROLLED_CONFLICT'
END AS assertion
FROM c05_conflict;

-- ------------------------------------------------
-- CONC-06
-- ------------------------------------------------
CREATE TEMP TABLE c06_absence (
  absence_id text PRIMARY KEY,
  state text NOT NULL
) ON COMMIT DROP;

INSERT INTO c06_absence VALUES ('A1','CANCELLED');

SELECT CASE
  WHEN state='CANCELLED'
  THEN 'PASS_CONC06_CANCELLED_BEFORE_CONFIRM_REJECT'
  ELSE 'FAIL_CONC06_CANCELLED_BEFORE_CONFIRM_REJECT'
END AS assertion
FROM c06_absence;

-- ------------------------------------------------
-- CONC-07
-- ------------------------------------------------
CREATE TEMP TABLE c07_history (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  previous_state text,
  new_state text NOT NULL
) ON COMMIT DROP;

INSERT INTO c07_history VALUES
('E1','SUBSTITUTION_CONFIRMED','PENDING','CONFIRMED'),
('E2','SUBSTITUTION_INVALIDATED','CONFIRMED','INVALIDATED');

SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM c07_history
    WHERE event_type='SUBSTITUTION_CONFIRMED'
      AND new_state='CONFIRMED'
  )
  AND EXISTS (
    SELECT 1 FROM c07_history
    WHERE event_type='SUBSTITUTION_INVALIDATED'
      AND previous_state='CONFIRMED'
      AND new_state='INVALIDATED'
  )
  THEN 'PASS_CONC07_POST_CONFIRM_INVALIDATION_WITH_HISTORY'
  ELSE 'FAIL_CONC07_POST_CONFIRM_INVALIDATION_WITH_HISTORY'
END AS assertion;

-- ------------------------------------------------
-- CONC-08
-- ------------------------------------------------
CREATE TEMP TABLE c08_needs (
  need_id text PRIMARY KEY,
  occurrence_id text NOT NULL,
  absence_id text NOT NULL,
  status text NOT NULL
) ON COMMIT DROP;

INSERT INTO c08_needs VALUES
('N1','O1','A1','RESOLVED'),
('N2','O1','A2','OPEN');

SELECT CASE
  WHEN COUNT(*)=2
   AND COUNT(DISTINCT absence_id)=2
   AND COUNT(*) FILTER (WHERE status='OPEN')=1
  THEN 'PASS_CONC08_NEW_ABSENCE_NEW_NEED'
  ELSE 'FAIL_CONC08_NEW_ABSENCE_NEW_NEED'
END AS assertion
FROM c08_needs
WHERE occurrence_id='O1';

-- ------------------------------------------------
-- CONC-09
-- ------------------------------------------------
CREATE TEMP TABLE c09_runs (
  run_key text PRIMARY KEY,
  execution_count integer NOT NULL,
  result_signature text NOT NULL
) ON COMMIT DROP;

INSERT INTO c09_runs VALUES
('SNAPSHOT-1|RULES-1',1,'PLAN-A');

-- Reprocessamento repetido deve preservar assinatura observável.
UPDATE c09_runs
SET execution_count=execution_count+1
WHERE run_key='SNAPSHOT-1|RULES-1';

SELECT CASE
  WHEN result_signature='PLAN-A'
   AND execution_count=2
  THEN 'PASS_CONC09_REPROCESSING_IDEMPOTENT_RESULT'
  ELSE 'FAIL_CONC09_REPROCESSING_IDEMPOTENT_RESULT'
END AS assertion
FROM c09_runs
WHERE run_key='SNAPSHOT-1|RULES-1';

-- ------------------------------------------------
-- CONC-10
-- ------------------------------------------------
CREATE TEMP TABLE c10_transaction (
  operation_id text PRIMARY KEY,
  before_state text NOT NULL,
  after_state text NOT NULL,
  failure_point text NOT NULL,
  final_state text NOT NULL
) ON COMMIT DROP;

INSERT INTO c10_transaction VALUES
('OP1','PENDING','CONFIRMED','AFTER_DECISION_BEFORE_COMMIT','PENDING');

SELECT CASE
  WHEN final_state=before_state
   AND final_state='PENDING'
  THEN 'PASS_CONC10_FAILURE_ROLLBACK_INTEGRAL'
  ELSE 'FAIL_CONC10_FAILURE_ROLLBACK_INTEGRAL'
END AS assertion
FROM c10_transaction
WHERE operation_id='OP1';

-- ------------------------------------------------
-- Completeness gate
-- ------------------------------------------------
SELECT CASE
  WHEN COUNT(*)=10
  THEN 'PASS_CONC_CONTRACT_COUNT_10'
  ELSE 'FAIL_CONC_CONTRACT_COUNT_10'
END AS assertion
FROM conc_contract;

-- Contract-level summary.
SELECT
  case_id,
  scenario,
  expected_result
FROM conc_contract
ORDER BY case_id;

COMMIT;

-- Critério:
-- PASS_* = contrato sintético representado.
-- FAIL_* = lacuna do contrato.
-- Esta bateria NÃO comprova concorrência física real.
-- A prova física deverá ocorrer depois da definição das chaves finais,
-- transações, constraints/RPCs e RLS, sem antecipar a solução.
-- GATE-FONTE-SED permanece RED/BLOCKED.
