# Contrato Físico — Vaga de Substituição v1

**Produto:** Escala de Substituição  
**Camada:** Core operacional  
**Status:** Especificação — não é DDL de produção  
**Gate:** RED / BLOCKED

## 1. Objetivo

Definir o contrato físico mínimo para representar uma vaga de substituição derivada de uma obrigação letiva oficial e de uma ausência docente homologada, preservando rastreabilidade, idempotência, integridade institucional e possibilidade de auditoria.

Fluxo canônico:

`official_schedule_occurrence → absence → substitution_vacancy → candidates → allocation`

A vaga não é uma ocorrência inventada pelo motor. Ela representa uma obrigação oficial existente que ficou sem docente em razão de uma ausência elegível.

## 2. Princípios

1. A ocorrência oficial é a unidade primária da obrigação.
2. A ausência não cria uma vaga sem uma ocorrência compatível.
3. Somente ocorrência proveniente de versão publicada da grade pode alimentar a vaga.
4. A ausência deve estar confirmada e cobrir temporalmente a ocorrência.
5. Organização e escola devem coincidir entre ocorrência, ausência e vaga.
6. A mesma ocorrência não pode possuir duas vagas ativas simultaneamente.
7. A relação `(occurrence_id, absence_id)` deve ser idempotente.
8. A vaga deve preservar a proveniência da ocorrência, da versão da grade e da ausência.
9. Cancelamento de ausência não pode resultar em vaga ativa.
10. Nenhum nome, e-mail, CPF ou combinação textual pode substituir os identificadores acadêmicos homologados.

## 3. Entidade proposta: `substitution_vacancies`

### Identidade

- `id` — UUID, chave primária.
- `occurrence_id` — FK para `official_schedule_occurrences.id`, obrigatório.
- `absence_id` — FK para entidade oficial/homologada de ausência, obrigatório.

### Escopo institucional

- `organization_id` — obrigatório.
- `school_id` — obrigatório.

Esses campos devem ser coerentes com a ocorrência e a ausência. A duplicação é intencional para facilitar escopo, RLS e auditoria, mas não deve substituir as FKs/provas de integridade de origem.

### Proveniência da grade

- `schedule_version_id` — FK para `official_schedule_versions.id`, obrigatório.
- `source_reference` — referência técnica à publicação/origem, quando disponível.
- `source_hash` — hash da origem publicada, quando disponível.

`schedule_version_id` deve corresponder à versão da ocorrência. A versão precisa estar em estado publicável/publicado segundo o contrato da grade.

### Estado da vaga

Estados mínimos:

- `active` — vaga elegível para geração de candidatos/alocação.
- `cancelled` — vaga invalidada por cancelamento da ausência, cancelamento da ocorrência ou outra regra formal de invalidação.
- `resolved` — vaga cuja obrigação já recebeu alocação confirmada.
- `blocked` — vaga existente, mas impedida por regra e não disponível ao fluxo normal.

A implementação pode ampliar o catálogo posteriormente, sem misturar estado da vaga com estado da decisão de alocação.

### Auditoria temporal

- `created_at` — obrigatório.
- `updated_at` — obrigatório.
- `cancelled_at` — nullable.
- `resolved_at` — nullable.

O histórico de decisões e ações administrativas permanece no mecanismo central de auditoria do EIOS/Identity; esta entidade não cria um segundo ledger.

## 4. Invariantes obrigatórios

### VAC-PHY-01 — ocorrência obrigatória

Toda vaga deve apontar para exatamente uma ocorrência oficial.

### VAC-PHY-02 — ausência obrigatória

Toda vaga deve apontar para exatamente uma ausência registrada.

### VAC-PHY-03 — versão da grade

`substitution_vacancies.schedule_version_id = official_schedule_occurrences.schedule_version_id`.

### VAC-PHY-04 — escopo

`organization_id` e `school_id` da vaga devem coincidir com os respectivos valores da ocorrência e da ausência.

### VAC-PHY-05 — uma vaga ativa por ocorrência

Deve existir no máximo uma vaga com estado `active` para cada `occurrence_id`.

Recomendação física: índice único parcial sobre `occurrence_id WHERE status = 'active'`.

### VAC-PHY-06 — idempotência

A mesma combinação `(occurrence_id, absence_id)` não pode gerar registros duplicados.

Recomendação física: `UNIQUE (occurrence_id, absence_id)`.

### VAC-PHY-07 — ausência elegível

Uma ausência `pending` ou `cancelled` não pode produzir vaga `active`.

### VAC-PHY-08 — cobertura temporal

