# 18 — Esquema Físico de Identidade, Staging e Publicação da Grade v1

**Data:** 2026-09-09  
**Status:** DRAFT — NÃO EXECUTAR DDL  
**Produto:** Escala Inteligente de Substituição

## 1. Objetivo

Transformar os contratos 15–17 em um esquema físico suficientemente preciso para a próxima auditoria estrutural, sem executar DDL de produção.

A regra é preservar o Core existente, evitar tabelas paralelas e impedir que dados importados não validados alimentem decisões de substituição.

## 2. Entidades propostas

### 2.1 `academic_teacher_identity_links`

Usada somente para representar explicitamente a relação entre identidade autenticada e `teacher_profiles` quando essa relação não puder ser comprovada diretamente.

Campos mínimos:

- `id uuid primary key`
- `organization_id uuid not null`
- `school_id uuid not null`
- `teacher_profile_id uuid not null`
- `auth_user_id uuid not null`
- `status text not null`
- `valid_from date not null`
- `valid_until date`
- `source text not null`
- `verified_by uuid`
- `verified_at timestamptz`
- `provenance jsonb not null default '{}'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Estados: `pending`, `active`, `revoked`.

Integridade:

- FK do perfil para `teacher_profiles(id)`;
- FK institucional para `organizations(id)` e `schools(id)`;
- `valid_until >= valid_from`;
- vínculo ativo exige verificação quando a política institucional determinar;
- não usar nome/e-mail como chave de identidade;
- unicidade parcial de vínculo ativo deve ser definida após confirmação da semântica de múltiplos vínculos institucionais.

### 2.2 `academic_classes`

Identidade oficial de turma, independente de `agenda_classes`.

Campos mínimos:

- `id uuid primary key`
- `organization_id uuid not null`
- `school_id uuid not null`
- `school_year_id uuid not null`
- `code text not null`
- `name text not null`
- `grade text`
- `shift text`
- `status text not null`
- `source text not null`
- `external_key text`
- `metadata jsonb not null default '{}'`
- timestamps
- `deleted_at timestamptz`

Unicidade natural candidata: `(school_id, school_year_id, code)` enquanto ativo.

### 2.3 `academic_components`

Catálogo canônico de componentes curriculares.

Campos mínimos:

- `id uuid primary key`
- `organization_id uuid`
- `code text`
- `name text not null`
- `short_name text`
- `education_stage text`
- `knowledge_area_code text`
- `curriculum_node_ref text`
- `status text not null`
- `source text not null`
- `external_key text`
- `metadata jsonb not null default '{}'`
- timestamps

Não criar FK para `curriculum_node_ref` até existir entidade física curricular comprovada.

## 3. Lote de importação

### `official_schedule_import_batches`

Cada recebimento de uma fonte constitui um lote imutável de ingestão.

Campos mínimos:

- `id uuid primary key`
- `organization_id uuid not null`
- `school_id uuid not null`
- `school_year_id uuid not null`
- `source_type text not null`
- `source_reference text`
- `source_filename text`
- `source_hash text not null`
- `received_at timestamptz not null`
- `received_by uuid not null`
- `row_count integer not null`
- `valid_row_count integer not null default 0`
- `invalid_row_count integer not null default 0`
- `ambiguous_row_count integer not null default 0`
- `unresolved_row_count integer not null default 0`
- `status text not null`
- `metadata jsonb not null default '{}'`
- timestamps

Estados: `received`, `processing`, `validated`, `rejected`, `published`, `cancelled`.

Regras:

- `source_hash` obrigatório;
- contadores nunca negativos;
- lote publicado não deve ser editado destrutivamente;
- o mesmo conteúdo pode ser detectado por hash e tratado como idempotente.

## 4. Staging das linhas

### `official_schedule_import_rows`

Preserva a evidência original antes da transformação para o modelo canônico.

Campos mínimos:

- `id uuid primary key`
- `import_batch_id uuid not null`
- `source_row_number integer not null`
- `raw_payload jsonb not null`
- `normalized_payload jsonb`
- `teacher_match_status text not null`
- `class_match_status text not null`
- `component_match_status text not null`
- `teacher_match_id uuid`
- `class_match_id uuid`
- `component_match_id uuid`
- `match_confidence numeric`
- `match_reason text`
- `validation_status text not null`
- `validation_errors jsonb not null default '[]'`
- `resolved_by uuid`
- `resolved_at timestamptz`
- timestamps

Matching:

- `resolved`
- `ambiguous`
- `unresolved`

A publicação deve rejeitar qualquer linha essencial que não esteja `resolved`.

A linha bruta deve permanecer disponível para auditoria e reprodução.

## 5. Publicação da grade

### `official_schedule_versions`

Uma versão representa um estado formal da grade de uma escola/ano.

Campos mínimos:

- `id uuid primary key`
- `organization_id uuid not null`
- `school_id uuid not null`
- `school_year_id uuid not null`
- `version_number integer not null`
- `status text not null`
- `valid_from date not null`
- `valid_until date`
- `source_type text not null`
- `source_reference text`
- `source_hash text not null`
- `import_batch_id uuid not null`
- `validated_by uuid`
- `validated_at timestamptz`
- `published_by uuid`
- `published_at timestamptz`
- `metadata jsonb not null default '{}'`
- timestamps

Estados: `draft`, `validated`, `published`, `superseded`, `revoked`, `archived`.

Somente `published` pode alimentar o motor.

## 6. Entradas e ocorrências

`official_schedule_entries` referencia uma versão, turma, componente e professor e representa a estrutura recorrente.

`official_schedule_occurrences` materializa a obrigação em data e intervalo concreto.

A ocorrência será a unidade de referência das vagas da Escala.

Integridade mínima:

```text
organization_id
      ↓
