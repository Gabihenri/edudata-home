-- Escala Inteligente EDI — contrato de atomicidade
-- STATUS: SYNTHETIC / CONTRACT HARNESS
-- GATE-FONTE-SED: RED/BLOCKED
--
-- Define invariantes de commit/rollback sem escolher implementação física.

BEGIN;

CREATE TEMP TABLE atomic_cases (
  case_id text PRIMARY KEY,
  scenario text NOT NULL,
  expected_result text NOT NULL
) ON COMMIT DROP;

INSERT INTO atomic_cases VALUES
('AT-01','confirmação bem-sucedida altera decisão e vaga de forma coerente',
 'ALL_COMMIT'),
('AT-02','falha durante confirmação',
 'ALL_ROLLBACK'),
('AT-03','round STALE',
 'NO_STATE_MUTATION'),
('AT-04','autorização revogada antes do commit',
 'NO_STATE_MUTATION'),
('AT-05','auditoria acompanha a transação',
 'AUDIT_ATOMIC_WITH_STATE');

CREATE TEMP TABLE atomic_state (
  vacancy_state text NOT NULL,
  substitution_state text NOT NULL,
  audit_count integer NOT NULL
) ON COMMIT DROP;

INSERT INTO atomic_state VALUES
('RECOMMENDED','PENDING',0);

-- AT-01: todos os efeitos fazem parte do mesmo resultado observável.
UPDATE atomic_state
SET vacancy_state='ALLOCATED',
    substitution_state='CONFIRMED',
    audit_count=1;

SELECT CASE
  WHEN vacancy_state='ALLOCATED'
   AND substitution_state='CONFIRMED'
   AND audit_count=1
  THEN 'PASS_AT01_ALL_COMMIT'
  ELSE 'FAIL_AT01_ALL_COMMIT'
END AS assertion
FROM atomic_state;

-- AT-02: simulação de falha: estado anterior deve ser restaurado integralmente.
UPDATE atomic_state
SET vacancy_state='RECOMMENDED',
    substitution_state='PENDING',
    audit_count=0;

-- Resultado esperado após rollback; nenhuma mutação parcial permanece.
SELECT CASE
  WHEN vacancy_state='RECOMMENDED'
   AND substitution_state='PENDING'
   AND audit_count=0
  THEN 'PASS_AT02_ALL_ROLLBACK'
  ELSE 'FAIL_AT02_ALL_ROLLBACK'
END AS assertion
FROM atomic_state;

-- AT-03: rodada STALE bloqueia confirmação e não altera estado.
CREATE TEMP TABLE atomic_round (
  round_id text PRIMARY KEY,
  state text NOT NULL
) ON COMMIT DROP;

INSERT INTO atomic_round VALUES ('R1','STALE');

SELECT CASE
  WHEN state='STALE'
   AND (SELECT vacancy_state FROM atomic_state)='RECOMMENDED'
   AND (SELECT substitution_state FROM atomic_state)='PENDING'
  THEN 'PASS_AT03_STALE_NO_STATE_MUTATION'
  ELSE 'FAIL_AT03_STALE_NO_STATE_MUTATION'
END AS assertion
FROM atomic_round
WHERE round_id='R1';

-- AT-04: autorização revogada antes do commit também não altera estado.
CREATE TEMP TABLE atomic_authorization (
  operation_id text PRIMARY KEY,
  state text NOT NULL
) ON COMMIT DROP;

INSERT INTO atomic_authorization VALUES ('OP1','REVOKED_BEFORE_COMMIT');

SELECT CASE
  WHEN state='REVOKED_BEFORE_COMMIT'
   AND (SELECT vacancy_state FROM atomic_state)='RECOMMENDED'
   AND (SELECT substitution_state FROM atomic_state)='PENDING'
  THEN 'PASS_AT04_REVOKED_NO_STATE_MUTATION'
  ELSE 'FAIL_AT04_REVOKED_NO_STATE_MUTATION'
END AS assertion
FROM atomic_authorization
WHERE operation_id='OP1';

-- AT-05: não pode existir auditoria de sucesso sem o estado correspondente,
-- nem estado confirmado sem o evento de auditoria exigido.
UPDATE atomic_state
SET vacancy_state='ALLOCATED',
    substitution_state='CONFIRMED',
    audit_count=1;

SELECT CASE
  WHEN (
    (vacancy_state='ALLOCATED' AND substitution_state='CONFIRMED'
      AND audit_count=1)
    OR
    (vacancy_state='RECOMMENDED' AND substitution_state='PENDING'
      AND audit_count=0)
  )
  THEN 'PASS_AT05_AUDIT_ATOMIC_WITH_STATE'
  ELSE 'FAIL_AT05_AUDIT_ATOMIC_WITH_STATE'
END AS assertion
FROM atomic_state;

-- Idempotência: repetir a mesma operação não cria segundo efeito observável.
UPDATE atomic_state
SET vacancy_state='ALLOCATED',
    substitution_state='CONFIRMED',
    audit_count=1;

SELECT CASE
  WHEN vacancy_state='ALLOCATED'
   AND substitution_state='CONFIRMED'
   AND audit_count=1
  THEN 'PASS_ATOMIC_IDEMPOTENT_EFFECT'
  ELSE 'FAIL_ATOMIC_IDEMPOTENT_EFFECT'
END AS assertion
FROM atomic_state;

SELECT CASE
  WHEN COUNT(*)=5
  THEN 'PASS_ATOMIC_CONTRACT_COUNT_5'
  ELSE 'FAIL_ATOMIC_CONTRACT_COUNT_5'
END AS assertion
FROM atomic_cases;

COMMIT;

-- Critério:
-- PASS_* = contrato sintético.
-- FAIL_* = lacuna.
-- A prova de transação/concorrência real continua pendente.
-- Não definir aqui row locks, isolation level, constraints ou RPC final.
-- GATE-FONTE-SED permanece RED/BLOCKED.
