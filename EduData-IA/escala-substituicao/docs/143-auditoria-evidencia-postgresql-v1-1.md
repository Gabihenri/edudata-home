# Escala de Substituição — Auditoria de Evidência PostgreSQL v1.1

## Objetivo

Consolidar a execução dos harnesses sintéticos da Escala de Substituição em PostgreSQL real do projeto Supabase, sem alteração de schema de produção e mantendo o GATE-FONTE-SED como RED/BLOCKED.

## Evidência observável nesta rodada

| Harness | Última asserção observável | Resultado |
|---|---|---|
| `global-allocation-v1.sql` | `PASS_HUMAN_VALIDATION_GATE` | PASS observável |
| `global-allocation-reproducibility-v1.sql` | `PASS_DETERMINISTIC_SIGNATURE_RULE` | PASS observável |
| `human-override-preservation-v1.sql` | `PASS_AUDIT_RECONSTRUCTION` | PASS observável |
| `snapshot-reexecution-v1.sql` | `PASS_UNCHANGED_CAN_VALIDATE` | PASS observável |
| `snapshot-change-state-v1.sql` | `PASS_REEXECUTION_SAFETY_GATE` | PASS observável |
| `round-persistence-v1.sql` | `PASS_ROUND_VERSION_PART_OF_IDENTITY` | PASS observável |

Esses resultados demonstram que os scripts foram executados pelo PostgreSQL e que pelo menos uma asserção real de cada harness chegou ao adaptador de execução como PASS.

## Limitação do adaptador

Os scripts contêm múltiplos comandos/result sets. O adaptador atual retorna apenas o último result set do script em algumas execuções. Portanto:

- PASS observável não equivale a PASS integral do harness;
- ausência de erro SQL também não equivale a PASS integral;
- asserções anteriores precisam ser agregadas em um único result set para fechar a evidência completa.

## Evidência já fechada anteriormente

- `occurrence-vacancy.postgres.test.sql`: 12/12 casos, 0 falhas.
- `global-allocation-adversarial-v1.sql`: `PASS_MULTI_ASSOCIATED_TEACHERS_REMAIN_CONTEXTUAL`.
- `global-allocation-optimality-v1.sql`: corrigido e executável; `PASS_PARTIAL_PLAN_EXPLICIT` observável.
- Correção do harness de optimalidade: commit `68b7af3139c70d97a80ab94ce7e328bb3cdec14d`.
- Auditorias anteriores: commits `49ee2b9859bf33d6fa386227e4137a1cb8167f21` e `6f00c9a0f0aceff204d6442116f3440f7307d2dd`.

## Estado da suíte R01–R16

A suíte permanece em **FECHAMENTO DE EVIDÊNCIA**, não em aprovação integral.

O próximo fechamento técnico é tornar todas as asserções de cada harness observáveis em um único result set, preferencialmente com mudanças mínimas exclusivamente nos arquivos de teste.

## Gate de integração SED

`GATE-FONTE-SED = RED/BLOCKED`.

Nada nesta auditoria autoriza:

- integração oficial com SED;
- inferência de IDs acadêmicos;
- publicação de ocorrências oficiais;
- DDL produtivo baseado em fonte SED não homologada;
- automação de atribuição oficial.

O motor sintético/regressivo continua podendo avançar independentemente desse gate.
