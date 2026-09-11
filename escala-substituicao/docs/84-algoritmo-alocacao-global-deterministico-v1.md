# 84 — Algoritmo determinístico de alocação global v1

**Data:** 2026-09-11  
**Status:** CONCEITUAL / HARNESS-SAFE  
**GATE-FONTE-SED:** RED/BLOCKED

## 1. Princípio

A Escala deve escolher um **plano conjunto**, não o melhor candidato de cada ocorrência isoladamente.

A decisão é lexicográfica:

1. maximizar ocorrências cobertas;
2. entre planos com a mesma cobertura, maximizar qualidade total;
3. favorecer critérios secundários homologados;
4. aplicar desempate determinístico.

Nenhum score pode compensar uma restrição dura.

## 2. Construção do espaço de soluções

Para cada ocorrência `O`, gerar somente candidatos que satisfaçam todas as restrições duras.

Uma solução é um conjunto de pares `(O, P)` no qual:

- cada ocorrência possui no máximo um professor;
- um professor não aparece em duas ocorrências com sobreposição temporal incompatível;
- todas as regras de elegibilidade, disponibilidade, vínculo e escopo foram satisfeitas;
- cada escolha permanece rastreável ao snapshot de entrada e ao rule-set.

Ocorrências sem candidato válido podem permanecer `uncovered`.

## 3. Estratégia determinística

Para o harness v1, usar busca exaustiva limitada ao conjunto sintético. Isso permite validar a semântica antes de escolher uma implementação de produção.

Pseudocódigo:

```text
best = plano vazio

para cada combinação possível de candidatos por ocorrência:
    rejeitar se violar restrição dura
    rejeitar se houver conflito temporal do mesmo professor

    cobertura = número de ocorrências cobertas
    qualidade = soma dos scores das alocações
    assinatura = lista ordenada (occurrence_id, teacher_id)

    comparar com best por:
      1. cobertura DESC
      2. qualidade DESC
      3. critérios secundários homologados DESC/ASC conforme rule-set
      4. assinatura ASC

retornar best + alternativas elegíveis + motivos das exclusões
```

A assinatura final evita resultados instáveis quando dois planos possuem exatamente o mesmo valor objetivo.

## 4. Exemplo de consequência

Se `P1` é o melhor candidato individual para `O1`, mas também é o único candidato forte para `O3`, o algoritmo pode atribuir `P1 → O3` e `P2 → O1` se isso mantiver maior cobertura/qualidade global.

Portanto, o ranking por vaga permanece útil como componente explicativo, mas **não é o algoritmo final de alocação**.

## 5. Caso de empate

Quando dois planos apresentam a mesma cobertura e o mesmo valor objetivo, o desempate deve ser determinístico e reproduzível.

Não usar aleatoriedade.

A regra de desempate só pode utilizar campos cujo significado esteja homologado no contrato de produção. No harness sintético, a assinatura ordenada dos identificadores fictícios é suficiente.

## 6. Caso parcial

Se nenhum plano cobre todas as ocorrências, retornar o plano de maior cobertura. As ocorrências restantes recebem `uncovered` com `reason_code` explícito.

Isso é preferível a uma solução artificial que viole disponibilidade, elegibilidade ou conflito temporal.

## 7. Explicabilidade

Para cada ocorrência:

- selecionado;
- score;
- alternativas elegíveis;
- candidatos eliminados;
- restrições responsáveis pela eliminação;
- conflitos que o plano evitou;
- rule-set;
- snapshot temporal;
- estado `HUMAN_VALIDATION_REQUIRED`.

## 8. Escalabilidade — decisão futura

A busca exaustiva é adequada ao harness e a pequenos conjuntos. Não deve ser assumida como implementação de produção para uma escola inteira sem benchmark.

Quando a fonte oficial estiver homologada, comparar abordagens como backtracking com poda, matching/alocação ponderada ou solver de otimização, preservando exatamente a função objetivo e as restrições homologadas.

## 9. Limites

Este documento não autoriza parser, DDL, API ou integração com a SED. Identificadores reais, chaves e regras oficiais permanecem condicionados ao GATE-FONTE-SED.

**Conclusão:** a semântica do motor agora é determinística, global e testável independentemente da fonte técnica da SED.
