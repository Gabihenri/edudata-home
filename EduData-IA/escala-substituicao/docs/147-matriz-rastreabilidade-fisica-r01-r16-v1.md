# 147 — Matriz de Rastreabilidade Física R01–R16 v1

**Status:** PREPARATÓRIA / SEM DDL DE PRODUÇÃO  
**GATE-FONTE-SED:** RED / BLOCKED  
**Data:** 06/10/2026

## Objetivo

Conectar cada requisito R01–R16 às entidades conceituais, controles físicos e evidências de teste, sem inventar chaves SED nem autorizar DDL.

| ID | Regra | Entidades/controles físicos | Evidência |
|---|---|---|---|
| R01 | Desempate determinístico | allocation_plan/item + regra de ordenação estável | PASS_DETERMINISTIC_TIEBREAK |
| R02 | Cobertura global máxima | occurrence + vacancy + allocation_item | PASS_3_OCCURRENCES_2_TEACHERS |
| R03 | Conflito temporal | intervalos de occurrence/availability/allocation | R03 v2: overlap/boundary/non-overlap |
| R04 | Elegibilidade | candidate_evaluation + hard constraint | PASS_R04_INELIGIBILITY_FILTER |
| R05 | Disponibilidade temporal | availability + intervalo da occurrence | PASS_R05_FULL_WINDOW_REQUIRED; PASS_R05_PARTIAL_AND_BOUNDARY_AVAILABILITY |
| R06 | Uncovered explícito | allocation_item + reason_code | PASS_NO_CANDIDATE_UNCOVERED |
| R07 | Hard constraints antes do score | candidate_evaluation + constraint state | PASS_CONTROLLED_WEIGHT_CHANGE_HARD_CONSTRAINT |
| R08 | Explicabilidade | allocation_item + reason_code | PASS_EXPLAINABLE_UNCOVERED |
| R09 | Reprodutibilidade | allocation_round + snapshot + signature | PASS_GLOBAL_PLAN_REPRODUCIBILITY |
| R10 | Override preservado | allocation_plan + human_decision | PASS_OVERRIDE_PRESERVES_ORIGINAL_PLAN |
| R11 | Reexecução por mudança material | snapshot + change state | PASS_REEXECUTION_REQUIRED |
| R12 | Segurança de confirmação | round state + snapshot state | PASS_REEXECUTION_SAFETY_GATE |
| R13 | Reconstrução histórica | immutable round/version | PASS_HISTORICAL_ROUNDS_RECONSTRUCTIBLE |
| R14 | Optimalidade global | allocation_plan + lexicographic ordering | 6 PASS de optimalidade |
| R15 | Ocorrências não mescladas | occurrence identity + multiplicity | PASS_R15_DISTINCT_TEMPORAL_OCCURRENCES |
| R16 | Associação ≠ responsabilidade | academic association + responsibility state | PASS_R16_ASSOCIATION_NOT_RESPONSIBILITY_P2 |

## Ordem de aplicação

1. Fonte/proveniência.
2. Identidade acadêmica homologada.
3. Contexto temporal.
4. Occurrence/absence/vacancy.
5. Hard constraints.
6. Candidate evaluation.
7. Alocação global.
8. Snapshot/round.
9. Decisão humana.
10. Substituição efetiva.

Score nunca precede restrições duras.

## Rastreabilidade de integridade

O desenho físico deverá preservar:

- proveniência do artefato até a ocorrência;
- identidade distinta entre Core e SED;
- multiplicidade de ocorrências;
- separação associação/responsabilidade;
- imutabilidade do plano algorítmico;
- override como decisão independente;
- reconstrução histórica das rodadas;
- invalidação diante de mudança material.

## Dependências E3

Nenhuma linha desta matriz autoriza:

- FK para ID SED não homologado;
- parser produtivo;
- sincronização oficial;
- publicação de ocorrência oficial;
- atribuição automática oficial;
- DDL acadêmico definitivo.

A passagem para DDL exige artefato E3 preservado, ficha 114 homologada, chaves e cardinalidades comprovadas, temporalidade/versionamento validados e R01–R16 executados sobre fixture reconciliada.

**Conclusão:** a rastreabilidade física está preparada; a implementação produtiva permanece condicionada ao E3.