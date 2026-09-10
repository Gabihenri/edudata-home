# Escala de Substituição — Auditoria do Harness de Elegibilidade de Candidatos v1

**Artefato:** `tests/candidate-eligibility-hard-rules.postgres.test.sql`

**Escopo:** auditoria estática do harness sintético das HARD rules de elegibilidade.

**Data:** 2026-09-10

## 1. Resultado executivo

**Gate: 🔴 RED / BLOCKED**

O harness cobre estruturalmente as principais restrições duras e preserva razões individuais de bloqueio. Entretanto, a auditoria encontrou uma inconsistência material no cenário **T07**: a obrigação oficial `15:00–15:30` não se sobrepõe à vaga `14:20–15:10`? Na realidade, há sobreposição entre `15:00` e `15:10`. O cenário está rotulado como não conflito e o candidato é marcado como `eligible`, portanto o caso não representa corretamente a HARD-04.

A correção deve ocorrer antes de considerar a camada de elegibilidade validada.

## 2. Matriz de controles

| ID | Controle | Status | Evidência / observação |
|---|---|---|---|
| HARD-AUD-01 | Identidade docente homologada bloqueia candidato não homologado | 🟢 | T02 representa falha de HARD-01. |
| HARD-AUD-02 | Escopo institucional/operacional | 🟢 | T03 representa falha de HARD-02. |
| HARD-AUD-03 | Indisponibilidade confirmada | 🟢 | T06 usa intervalo sobreposto e bloqueia HARD-03. |
| HARD-AUD-04 | Conflito com obrigação oficial | 🔴 | T07 está semanticamente inconsistente: `15:00–15:30` sobrepõe `14:20–15:10`, mas foi marcado como não conflito. |
| HARD-AUD-05 | Conflito com substituição confirmada | 🟢 | T08 usa `14:50–15:20` e bloqueia HARD-05. |
| HARD-AUD-06 | Qualificação | 🟢 | T04 representa incompatibilidade de qualificação. |
| HARD-AUD-07 | Impedimento administrativo | 🟢 | T05 representa bloqueio administrativo. |
| HARD-AUD-08 | Múltiplas violações preservadas | 🟢 | T09 preserva quatro falhas independentes. |
| HARD-AUD-09 | Regra de fronteira temporal | 🟢 | T10 demonstra que `15:10` exatamente na borda não é conflito. |
| HARD-AUD-10 | Execução PostgreSQL real | 🟡 | O harness é SQL sintético, mas ainda não há evidência de execução no PostgreSQL real. |
| HARD-AUD-11 | Integração com dados oficiais | 🔴 | A fonte técnica homologada da grade SEDUC ainda não foi conectada ao fluxo real. |
| HARD-AUD-12 | RLS/permissões de produção | 🔴 | O catálogo `escala` e as permissões/RLS de produção ainda não estão homologados. |

## 3. Regra temporal auditada

A relação de conflito deve usar:

```text
A.start < B.end AND B.start < A.end
```

Assim:

- `14:20–15:10` × `15:00–15:30` = **conflito**;
- `14:20–15:10` × `15:10–16:00` = **não conflito**.

O harness já contém o segundo caso corretamente em T10, mas T07 precisa ser corrigido para representar o primeiro.

## 4. Natureza do harness

O artefato é um **harness de contrato/assertion**, não ainda uma implementação do motor. Os resultados de `candidate_rule_results` são inseridos explicitamente para verificar invariantes e gates; eles não demonstram que um motor produtivo calculou automaticamente cada HARD rule a partir das tabelas-fonte.

Isso é aceitável nesta etapa de especificação, mas deve permanecer explícito na transição para implementação.

## 5. Correção obrigatória antes do próximo avanço

Corrigir T07 em um único artefato, preservando T10 como caso de fronteira. A opção adotada deve fazer T07 representar uma sobreposição real e resultar em candidato **inelegível**, com `HARD-04 = false`.

Após a correção, a auditoria deve ser revalidada. Somente então a camada de pontuação/ranking poderá ser especificada, mantendo a regra fundamental:

> **nenhum score pode superar uma HARD rule reprovada.**

## 6. Bloqueios de produção permanecentes

Mesmo após a correção do harness, permanecem críticos:

1. artefato técnico real da Grade Horária/Associação Professor–Classe da SEDUC;
2. identificador oficial do docente;
3. identificador oficial da turma;
4. código/identificador oficial do componente curricular;
5. ponte Auth → identidade acadêmica docente homologada;
6. permissões e RLS do produto Escala;
7. execução dos harnesses em PostgreSQL real;
8. DDL físico produtivo de vagas, candidatos e alocações;
9. versão final do motor de regras.

**Conclusão:** a camada de elegibilidade está conceitualmente bem estruturada, mas permanece **RED/BLOCKED** até a correção de T07 e posterior validação.