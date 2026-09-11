# Escala de Substituição — Matriz de Regressão Executável v1

**Status:** CONCEITUAL / HARNESS-SAFE  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 11/09/2026

## 1. Objetivo

Transformar a matriz conceitual de regressão em um mapa explícito entre invariantes e harnesses sintéticos existentes. O objetivo é reduzir o risco de uma futura alteração do motor quebrar silenciosamente uma propriedade já validada.

## 2. Mapeamento

| ID | Invariante | Harness | Cobertura |
|---|---|---|---|
| R01 | cobertura máxima com recursos insuficientes | `tests/global-allocation-adversarial-v1.sql` Caso 1 | explícita |
| R02 | desempate determinístico | mesmo harness Caso 2 | explícita |
| R03 | conflito temporal não permite reutilização | mesmo harness Caso 3 | explícita |
| R04 | inelegibilidade é restrição dura | mesmo harness Caso 4 | explícita |
| R05 | indisponibilidade é restrição dura | mesmo harness Caso 4 | explícita |
| R06 | ausência de candidato produz uncovered | mesmo harness Caso 5 | explícita |
| R07 | peso não supera restrição dura | mesmo harness Caso 6 | explícita |
| R08 | resultado parcial possui explicação | mesmo harness Caso 7 | explícita |
| R09 | mesmo snapshot produz mesmo plano global | `tests/global-allocation-reproducibility-v1.sql` | explícita |
| R10 | override preserva plano original | `tests/human-override-preservation-v1.sql` | explícita |
| R11 | mudança material invalida validação e exige nova rodada | `tests/snapshot-reexecution-v1.sql` | explícita |

## 3. Evolução da matriz

R09 foi separado do teste anterior de ranking por ocorrência. O harness atual compara a assinatura do **plano global completo**, sua cobertura e sua qualidade entre duas execuções idênticas.

R10 possui harness dedicado para preservar a distinção entre decisão algorítmica e decisão humana.

R11 amplia a regressão para o ciclo temporal: uma mudança material no snapshot não pode reutilizar silenciosamente uma recomendação anterior.

## 4. Regra de promoção

Nenhuma implementação produtiva do motor deve ser considerada pronta enquanto uma alteração não puder ser submetida à matriz R01–R11.

Os casos dependentes de fonte oficial só poderão receber testes de integração depois do fechamento do GATE-FONTE-SED.

## 5. Execução futura

O runner deverá:

1. preparar ambiente sintético;
2. executar cada harness;
3. exigir resultados `PASS_*`;
4. registrar falhas individualmente;
5. calcular cobertura da matriz R01–R11;
6. impedir promoção quando uma invariante crítica falhar;
7. preservar evidência da execução.

## 6. Critérios críticos

Falhas em R01, R03, R04, R05, R06 ou R07 são críticas porque comprometem cobertura ou restrições duras.

Falhas em R02 ou R09 comprometem determinismo/reprodutibilidade.

Falhas em R08 ou R10 comprometem explicabilidade/governança.

Falha em R11 compromete a segurança temporal da decisão e deve impedir confirmação de uma recomendação baseada em snapshot materialmente alterado.

## 7. Limites

Documento de teste e governança técnica. Não define schema físico, API, parser, IDs SED ou integração produtiva.
