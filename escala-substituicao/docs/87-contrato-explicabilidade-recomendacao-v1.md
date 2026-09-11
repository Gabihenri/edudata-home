# Escala de Substituição — Contrato de Explicabilidade da Recomendação v1

**Status:** CONCEITUAL / HARNESS-SAFE  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 11/09/2026

## 1. Objetivo

A recomendação do motor deve ser compreensível em poucos segundos pela pessoa responsável pela cobertura. O sistema não deve apresentar somente um nome e uma pontuação: deve mostrar **por que a recomendação foi produzida, quais restrições foram aplicadas e quais alternativas foram descartadas**.

## 2. Princípio de apresentação

A interface deve responder imediatamente a quatro perguntas:

1. **Quem foi recomendado?**
2. **Por que foi recomendado?**
3. **Quem poderia ser alternativa?**
4. **O que impede os demais candidatos?**

A explicação é informativa e auditável; não transforma recomendação em atribuição automática.

## 3. Estrutura da recomendação

Cada recomendação deverá possuir, conceitualmente:

```text
recommendation
├── occurrence
├── selected_candidate
├── decision_state
├── score_summary
├── positive_factors[]
├── alternatives[]
├── rejected_candidates[]
│   └── blocking_reasons[]
├── conflicts_avoided[]
├── uncovered[]
├── rule_set_version
└── snapshot_reference
```

## 4. Resumo executivo

O primeiro nível da interface deve ser curto:

> **Professor P2 recomendado para O1**  
> Cobertura global preservada; candidato elegível e disponível; P1 reservado para outra ocorrência simultânea.

O texto acima é apenas um exemplo sintético. Não representa regra oficial nem dados reais.

## 5. Fatores positivos

O sistema deve listar somente fatores efetivamente utilizados pelo cálculo, por exemplo:

- elegibilidade confirmada no snapshot;
- disponibilidade compatível;
- correspondência de componente, se homologada;
- continuidade, se homologada;
- menor conflito com as demais ocorrências;
- contribuição para maximização da cobertura.

Não apresentar como fato um critério que não participou do cálculo.

## 6. Alternativas

As alternativas devem ser ordenadas de forma determinística e apresentar, quando aplicável:

- candidato;
- score;
- diferença em relação ao selecionado;
- fator que explica a posição;
- eventual conflito.

A lista não deve sugerir que uma alternativa é válida quando ela foi eliminada por restrição dura.

## 7. Candidatos rejeitados

O sistema deve explicar a exclusão com reason codes estáveis. Exemplos conceituais:

| Código | Significado |
|---|---|
| `INELIGIBLE` | requisito de elegibilidade não atendido |
| `UNAVAILABLE` | indisponibilidade no intervalo |
| `TEMPORAL_CONFLICT` | conflito com outra ocorrência escolhida |
| `OUT_OF_SCOPE` | escopo/unidade incompatível |
| `HARD_CONSTRAINT_BLOCKED` | outra restrição obrigatória |

Esses códigos são contratos internos do motor, não códigos técnicos da SED.

## 8. Conflitos evitados

Quando a decisão global deslocar um candidato de sua melhor posição individual para melhorar o plano conjunto, a interface deve explicar isso explicitamente.

Exemplo sintético:

> P1 tinha maior score para O1, mas foi reservado para O3 porque essa troca mantém três ocorrências cobertas em vez de duas.

Esse tipo de explicação é central para diferenciar a Escala de um ranking simples.

## 9. Resultado uncovered

Quando não houver cobertura possível, mostrar:

- ocorrência sem cobertura;
- motivo;
- candidatos considerados;
- restrições que impediram cada alternativa;
- possibilidade de intervenção humana/remanejamento, sem afirmar que ela é permitida pela SED antes da homologação da regra.

Exemplo:

> **O2 sem recomendação automática** — nenhum candidato elegível e disponível no snapshot atual.

## 10. Estado da decisão

Estados conceituais mínimos:

- `RECOMMENDATION_READY` — recomendação calculada;
- `HUMAN_VALIDATION_REQUIRED` — aguardando decisão autorizada;
- `HUMAN_CONFIRMED` — recomendação confirmada;
- `HUMAN_OVERRIDDEN` — pessoa autorizada alterou a recomendação;
- `HUMAN_REJECTED` — recomendação rejeitada;
- `UNCOVERED` — nenhuma solução admissível encontrada.

A transição para `HUMAN_CONFIRMED` exige ação explícita da pessoa autorizada.

## 11. Override e auditoria

Um override nunca deve apagar a recomendação original. Deve preservar:

- plano algorítmico original;
- decisão humana;
- motivo informado para override, quando disponível;
- identidade do ator autorizado, quando o contrato de identidade estiver homologado;
- instante da ação;
- snapshot e rule-set usados.

## 12. Privacidade e minimização

A explicação deve usar o mínimo de dados pessoais necessário. CPF, DI ou identificadores sensíveis não devem ser exibidos na tela de recomendação por padrão apenas porque existam na fonte futura.

A camada de apresentação deve trabalhar preferencialmente com identificadores de exibição apropriados ao perfil autorizado.

## 13. Determinismo

A mesma entrada e o mesmo rule-set devem produzir:

- mesma recomendação;
- mesma ordem de alternativas;
- mesmos reason codes;
- mesma assinatura do plano.

## 14. Relação com o motor

O contrato de explicabilidade depende do comportamento definido no Audit 85 e dos testes adversariais/matriz de regressão. Não altera a função objetivo nem relaxa restrições duras.

## 15. Limites

Este documento não define schema de produção, IDs SED, API, parser ou regra oficial de atribuição. Toda regra dependente da SED permanece condicionada ao fechamento do GATE-FONTE-SED.

**Conclusão:** a recomendação da Escala deverá ser rápida de entender, tecnicamente explicável e integralmente auditável, sem automatizar a decisão administrativa.