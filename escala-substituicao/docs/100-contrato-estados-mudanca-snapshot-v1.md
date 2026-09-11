# 100 — Contrato de Estados de Mudança do Snapshot v1

**Projeto:** Escala de Substituição  
**Status:** CONCEITUAL / HARNESS-SAFE  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 2026-09-10

## 1. Objetivo

Formalizar o comportamento esperado quando o snapshot utilizado por uma rodada de alocação é comparado com uma nova captura antes da confirmação humana.

Este documento não define estados oficiais da SED e não constitui contrato técnico de integração.

## 2. Estados

| Estado | Significado | Pode confirmar a rodada antiga? | Ação segura |
|---|---|---:|---|
| `UNCHANGED` | snapshot materialmente idêntico | Sim | prosseguir para validação humana |
| `MATERIALLY_CHANGED` | houve alteração relevante nos dados/condições | Não | exigir nova rodada |
| `SOURCE_UNCERTAIN` | origem/proveniência não permite afirmar equivalência | Não | bloquear e obter nova evidência |
| `COMPARISON_FAILED` | comparação não pôde ser concluída com segurança | Não | bloquear e reexecutar após correção |

## 3. Mudanças materiais mínimas

São tratadas como materiais, no mínimo:

- ocorrência adicionada, removida ou alterada;
- ausência alterada;
- disponibilidade de candidato alterada;
- elegibilidade ou escopo alterado;
- vigência/associação alterada;
- conjunto de regras alterado.

A lista é comportamental e não pressupõe nomes de tabelas, colunas ou identificadores da SED.

## 4. Regra de segurança

A confirmação de uma recomendação baseada em snapshot anterior somente pode ocorrer quando o estado da comparação for `UNCHANGED`.

Nenhum estado de incerteza pode ser convertido implicitamente em equivalência.

`MATERIALLY_CHANGED`, `SOURCE_UNCERTAIN` e `COMPARISON_FAILED` devem impedir a confirmação da rodada anterior e conduzir a uma nova execução ou bloqueio seguro.

## 5. Relação com a rodada de alocação

O fluxo conceitual é:

`snapshot inicial → execução → recomendação → comparação pré-confirmação → estado da mudança → validação humana ou nova rodada`

Se houver mudança material durante a validação, a decisão pendente não deve ser confirmada contra o snapshot antigo. Uma nova rodada deve produzir nova recomendação e nova referência de snapshot.

O resultado anterior permanece preservado para auditoria; não deve ser sobrescrito.

## 6. Regressão

O harness `tests/snapshot-change-state-v1.sql` cobre uma matriz sintética de sete cenários:

- S1 — mesmo snapshot;
- S2 — disponibilidade alterada;
- S3 — ocorrência alterada;
- S4 — vigência alterada;
- S5 — conjunto de regras alterado;
- S6 — fonte incerta;
- S7 — comparação falhou.

O caso S1 é o único autorizável para confirmação normal. Os demais exigem bloqueio ou reexecução.

## 7. Limites de homologação

Este contrato não autoriza:

- criação de parser da SED;
- criação de DDL produtivo baseado em campos inferidos;
- uso de CPF/DI como chave interna sem regra oficial homologada;
- consumo de endpoint não documentado;
- promoção automática de recomendação para registro oficial;
- uso da Agenda como fonte oficial da grade.

A abertura do **GATE-FONTE-SED** continua condicionada ao artefato técnico oficial, dicionário/especificação verificável, identificadores homologados e evidência de autoridade/vigência.

## 8. Critério de aceite

O contrato é considerado preservado quando:

1. `UNCHANGED` permite seguir para validação;
2. qualquer mudança material impede confirmação da rodada antiga;
3. incerteza ou falha de comparação impede confirmação;
4. nova rodada utiliza novo snapshot;
5. a rodada anterior permanece auditável;
6. nenhum teste depende de dados reais ou identificadores oficiais ainda não homologados.