Para uma ausência intervalar cobrir integralmente a ocorrência:

`absence.start_time <= occurrence.start_time` **e** `absence.end_time >= occurrence.end_time`.

A regra é distinta da regra de conflito entre dois intervalos. Limites exatamente coincidentes contam como cobertura.

### VAC-PHY-09 — ocorrência publicada

Uma ocorrência derivada de versão `draft`, `validated`, `superseded`, `revoked` ou equivalente não vigente não pode gerar vaga ativa sem uma regra explícita de publicação vigente.

### VAC-PHY-10 — proveniência preservada

A vaga deve permitir reconstruir, sem inferência textual:

`vaga → ocorrência → versão publicada → ausência`.

## 5. Relação com o motor

A criação da vaga deve ocorrer antes da seleção de candidatos.

O motor recebe uma vaga já validada e calcula candidatos conforme:

1. restrições duras;
2. elegibilidade;
3. qualificação;
4. aderência disciplinar/área;
5. disponibilidade;
6. continuidade;
7. critérios preferenciais definidos na versão vigente das regras.

A tabela de vagas não deve armazenar uma pontuação definitiva de candidato como substituto do resultado de uma execução do motor.

## 6. Idempotência e concorrência

O fluxo de materialização deve ser seguro contra reprocessamento da mesma ausência/ocorrência.

A proteção deve existir no banco, não apenas no código de aplicação.

Requisitos mínimos:

- chave única `(occurrence_id, absence_id)`;
- no máximo uma vaga `active` por ocorrência;
- operação de materialização tolerante a reprocessamento;
- transação atômica entre validação da origem e persistência da vaga.

## 7. Cancelamento e reprocessamento

Se a ausência que originou a vaga for cancelada, a vaga ativa não deve permanecer elegível.

A estratégia recomendada é preservar o registro e mudar seu estado para `cancelled`, mantendo a proveniência e o histórico.

Se uma nova ausência válida assumir a mesma ocorrência, a nova vaga não deve coexistir com outra vaga ativa. O processo deve primeiro resolver a situação da vaga anterior conforme as regras de negócio e auditoria.

## 8. RLS e autorização

A entidade deve nascer protegida por RLS quando for criada em schema exposto pelo Supabase.

O acesso deve combinar:

- usuário autenticado;
- associação à organização/escola;
- escopo institucional efetivo;
- permissão específica do produto Escala;
- operação autorizada.

Não usar `TO authenticated` como autorização suficiente.

Permissões previstas no catálogo do produto incluem:

- `escala.view_vacancies`
- `escala.run_engine`
- `escala.confirm_substitution`
- `escala.override_decision`
- `escala.view_audit`

A implementação física deve aguardar a homologação do produto `escala` no catálogo de permissões.

## 9. O que NÃO deve entrar nesta tabela

Não armazenar como chave canônica:

- nome do professor;
- e-mail do professor;
- CPF como identificador interno permanente sem contrato explícito da fonte;
- nome textual da turma;
- nome textual do componente;
- posição da planilha;
- combinação textual usada para fuzzy matching;
- pontuação de candidato como identidade da vaga;
- cópia independente da grade oficial.

## 10. Dependências de homologação

Antes do DDL de produção, precisam estar comprovados:

1. artefato técnico real da Grade Horária/Associação Professor–Classe da SEDUC;
2. identificador oficial do docente;
3. identificador oficial da turma;
4. código/identificador oficial do componente;
5. modelo físico definitivo de `official_schedule_occurrences`;
6. modelo físico definitivo de ausências;
7. ponte Auth ↔ identidade acadêmica docente;
8. catálogo de permissões `escala`;
9. RLS efetivamente testado;
10. execução PostgreSQL do harness de ocorrência → vaga.

## 11. Decisão arquitetural

**Aprovado como contrato lógico/físico preliminar.**

**Não aprovado para migração de produção.**

A implementação deve permanecer sintética/harness até que as dependências críticas sejam homologadas.

## 12. Evidência de teste relacionada

Harness anterior:

`tests/occurrence-vacancy.postgres.test.sql`

Commit: `c10a8b57b6a4e357b2c3d0384e3a563859e8728f`

O harness cobre publicação, ausência confirmada, cobertura temporal, idempotência, cancelamento, unicidade de vaga ativa e proveniência.

## 13. Gate

**RED / BLOCKED**

O contrato pode orientar os próximos testes e a futura migration, mas não autoriza criação das tabelas em produção enquanto as dependências de fonte, identidade, PostgreSQL e segurança permanecerem abertas.
