# Escala de Substituição — Estados de Validade do Snapshot v1

**Status:** CONCEITUAL / HARNESS-SAFE  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 11/09/2026

## 1. Objetivo

Evitar que o motor produza uma recomendação com aparência de precisão quando os dados que sustentam a decisão estão incompletos, desatualizados ou inconsistentes.

## 2. Estados

| Estado | Motor | Interface | Significado |
|---|---|---|---|
| `COMPLETE` | pode calcular | normal | snapshot atende aos requisitos |
| `PARTIAL` | condicionado | alerta | existem lacunas conhecidas |
| `STALE` | bloqueado por padrão | alerta crítico | janela temporal inadequada |
| `INVALID` | bloqueado | erro crítico | inconsistência/proveniência inválida |

## 3. Regra de bloqueio

`STALE` e `INVALID` não devem gerar recomendação automática.

`PARTIAL` somente pode gerar resultado se a parte faltante não comprometer nenhuma restrição ou critério necessário para a decisão, e isso deve ser explicitamente demonstrável pelo contrato futuro.

Na ausência dessa demonstração, tratar como bloqueado.

## 4. Alteração concorrente

Quando o estado da escola mudar durante a validação humana, a recomendação anterior deve permanecer identificada como pertencente ao snapshot anterior.

O sistema deve evitar que o usuário confirme uma recomendação antiga sem perceber que o estado mudou.

## 5. Regra de interface

Um snapshot inválido ou desatualizado deve ser visualmente inequívoco. Não usar linguagem como “melhor professor” quando a informação necessária para sustentar essa afirmação não estiver válida.

## 6. Auditoria

Mudanças de estado devem ser registradas com:

- snapshot afetado;
- estado anterior;
- novo estado;
- momento da detecção;
- motivo;
- consequência para a recomendação.

## 7. Limites

Os estados são contratos internos conceituais. Não representam códigos ou estados oficiais da SED e não autorizam integração técnica antes da homologação da fonte.