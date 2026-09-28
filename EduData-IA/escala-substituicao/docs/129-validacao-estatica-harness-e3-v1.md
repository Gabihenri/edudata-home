# 129 — Validação Estática do Harness E3-H01–H18 v2

Data: 2026-09-28
Status: VALIDAÇÃO ESTÁTICA PASS / EXECUÇÃO POSTGRESQL REAL PENDENTE

## 1. Escopo

Foi realizada revisão do arquivo:

EduData-IA/escala-substituicao/tests/e3-invariants-harness.postgres.test.sql

A revisão verificou:
- sintaxe estrutural aparente do SQL;
- correspondência entre colunas e valores dos INSERTs;
- cobertura dos 18 casos;
- ordem das regras de decisão;
- correspondência entre resultado esperado e regra implementada;
- separação entre vigência da Associação e vigência da Grade;
- representação contextual de múltiplas associações.

## 2. Resultado

Os 18 casos possuem fixture e estado esperado.

A lógica de avaliação implementa, em ordem:
1. ocorrência não homologada;
2. escola ausente;
3. proveniência ausente;
4. concomitância não resolvida;
5. tentativa de inferência;
6. DI ausente;
7. DI divergente;
8. associação ausente;
9. Grade ausente;
10. vigência da Associação inválida;
11. vigência da Grade inválida;
12. resolução.

Essa ordem é compatível com o princípio de fail closed do contrato E3.

## 3. Fortalecimentos realizados

### H15 — vigência da Associação
Agora possui association_valid_from e association_valid_until próprios. O caso bloqueia porque a ocorrência está fora da vigência da Associação.

### H16 — vigência da Grade
Agora possui grade_valid_from e grade_valid_until próprios. O caso bloqueia porque a ocorrência está fora da vigência da Grade.

### H17 — múltiplas associações
Agora utiliza o mesmo association_context_key de H01, mas com associação/Grade distintos, permitindo representar duas associações no mesmo contexto lógico sem colapsá-las.

Isso ainda é uma fixture sintética. A cardinalidade oficial SED permanece dependente do artefato E3.

## 4. Resultado lógico esperado

Todos os 18 fixtures possuem estado esperado compatível com a expressão CASE atual.

Resultado lógico esperado:

E3_HARNESS_CASE_COUNT = 18
E3_HARNESS_PASS_COUNT = 18
E3_HARNESS_FAIL_COUNT = 0

Esse resultado é uma validação estática da lógica, não uma execução PostgreSQL.

## 5. Limitação

A execução PostgreSQL remota anteriormente acionada não retornou um resultado utilizável.

O ambiente local também não possui cliente ou servidor PostgreSQL disponível.

Portanto, não é permitido registrar:

POSTGRESQL_EXECUTED = PASS

O estado correto permanece:

POSTGRESQL_EXECUTED = PENDING

## 6. Conclusão

O harness está logicamente consistente para os 18 casos atuais e foi fortalecido nos pontos de temporalidade e multiplicidade identificados na auditoria.

A aprovação estática é verde.

A aprovação de execução PostgreSQL continua pendente e não será simulada.

Nenhuma alteração de produção foi realizada.

## Atualização pós-auditoria — 28/09/2026

Foi identificada e corrigida uma lacuna semântica no harness v3:

- **E3-H10** declarava testar não retroatividade, mas o avaliador não verificava a data de efetivação da substituição. O fixture agora registra `substitution_effective_date` e o avaliador bloqueia uma substituição de docente diferente quando sua efetivação é ausente ou não posterior à ocorrência original.
- **E3-H13** declarava múltiplos DIs, mas a fixture representava apenas uma divergência simples. Foi acrescentado `di_context_count`; o caso H13 agora possui dois contextos de DI e resulta em `SOURCE_UNCERTAIN`.
- Todas as 18 fixtures possuem agora a mesma aridade estrutural da tabela temporária.
- O arquivo continua sendo **fixture sintética isolada** e não contém identificadores reais da SED.

Commit do harness corrigido: `9fb4d30e3aae6ad14a12c852b60330d67b873d5f`.

### Estado de validação

**PASS estrutural/estático:** 18 casos previstos, sem inconsistência de aridade após a correção.

**PostgreSQL real:** ainda **PENDENTE**. O ambiente local desta etapa não possui cliente/servidor PostgreSQL disponível; portanto não há declaração de execução real para esta revisão.

A correção não altera o gate E3: fonte operacional SED, chaves, Associação ↔ Grade, vigência, publicação e proveniência continuam não homologadas para produção.
