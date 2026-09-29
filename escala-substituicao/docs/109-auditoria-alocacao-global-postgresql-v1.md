# 109 — Auditoria de Alocação Global — PostgreSQL v1

**Data:** 29/09/2026  
**Status:** HARNESS VALIDADO / PRODUÇÃO BLOQUEADA  
**GATE-FONTE-SED:** RED / BLOCKED

## Resultado

Foi criado e executado o harness declarativo:

`tests/global-allocation-postgres.test.sql`

no PostgreSQL real do projeto Supabase `ihchzfndmdwtoabttkil`.

Resultado final:

- **13 casos executados**
- **13 PASS**
- **0 FAIL**

Casos validados:

- A01 — cobertura precede qualidade;
- A02 — qualidade é objetivo secundário;
- A03 — desempate determinístico;
- A04 — candidato inelegível com score maior é excluído;
- A05 — não reutilização global de docente em ocorrências simultâneas;
- A06 — conflito temporal impede reutilização;
- A07 — ausência de candidato válido produz uncovered;
- A08 — solução parcial preserva uncovered;
- A09 — resultado permanece sujeito a validação humana;
- A10 — mesma entrada produz assinatura determinística;
- A11 — alteração de pesos não contorna HARD constraint;
- A12 — ocorrências distintas permanecem distintas;
- A13 — múltiplas associações permanecem contextuais, sem seleção automática.

## Invariante central

A ordem validada é:

1. restrições duras;
2. construção das combinações admissíveis;
3. maximização da cobertura;
4. maximização da qualidade;
5. desempate determinístico;
6. explicação;
7. validação humana.

Uma solução de menor cobertura nunca pode vencer apenas por possuir score agregado maior.

## Segurança do teste

O harness utiliza apenas tabelas temporárias e termina com `ROLLBACK`. Não houve alteração persistente do schema de produção.

O harness antigo `global-allocation-v1.sql` e o adversarial `global-allocation-adversarial-v1.sql` continuam sendo referências históricas/sintéticas. A evidência executável consolidada desta auditoria é o novo harness declarativo.

## Limites

A validação não homologa:

- IDs da SED;
- Grade Horária real;
- Associação Professor–Classe real;
- identidade acadêmica real;
- disponibilidade oficial real;
- qualificação oficial real;
- permissões/RLS da Escala;
- DDL produtivo;
- parser/importador;
- atribuição automática.

## Conclusão

O comportamento lógico do algoritmo de alocação global possui evidência de execução PostgreSQL real com **13/13 casos aprovados**.

O motor permanece uma camada de **recomendação determinística**, nunca uma efetivação administrativa automática.

Próximo gate: persistência/rodada, invalidação por mudança material, concorrência e preservação da recomendação original diante de override humano.
