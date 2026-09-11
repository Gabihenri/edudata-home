# Escala de Substituição — Harness de Integridade da Decisão Humana v1

**Status:** CONCEITUAL / HARNESS-SAFE  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 11/09/2026

## 1. Objetivo

Garantir que a camada humana não destrua a rastreabilidade produzida pelo motor e que uma decisão manual permaneça distinguível da recomendação algorítmica.

## 2. Teste principal

O harness `tests/human-override-preservation-v1.sql` representa:

```text
algoritmo → P1
humano   → P2
```

O resultado deve conservar simultaneamente:

- candidato recomendado pelo algoritmo;
- score original;
- estado original;
- candidato escolhido pelo humano;
- estado `HUMAN_OVERRIDDEN`.

## 3. Invariantes

1. override não altera retroativamente o plano algorítmico;
2. score original permanece disponível;
3. decisão humana possui estado próprio;
4. a rodada continua identificável;
5. auditoria consegue reconstruir as duas decisões.

## 4. Regra de segurança

Uma alteração humana não deve ser apresentada posteriormente como se tivesse sido calculada pelo motor.

## 5. Critério de falha

O teste falha se:

- P1 desaparecer do histórico;
- score original for perdido;
- P2 for registrado como recomendação algorítmica;
- os estados forem indistinguíveis;
- não houver referência à mesma rodada.

## 6. Relação com a matriz

Este harness fecha a lacuna identificada no R10 da matriz de regressão executável.

## 7. Limites

Teste sintético. Não define autorização administrativa, identidade SED, schema físico ou integração oficial.