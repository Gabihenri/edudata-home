# Auditoria do Harness de Pontuação e Ranking v1

**Produto:** Escala de Substituição  
**Artefato auditado:** `tests/candidate-score-ranking.postgres.test.sql`  
**Commit auditado:** `6ebf7644324f99bed05d3b084d20b1cf226556f8`  
**Blob auditado:** `11ba69ca22229f828f1ba0d7f15a6f2190a5e117`  
**Data desta revalidação:** 2026-09-10  
**Gate de produção:** 🔴 RED / BLOCKED

## 1. Objetivo

Revalidar o harness sintético de PostgreSQL responsável por verificar o contrato de pontuação e ranking após a elegibilidade HARD, distinguindo falhas reais do arquivo de erros introduzidos em consultas manuais de teste.

## 2. Correção de evidência sobre o `run_id`

A tentativa anterior de execução apresentou uma violação de FK envolvendo o UUID `90000000-0000-0000-0000-000000000008`. A rechecagem do blob atual do repositório **não encontrou esse UUID como `run_id`** no arquivo.

O arquivo armazenado utiliza os runs:

- `90000000-0000-0000-0000-000000000001` → `score-v1`;
- `90000000-0000-0000-0000-000000000002` → `score-v2`.

Conclusão: a falha `...0008` não deve ser atribuída ao repositório. Ela pertenceu à consulta manual reconstruída na tentativa anterior e fica desconsiderada como defeito do arquivo.

## 3. Falha semântica confirmada — GATE-06

O candidato `007` possui:

- `proximity = 1`;
- `proximity_evidence_status = 'not_available'`.

A função `calculate_score()` usa diretamente `c.proximity * w.proximity_weight`, sem transformar `not_available` em contribuição efetiva zero.

O GATE-06 compara o score do candidato `007` com o candidato `001`, que possui a mesma proximidade numérica, mas evidência `homologated`.

Foi executada uma reprodução isolada dessa mesma lógica no PostgreSQL do projeto `ihchzfndmdwtoabttkil`. Resultado:

| Candidato | Score | Evidência | Resultado |
|---|---:|---|---|
| 001 | 100.000 | homologated | referência |
| 007 | 100.000 | not_available | **FAIL: GATE-06** |

Portanto, o problema é real e está na semântica do harness: a ausência de evidência é registrada, mas não afeta o cálculo.

### Correção obrigatória

A regra de SCORE-06 deve ser aplicada de forma única no cálculo e no breakdown:

- `homologated` → usa o valor homologado;
- `not_available` → contribuição efetiva `0` e razão `PROXIMITY_NOT_AVAILABLE`;
- `invalid` → não pode produzir mérito; deve resultar em contribuição efetiva `0` ou bloqueio, conforme o contrato final.

## 4. Divergência de desempate

O contrato define como quarto desempate **menor número de substituições válidas**. O harness atual usa `distribution_balance DESC` nessa posição.

São conceitos diferentes. Distribuição balanceada pode ser um critério de score, mas não substitui o desempate explícito por quantidade de substituições válidas.

### Correção obrigatória

Adicionar ao cenário sintético `valid_substitutions_count` e testar a ordem contratual:

1. score total DESC;
2. componente DESC;
3. área DESC;
4. continuidade DESC;
5. `valid_substitutions_count` ASC;
6. identificador técnico acadêmico homologado ASC.

## 5. Identificador de desempate ainda não comprovado como homologado

O harness utiliza `teacher_id_homologated boolean`, mas isso demonstra apenas um estado lógico. Não demonstra que o UUID usado como desempate é realmente o identificador técnico acadêmico proveniente de uma fonte homologada.

### Correção

Representar explicitamente o identificador técnico homologado e sua proveniência, ou vincular o cenário a um contrato de identidade acadêmica já homologado.

## 6. Breakdown v2 incompleto

A materialização `score-v2` registra apenas `{"rule_set_version":"score-v2"}`, enquanto a v1 registra critérios, pesos, valores normalizados e evidência.

Para cumprir o requisito de reconstruibilidade histórica, o breakdown v2 deve registrar a mesma estrutura semântica, com a versão alterada.

## 7. O que permanece válido

- Os pesos v1/v2 totalizam 100.
- O score é limitado a 0–100.
- Candidatos inelegíveis não entram na materialização normal de score.
- O breakdown v1 possui contribuições individualizadas.
- A mudança de rule set está representada por runs distintos.
- Existe captura histórica temporária de v1 antes da materialização v2.
- O teste é sintético e isolado.
- O arquivo não cria tabelas de produção.

## 8. Limites da evidência atual

A reprodução PostgreSQL confirmou a falha semântica de GATE-06, mas **não equivale à execução integral do arquivo do repositório**. A execução integral deve ocorrer depois da correção do harness, usando exatamente o arquivo versionado, sem reconstrução manual.

Também permanece a limitação estrutural de que o harness é contratual/assertivo: ele não é ainda o motor real de produção.

## 9. Dependências que continuam bloqueando produção

1. artefato técnico/API/export da Grade Horária oficial da SEDUC;
2. identificador oficial homologado de professor;
3. identificador oficial homologado de turma;
4. código/ID oficial homologado de componente;
5. ponte Auth ↔ identidade acadêmica docente;
6. catálogo de permissões e RLS da Escala;
7. execução integral dos harnesses em PostgreSQL;
8. DDL físico de produção de vagas, candidatos e alocações;
9. versão final do motor de regras.

## 10. Decisão

**🔴 RED / BLOCKED.**

O contrato de pontuação/ranking continua utilizável como base de implementação, mas o harness **não está aprovado**.

A próxima ação é corrigir o arquivo `tests/candidate-score-ranking.postgres.test.sql` em um único commit controlado, começando por GATE-06, e então executar o arquivo completo exatamente como versionado no PostgreSQL. Somente após todos os gates passarem será produzida a evidência de aprovação do harness.
