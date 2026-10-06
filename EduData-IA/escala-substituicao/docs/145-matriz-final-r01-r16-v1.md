# Escala de Substituição — Matriz Final R01–R16 v1

**Status:** FECHAMENTO DA REGRESSÃO SINTÉTICA  
**GATE-FONTE-SED:** RED/BLOCKED

## Resultado consolidado

A matriz R01–R16 possui cobertura comportamental observável nos harnesses sintéticos.

| ID | Invariante | Evidência observável | Estado |
|---|---|---|---|
| R01 | Desempate determinístico | PASS_DETERMINISTIC_TIEBREAK | 🟢 |
| R02 | Máxima cobertura global | PASS_3_OCCURRENCES_2_TEACHERS | 🟢 |
| R03 | Conflito temporal bloqueia reutilização | PASS_CONFLICT_BLOCKS_REUSE + R03 v2 | 🟢 |
| R04 | Elegibilidade filtra candidato antes da disponibilidade/score | PASS_R04_INELIGIBILITY_FILTER | 🟢 |
| R05 | Disponibilidade temporal cobre integralmente a ocorrência | PASS_R05_FULL_WINDOW_REQUIRED + PASS_R05_PARTIAL_AND_BOUNDARY_AVAILABILITY | 🟢 |
| R06 | Nenhum candidato → uncovered explícito | PASS_NO_CANDIDATE_UNCOVERED | 🟢 |
| R07 | Mudança de pesos não viola hard constraints | PASS_CONTROLLED_WEIGHT_CHANGE_HARD_CONSTRAINT | 🟢 |
| R08 | Uncovered explicável | PASS_EXPLAINABLE_UNCOVERED | 🟢 |
| R09 | Reprodutibilidade do plano | PASS_GLOBAL_PLAN_REPRODUCIBILITY | 🟢 |
| R10 | Override humano preserva recomendação | PASS_OVERRIDE_PRESERVES_ORIGINAL_PLAN / PASS_AUDIT_RECONSTRUCTION | 🟢 |
| R11 | Mudança material exige reexecução | PASS_MATERIAL_CHANGE_DETECTION / PASS_REEXECUTION_REQUIRED | 🟢 |
| R12 | Estados de mudança bloqueiam confirmação | PASS_CHANGE_STATE_MATRIX / PASS_REEXECUTION_SAFETY_GATE | 🟢 |
| R13 | Persistência e reconstrução de rodadas | PASS_HISTORICAL_ROUNDS_RECONSTRUCTIBLE / PASS_INVALIDATION_CREATES_NEW_HISTORICAL_ROUND | 🟢 |
| R14 | Optimalidade global lexicográfica | 6 PASS: cobertura, qualidade, desempate, hard constraint, não-reuso, plano parcial | 🟢 |
| R15 | Ocorrências distintas do mesmo componente | PASS_R15_DISTINCT_TEMPORAL_OCCURRENCES / IDENTITY_PRESERVED / SAME_COMPONENT_NOT_MERGED | 🟢 |
| R16 | Associação ≠ responsabilidade efetiva | PASS_R16_ASSOCIATION_NOT_RESPONSIBILITY_P2 / HOMOLOGATED / UNRESOLVED_REQUIRES_REVIEW | 🟢 |

## Separação técnica R04/R05

A duplicação anterior foi eliminada.

- **R04 — elegibilidade:** verifica que candidatos inelegíveis são removidos mesmo quando estão disponíveis, mantendo candidatos elegíveis para avaliação.
- **R05 — disponibilidade:** verifica cobertura temporal integral da ocorrência; janelas parciais e disponibilidade iniciando apenas na fronteira final não qualificam o docente.

O R05 possui harness próprio em `tests/r05-availability-v1.sql` e foi executado diretamente no PostgreSQL real do projeto, com resultado PASS nos dois critérios.

## R03, R15 e R16

Além da bateria adversarial, existe regressão v2 específica em PostgreSQL para esses requisitos:

- R03: sobreposição real de intervalos half-open, fronteira 10:00 sem conflito e bloqueio de reutilização;
- R15: identidade de ocorrência preservada mesmo com mesmo componente/turma e horários distintos;
- R16: múltiplas associações permanecem contextuais; responsabilidade depende de homologação; ausência de responsabilidade homologada exige revisão.

## R14

A prova de optimalidade foi corrigida no commit:

`68b7af3139c70d97a80ab94ce7e328bb3cdec14d`

A execução agregada observou:

- PASS_COVERAGE_PRECEDENCE
- PASS_QUALITY_SECONDARY_OBJECTIVE
- PASS_DETERMINISTIC_FINAL_TIEBREAK
- PASS_HARD_CONSTRAINT_BEFORE_SCORE
- PASS_GLOBAL_NON_REUSE
- PASS_PARTIAL_PLAN_EXPLICIT

## Decisão técnica

**R01–R16: cobertura sintética consolidada = VERDE.**

Isso significa que os contratos comportamentais previstos na suíte estão cobertos por fixtures sintéticos e asserções observáveis.

Isso **não** significa:

- homologação da SED;
- homologação das chaves acadêmicas;
- validação de Grade Horária real;
- validação de Associação Professor–Classe real;
- autorização para DDL de produção;
- autorização para parser/importação SED;
- autorização para atribuição oficial automática.

## Gate externo

`GATE-FONTE-SED = RED/BLOCKED`.

A próxima fronteira técnica é a especificação física preparada para homologação, sem aplicação em produção, e a aquisição/homologação do artefato E3.

O motor de regressão sintética, entretanto, está suficientemente coberto para avançar sem aguardar a fonte SED.
