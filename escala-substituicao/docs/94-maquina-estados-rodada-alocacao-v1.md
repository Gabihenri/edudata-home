# Escala de Substituição — Máquina de Estados da Rodada v1

**Status:** CONCEITUAL / HARNESS-SAFE  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 11/09/2026

## 1. Máquina de estados

```text
CREATED
   ↓
SNAPSHOT_VALIDATED
   ↓
RUNNING
   ├──→ BLOCKED
   ├──→ FAILED
   ↓
COMPLETED
   ↓
HUMAN_VALIDATION
   ├──→ CLOSED
   ├──→ BLOCKED
   └──→ nova rodada
```

## 2. Transições permitidas

| De | Para | Condição |
|---|---|---|
| `CREATED` | `SNAPSHOT_VALIDATED` | snapshot validado |
| `SNAPSHOT_VALIDATED` | `RUNNING` | entradas aptas |
| `RUNNING` | `COMPLETED` | cálculo concluído |
| `RUNNING` | `BLOCKED` | condição impeditiva detectada |
| `RUNNING` | `FAILED` | erro técnico/consistência |
| `COMPLETED` | `HUMAN_VALIDATION` | recomendações publicadas |
| `HUMAN_VALIDATION` | `CLOSED` | decisões encerradas |
| `HUMAN_VALIDATION` | nova rodada | snapshot materialmente alterado |

## 3. Invariantes

- não executar com snapshot inválido;
- não substituir silenciosamente uma rodada anterior;
- não fechar rodada com decisão humana inexistente quando ela for obrigatória;
- não transformar `uncovered` em cobertura fictícia;
- não perder a assinatura do resultado;
- não aceitar alteração que viole restrição dura;
- toda transição deve possuir motivo e instante.

## 4. Mudança material

São exemplos conceituais de mudança material:

- nova ausência relevante;
- retorno de professor;
- alteração de disponibilidade;
- alteração de ocorrência;
- alteração de vigência aplicável;
- mudança de regra homologada.

A definição final depende das fontes e regras homologadas.

## 5. Reexecução segura

Quando houver mudança material, preservar a rodada anterior e iniciar uma nova execução com novo snapshot. A interface deve permitir comparar as duas decisões sem apagar o histórico.

## 6. Limites

Máquina de estados conceitual. Não cria estados, IDs ou transições oficiais da SED e não autoriza integração produtiva antes do fechamento do GATE-FONTE-SED.