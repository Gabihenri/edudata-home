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
| R09 | mesmo snapshot produz mesmo resultado | `tests/global-allocation-v1.sql` + execução repetida | requer execução automatizada futura |
| R10 | override preserva plano original | contrato Audit 87/96 + teste dedicado futuro | requer harness dedicado |

## 3. Lacunas identificadas

A matriz atual possui duas propriedades que ainda não estão representadas por um teste sintético dedicado:

### R09 — Reprodutibilidade

É necessário executar exatamente o mesmo conjunto de entradas mais de uma vez e comparar a assinatura final do plano, não apenas um valor intermediário.

### R10 — Override

É necessário representar uma recomendação, uma alteração humana e verificar que o plano algorítmico original permanece preservado junto da decisão final.

## 4. Regra de promoção

Nenhuma implementação produtiva do motor deve ser considerada pronta enquanto uma alteração não puder ser submetida à matriz R01–R10.

Os casos dependentes de fonte oficial só poderão receber testes de integração depois do fechamento do GATE-FONTE-SED.

## 5. Execução futura

O runner deverá:

1. preparar ambiente sintético;
2. executar cada caso;
3. exigir resultado `PASS_*`;
4. registrar falhas individualmente;
5. calcular cobertura da matriz;
6. impedir promoção quando uma invariante crítica falhar;
7. preservar evidência da execução.

## 6. Critérios críticos

Falhas em R01, R03, R04, R05, R06 ou R07 são críticas porque comprometem cobertura ou restrições duras.

Falhas em R02 ou R09 comprometem determinismo/reprodutibilidade.

Falha em R08 ou R10 compromete explicabilidade/governança.

## 7. Limites

Documento de teste e governança técnica. Não define schema físico, API, parser, IDs SED ou integração produtiva.