# 76 — Relatório de execução da regressão sintética V1

## Status

**GREEN — execução real concluída com sucesso.**

O GitHub Actions executou o workflow **EduData IA — Escala Regression**, run **928**, associado ao commit `b54c24d00bb069f0352f80a507d7c9e581a52bef`.

Conclusão do workflow: **success**.

## Evidências de execução

### Preflight

- `REGRESSION_PREFLIGHT=PASS`
- `SYNTHETIC_FIXTURE_CHECK=PASS`
- `REGRESSION_CONSISTENCY_CHECK=PASS`

### Harnesses PostgreSQL

O mesmo workflow executou os harnesses de:

- reprodutibilidade R09;
- alocação adversarial.

Resultados relevantes registrados:

- `PASS_GLOBAL_PLAN_REPRODUCIBILITY`
- `PASS_DETERMINISTIC_SIGNATURE_RULE`
- `PASS_DETERMINISTIC_TIEBREAK`
- `PASS_3_OCCURRENCES_2_TEACHERS`
- `PASS_CONFLICT_BLOCKS_REUSE`
- `PASS_PARTIAL_UNAVAILABILITY`
- `PASS_NO_CANDIDATE_UNCOVERED`
- `PASS_CONTROLLED_WEIGHT_CHANGE_HARD_CONSTRAINT`
- `PASS_EXPLAINABLE_UNCOVERED`
- `PASS_DISTINCT_SAME_COMPONENT_OCCURRENCES`
- `PASS_MULTI_ASSOCIATED_TEACHERS_REMAIN_CONTEXTUAL`

### Harness Node

O workflow executou:

`node escala-substituicao/mvp/tests/regression-fixture-v1.mjs`

Resultado:

**`REGRESSION FIXTURE V1: PASS`**

Resumo:

- C01: 3 candidatos;
- C02: 3 candidatos;
- C03/C04: cobertura 4;
- C08: determinismo confirmado.

Também executou:

`node escala-substituicao/mvp/tests/round-persistence-v1.mjs`

Resultado:

**`ROUND PERSISTENCE V1: PASS`**

## Conclusão

A regressão sintética C01–C08 deixou de ser apenas uma validação estática e passou a possuir **evidência de execução automatizada em CI**.

Isso confirma, no ambiente sintético atual:

1. exclusão do titular;
2. aplicação de restrições temporais;
3. cobertura global;
4. diferença entre greedy local e otimização global;
5. cenário sem cobertura;
6. override humano compatível com restrições duras;
7. mudança material de disponibilidade;
8. determinismo;
9. persistência/reprodução da rodada;
10. integridade básica da fixture.

## Limites

Este PASS **não significa homologação SED** e não autoriza DDL produtivo.

A fixture permanece `official: false`.

O GATE-FONTE-SED continua **RED/BLOCKED** até obtenção e homologação do artefato E3 atual.

## Próximo avanço

Com C01–C08 e persistência V1 executados com sucesso, o próximo bloco é a execução dos contratos da **Memória Operacional EDI — MO-01 a MO-16**, mantendo a separação entre:

`evento → conhecimento → sugestão → decisão humana`

e nunca permitindo:

`histórico → atribuição automática`.
