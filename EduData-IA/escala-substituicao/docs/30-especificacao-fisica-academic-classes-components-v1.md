# 30 — Especificação Física de Turmas e Componentes v1

**Data:** 2026-09-09  
**Status:** 🟡 ESPECIFICAÇÃO CANDIDATA — DDL DE PRODUÇÃO BLOQUEADO

## 1. Objetivo

Transformar as decisões de `docs/29-auditoria-identidade-turma-componente-v1.md` em um contrato físico candidato para `academic_classes` e `academic_components`, sem executar DDL remoto e sem criar dependências não comprovadas no Core.

## 2. Princípios físicos

1. `academic_classes` representa identidade acadêmica oficial da turma, não um agrupamento operacional da Agenda.
2. `academic_components` representa identidade canônica do componente curricular, não um texto livre.
3. `organizations`, `schools` e `school_years` são reutilizados como referências do Core já comprovadas.
4. O vínculo Auth ↔ docente permanece no mecanismo explicitamente homologado; estas entidades não inferem identidade por nome/e-mail.
5. Matching de importação ocorre em staging e nunca publica diretamente uma linha canônica sem estado `resolved` homologado.
6. Alterações relevantes não apagam silenciosamente o passado.
7. A versão da grade oficial é a unidade de publicação temporal; identidade de turma/componente deve permanecer estável quando a entidade subjacente for a mesma.

## 3. `academic_classes` — modelo candidato

### 3.1 Identidade

- `id uuid` — PK.
- `organization_id uuid` — FK para `organizations.id`.
- `school_id uuid` — FK para `schools.id`.
- `school_year_id uuid` — FK para `school_years.id`.
- `official_external_id text` — identificador oficial da fonte, quando fornecido.
- `official_code text` — código oficial da turma, quando existir.
- `official_name text` — nome oficial.
- `stage text` — etapa/modalidade de ensino.
- `grade_level text` — ano/série/nível.
- `shift text` — turno.
- `status text` — ciclo de vida controlado, por exemplo `active`, `inactive`, `archived`.

### 3.2 Proveniência e temporalidade

- `source_system text` — sistema/origem da carga.
- `source_record_id text` — identificador do registro na origem, quando distinto do identificador oficial.
- `provenance jsonb` — cadeia de origem, transformação e homologação.
- `metadata jsonb` — atributos adicionais não canônicos.
- `valid_from timestamptz`.
- `valid_until timestamptz` — nulo para vigência aberta.
- `created_at timestamptz`.
- `updated_at timestamptz`.

### 3.3 Unicidade

A regra primária proposta é unicidade contextual de `(school_id, school_year_id, official_external_id)` quando `official_external_id` estiver presente.

Como o identificador externo pode ser ausente, não se deve fabricar unicidade por nome isolado. Registros sem identificador oficial somente podem tornar-se canônicos após matching determinístico por chave composta previamente homologada ou exceção manual auditada.

A implementação física deve usar índice único parcial para identificadores externos não nulos, evitando colisões e permitindo registros sem identificador durante processos controlados.

## 4. `academic_components` — modelo candidato

### 4.1 Identidade

- `id uuid` — PK.
- `organization_id uuid` — FK para `organizations.id`, nullable quando o catálogo for global e não institucional.
- `official_code text` — código oficial, quando fornecido pela fonte.
- `official_name text` — nome oficial.
- `knowledge_area text` — área de conhecimento normalizada como atributo nesta fase, sem FK não comprovada.
- `teaching_stage text` — etapa de ensino.
- `status text` — ciclo de vida controlado.

### 4.2 Proveniência e temporalidade

- `source_system text`.
- `source_record_id text`.
- `provenance jsonb`.
- `metadata jsonb`.
- `valid_from timestamptz`.
- `valid_until timestamptz`.
- `created_at timestamptz`.
- `updated_at timestamptz`.

### 4.3 Referência EIOS

Uma referência curricular EIOS poderá existir como identificador externo/semântico, mas não deve receber FK física até que a tabela canônica correspondente seja comprovada no PostgreSQL. O vínculo curricular é opcional e não pode bloquear a identidade do componente necessário à grade.

## 5. Versionamento

`academic_classes` e `academic_components` não devem ser duplicados a cada publicação da grade quando a identidade não mudou.

A publicação temporal pertence às futuras `official_schedule_versions`, `official_schedule_entries` e `official_schedule_occurrences`.

Mudança de atributos de identidade ou de contexto que represente uma nova entidade deve gerar nova identidade canônica ou nova validade conforme regra de homologação. Correção de dados de uma mesma identidade deve preservar proveniência e histórico; não haverá overwrite silencioso de decisões publicadas.

## 6. Integridade cruzada

### Turma

`school_id` deve pertencer a `organization_id`, e `school_year_id` deve ser compatível com a organização/escola no contexto homologado. Essa regra pode exigir trigger ou função de validação porque uma FK simples isolada não prova a coerência composta.

### Componente

`organization_id`, quando preenchido, define escopo institucional. Um componente global pode ser reutilizado sem copiar identidade por escola. Compatibilidade com etapa/grade deve ser validada no processo de importação/publicação, não presumida apenas pelo texto.

## 7. Staging e matching

As estruturas de staging devem preservar os valores originais e registrar:

- origem;
- lote/importação;
- registro original;
- candidato canônico;
- `matching_status`: `resolved`, `ambiguous`, `unresolved`, `rejected`;
- método de matching;
- evidências;
- validador;
- data/hora da homologação.

Somente `resolved` homologado pode ser promovido à grade oficial. `ambiguous`, `unresolved` e `rejected` permanecem fora da publicação.

São proibidos como chave única: nome textual isolado, fuzzy matching, posição de planilha, professor associado ou escola isoladamente.

## 8. Índices candidatos

### `academic_classes`

- PK `id`.
- índice por `(school_id, school_year_id)`.
- índice único parcial por `(school_id, school_year_id, official_external_id)` quando não nulo.
- índice por `organization_id`.
- índice por `status` e vigência conforme necessidade operacional.

### `academic_components`

- PK `id`.
- índice por `organization_id`.
- índice único contextual para código oficial quando a política do catálogo confirmar seu escopo.
- índice por nome somente para busca, nunca para identidade.

A regra exata de unicidade de `academic_components.official_code` permanece dependente de saber se o catálogo oficial é global ou institucional.

## 9. RLS e autorização

Não criar RBAC específico para essas entidades. A autorização deve reutilizar o Core/Identity já auditado, com escopo institucional e permissões do produto Escala quando homologadas.

A definição final de policies fica bloqueada até a integração completa com `identity_responsibility_scopes`, `identity_product_permissions` e o vínculo Auth ↔ docente. Não se deve inferir acesso a partir de `school_id` sem verificar a função de autorização aplicável.

## 10. Gate de produção

A especificação física está definida, mas o DDL continua bloqueado por quatro dependências:

1. identificação/homologação da fonte oficial e dos identificadores externos;
2. confirmação da coerência física de `school_years` e escopo organizacional;
3. política oficial de catálogo de componentes e escopo do código;
4. execução do harness de integridade e matching em PostgreSQL.

## 11. Decisão

**APROVADO COMO CONTRATO FÍSICO CANDIDATO; NÃO APROVADO PARA DDL DE PRODUÇÃO.**

Próxima etapa: auditoria específica do modelo, seguida de harness PostgreSQL isolado para provar unicidade, escopo, temporalidade e regras de publicação.