school_id
      ↓
school_year_id
      ↓
schedule_version_id
      ↓
schedule_entry_id
      ↓
occurrence
```

Professor, turma e componente devem pertencer ao mesmo escopo institucional da ocorrência.

## 7. Publicação transacional

A publicação deve ser uma operação controlada:

1. bloquear nova alteração concorrente da versão candidata;
2. verificar lote e hash;
3. verificar escola/organização/ano;
4. verificar matching;
5. verificar integridade temporal;
6. verificar duplicidades;
7. verificar responsável pela validação;
8. criar versão;
9. criar entries;
10. criar occurrences;
11. marcar versão como `published` somente após todas as validações;
12. superseder a versão anterior de forma explícita;
13. registrar governance/provenance/auditoria.

Se qualquer etapa falhar, nenhuma versão parcialmente publicada pode permanecer utilizável pelo motor.

## 8. Regras temporais

Para intervalos A e B existe conflito quando:

`A.start < B.end AND B.start < A.end`.

Obrigatório rejeitar:

- `end_time <= start_time`;
- ocorrência fora da vigência;
- entry fora da versão;
- duplicidade incompatível;
- professor simultaneamente alocado em obrigações incompatíveis, conforme regra institucional.

## 9. Idempotência e histórico

A mesma fonte não deve gerar versões duplicadas sem justificativa.

O hash da fonte e a combinação escola/ano/período devem permitir detectar reimportação idêntica.

Correções geram nova versão; versões anteriores permanecem consultáveis e não são apagadas para esconder histórico.

Uma reexecução do motor deve referenciar exatamente a versão consumida e nunca alterar retroativamente o resultado histórico de uma execução anterior.

## 10. RLS e autorização

Todas as tabelas expostas devem ter RLS.

O acesso deve considerar:

- identidade autenticada;
- organização;
- escola;
- escopo de responsabilidade;
- `product_code` da Escala;
- permissão específica.

O professor não recebe acesso a staging, scores ou candidatos apenas por ser membro da organização.

Operações de publicação e resolução de matching exigem escopo administrativo explicitamente autorizado.

## 11. Governance e provenance

Cada lote, publicação e decisão relevante deve possuir correlação suficiente para reconstrução histórica.

Quando homologada a integração com EIOS Governance, registrar:

- origem;
- transformação;
- versão;
- transições de estado;
- ator;
- timestamp;
- justificativa;
- hash/correlação;
- decisão humana.

Não criar um segundo ledger de auditoria sem necessidade comprovada.

## 12. Ordem de implementação futura

A primeira migration real deverá ser gerada pelo fluxo oficial do Supabase e somente após esta auditoria ser aprovada.

Ordem candidata:

```text
1. academic_teacher_identity_links (se necessária)
2. academic_classes
3. academic_components
4. official_schedule_import_batches
5. official_schedule_import_rows
6. official_schedule_versions
7. official_schedule_entries
8. official_schedule_occurrences
9. permissões escala.*
10. entidades Escala
11. RLS
12. governance/provenance
13. testes
```

## 13. Auditoria preliminar do esquema

| ID | Achado | Severidade | Status |
|---|---|---|---|
| PHY-SCHEMA-01 | identidade Auth ↔ docente ainda depende de vínculo comprovado | Critical | Aberto |
| PHY-SCHEMA-02 | turma oficial não existe fisicamente | Critical | Aberto |
| PHY-SCHEMA-03 | componente curricular canônico não existe fisicamente | Critical | Aberto |
| PHY-SCHEMA-04 | staging é necessário para preservar evidência | High | Definido |
| PHY-SCHEMA-05 | publicação deve ser versionada e transacional | Critical | Definido |
| PHY-SCHEMA-06 | ocorrências precisam de intervalo concreto | High | Definido |
| PHY-SCHEMA-07 | RLS precisa combinar produto + escopo | High | Aberto |
| PHY-SCHEMA-08 | integração EIOS Governance precisa homologação | Medium | Aberto |
| PHY-SCHEMA-09 | DDL de produção ainda não autorizado | Critical | Aberto |

## 14. Gate de liberação

Nenhuma migration real será executada antes de:

- fechar a decisão sobre identidade docente;
- validar as chaves e tipos contra o Core físico;
- definir a origem real da turma e componente;
- homologar staging e matching;
- definir publicação transacional;
- materializar permissões Escala;
- testar RLS;
- validar governance/provenance;
- executar casos de integridade temporal;
- realizar auditoria final sem Critical/High aberto.

**Decisão:** modelo físico preparado para auditoria estrutural. Produção permanece bloqueada.
