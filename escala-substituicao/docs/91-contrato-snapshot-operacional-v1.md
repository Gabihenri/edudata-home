# Escala de Substituição — Contrato de Snapshot Operacional v1

**Status:** CONCEITUAL / HARNESS-SAFE  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 11/09/2026

## 1. Objetivo

O motor precisa decidir sobre uma fotografia coerente do estado da escola. Uma recomendação não deve misturar, sem rastreabilidade, disponibilidade de um instante com ocorrências ou associações de outro.

O **snapshot operacional** é a referência imutável utilizada pelo cálculo de uma rodada de alocação.

## 2. Conceito

```text
FONTES AUTORIZADAS
      ↓
NORMALIZAÇÃO
      ↓
SNAPSHOT OPERACIONAL
      ↓
MOTOR DE ALOCAÇÃO
      ↓
RECOMENDAÇÃO
      ↓
VALIDAÇÃO HUMANA
```

O snapshot não substitui a fonte oficial. Ele registra o estado observado e autorizado para aquela rodada.

## 3. Conteúdo conceitual mínimo

Um snapshot deverá identificar:

- `snapshot_reference`;
- instante de captura;
- referência temporal operacional;
- versão das regras (`rule_set_version`);
- ocorrências consideradas;
- candidatos considerados;
- disponibilidade;
- elegibilidade;
- escopo/unidade aplicável;
- associações e vigências que tenham sido homologadas;
- versão/proveniência das fontes utilizadas;
- estado de completude.

Os identificadores acima são nomes conceituais e não correspondem a colunas ou IDs da SED.

## 4. Imutabilidade

Depois que uma rodada do motor começar, alterações posteriores nas fontes não devem modificar retroativamente o snapshot daquela rodada.

Se o estado mudar, uma nova rodada deve usar novo snapshot ou uma política explicitamente definida para atualização.

## 5. Completude

O snapshot deve declarar se está:

- `COMPLETE` — todas as entradas necessárias foram obtidas e validadas;
- `PARTIAL` — existem lacunas conhecidas;
- `STALE` — a informação não atende à janela temporal exigida;
- `INVALID` — falha de consistência/proveniência.

O motor não deve tratar `PARTIAL`, `STALE` ou `INVALID` como equivalente a uma fotografia completa.

## 6. Janela temporal

A captura deve registrar explicitamente o período ao qual cada informação se refere. Uma informação válida em determinado horário não deve ser apresentada como se fosse válida para outro período sem regra homologada.

Particularmente, disponibilidade, ocorrência, associação e vigência devem ser avaliadas em relação ao intervalo da necessidade de cobertura.

## 7. Reprodutibilidade

Uma decisão deve poder ser reexecutada conceitualmente a partir de:

```text
snapshot_reference
+ rule_set_version
+ input signature
+ algorithm version
```

O resultado esperado é a mesma solução determinística definida nos Audits 84–86.

## 8. Mudança durante a operação

Se uma nova ausência, retorno, indisponibilidade ou outra alteração relevante ocorrer enquanto uma rodada estiver sendo validada, ela não deve ser incorporada silenciosamente à decisão anterior.

A interface deve indicar que o estado mudou e permitir uma nova rodada quando apropriado.

## 9. Proveniência

Para cada conjunto de dados utilizado, deve ser possível responder futuramente:

- qual foi a fonte;
- qual versão/extração foi utilizada;
- quando foi observada;
- qual transformação foi aplicada;
- qual regra autorizou seu uso.

## 10. Segurança

Snapshot não significa autorização para ampliar escopo de acesso. Cada usuário deve receber somente as informações permitidas pelo seu perfil e pela unidade/contexto autorizado.

## 11. Limites

Este contrato não define tabelas físicas, parser, endpoint, identificadores ou formato de exportação da SED. O fechamento do GATE-FONTE-SED continua obrigatório antes de qualquer integração produtiva.
