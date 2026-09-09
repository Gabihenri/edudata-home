# 15 — Modelo Físico Candidato da Fundação v1

**Data:** 2026-09-09  
**Status:** DRAFT — NÃO EXECUTAR DDL  
**Escopo:** desenho físico da fundação compartilhada para Grade Oficial + Escala

> Este documento transforma os contratos 11–14 em um modelo físico candidato. Ele não é migration e não autoriza alterações no Supabase.

## 1. Objetivo

Definir as entidades, relações, constraints, índices, versionamento, importação, RLS e integração de governança necessárias para que a Escala possa operar sobre uma fonte oficial de grade sem criar um Core paralelo.

Princípio: entidades acadêmicas compartilhadas pertencem ao Core; entidades de decisão operacional pertencem à Escala.

## 2. Dependências físicas comprovadas

A auditoria atual comprova como referências de fundação:

- `organizations.id`
- `schools.id`
- `school_years.id`
- `academic_periods.id`
- `teacher_profiles.id`
- estruturas `identity_*`
- estruturas `eios_governance_*`

Não são dependências válidas neste desenho:

- `schedules`
- `classes`
- `subjects`
- `knowledge_areas`
- `availability`
- `substitutions`
- `audit_logs`

Essas tabelas legadas não devem ser recriadas apenas para satisfazer o modelo antigo.

## 3. Fundação acadêmica candidata

### 3.1 `academic_teacher_identity_links`

Usar somente se a auditoria comprovar que `teacher_profiles.id` não corresponde à identidade autenticada.

Campos candidatos:

- `id uuid primary key`
- `organization_id uuid not null references organizations(id)`
- `school_id uuid not null references schools(id)`
- `teacher_profile_id uuid not null references teacher_profiles(id)`
- `identity_user_id uuid not null`
- `valid_from date not null`
- `valid_until date`
- `status text not null`
- `source text not null`
- `provenance jsonb not null default '{}'`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Constraints:

- `valid_until >= valid_from` quando informado;
- um vínculo ativo não pode ser duplicado para o mesmo perfil/identidade/período;
- identidade não pode ser inferida por nome ou e-mail;
- alteração de vínculo exige auditoria.

**Decisão:** entidade condicional; não criar antes de provar a necessidade.

### 3.2 `academic_classes`

Identidade institucional da turma.

Campos candidatos:

- `id uuid primary key`
- `organization_id uuid not null references organizations(id)`
- `school_id uuid not null references schools(id)`
- `school_year_id uuid not null references school_years(id)`
- `code text not null`
- `name text not null`
- `grade text`
- `shift text`
- `status text not null`
- `source text not null`
- `external_key text`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- `deleted_at timestamptz`

Constraints:

- organização da turma deve coincidir com a escola;
- `code` deve ser único dentro de escola + ano letivo enquanto ativo;
- status deve pertencer ao vocabulário controlado;
- exclusão física não é permitida para registros já referenciados.

### 3.3 `academic_components`

Identidade canônica de componente curricular.

Campos candidatos:

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
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

A coluna `curriculum_node_ref` é referência semântica/proveniência até existir uma FK física comprovada para o modelo curricular. Não criar FK imaginária.

## 4. Grade oficial versionada

### 4.1 `official_schedule_versions`

Representa uma publicação institucional completa ou uma versão formal da grade.

Campos candidatos:

- `id uuid primary key`
- `organization_id uuid not null references organizations(id)`
- `school_id uuid not null references schools(id)`
- `school_year_id uuid not null references school_years(id)`
- `version_number integer not null`
- `status text not null`
- `valid_from date not null`
- `valid_until date`
- `source_type text not null`
- `source_reference text`
- `source_hash text not null`
- `published_at timestamptz`
- `published_by uuid`
- `import_batch_id uuid`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Status sugerido: `draft`, `validated`, `published`, `superseded`, `revoked`, `archived`.

Regras:

- somente uma versão pode estar `published` para a mesma escola e período de validade, salvo regra explícita de sobreposição de vigências;
- `version_number` é monotônico por escola/ano;
- versão publicada é imutável semanticamente;
- correção gera nova versão;
- `source_hash` permite identificar o conteúdo importado/publicado.

### 4.2 `official_schedule_entries`

Representa a relação estrutural da grade antes de sua materialização temporal.

Campos candidatos:

- `id uuid primary key`
- `schedule_version_id uuid not null references official_schedule_versions(id)`
- `class_id uuid not null references academic_classes(id)`
- `component_id uuid not null references academic_components(id)`
- `teacher_profile_id uuid not null references teacher_profiles(id)`
- `weekday smallint`
- `start_time time not null`
- `end_time time not null`
- `shift text`
- `valid_from date not null`
- `valid_until date`
- `external_key text`
- `source_row integer`
- `metadata jsonb not null default '{}'`

Constraints:

- `weekday` entre 1 e 7 quando usado;
- `end_time > start_time`;
- validade do entry contida na validade da versão;
- professor, turma e escola devem pertencer ao mesmo escopo institucional;
- não permitir duplicação estrutural da mesma aula na mesma versão.

### 4.3 `official_schedule_occurrences`

É a unidade temporal consumida pelo motor da Escala.

Campos candidatos:

- `id uuid primary key`
- `schedule_entry_id uuid not null references official_schedule_entries(id)`
- `schedule_version_id uuid not null references official_schedule_versions(id)`
- `organization_id uuid not null references organizations(id)`
- `school_id uuid not null references schools(id)`
- `teacher_profile_id uuid not null references teacher_profiles(id)`
- `class_id uuid not null references academic_classes(id)`
- `component_id uuid not null references academic_components(id)`
- `scheduled_date date not null`
- `start_time time not null`
- `end_time time not null`
- `status text not null`
- `source_hash text`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null`

Constraint crítica: `end_time > start_time`.

Índices mínimos:

- `(school_id, scheduled_date, start_time)`;
- `(teacher_profile_id, scheduled_date, start_time, end_time)`;
- `(class_id, scheduled_date, start_time)`;
- `(schedule_version_id, scheduled_date)`.

## 5. Importação e matching

Não inserir diretamente no modelo oficial dados externos não validados.

Fluxo candidato:

```text
arquivo/API externo
      ↓
import_batch
      ↓
staging rows
      ↓
normalização
      ↓
matching de escola/docente/turma/componente
      ↓
resolved | ambiguous | unresolved
      ↓
validação
      ↓
official_schedule_version
      ↓
entries
      ↓
occurrences
```

Uma futura camada de staging deve preservar:

- arquivo/origem;
- hash;
- linha de origem;
- valores brutos;
- resultado do matching;
- confiança;
- motivo de ambiguidade;
- responsável pela validação.

Dados `ambiguous` ou `unresolved` não podem alimentar o motor de produção.

## 6. Integração com Escala

Depois de publicada a grade, a Escala poderá possuir:

- `substitution_absences`
- `substitution_vacancies`
- `substitution_candidates`
- `substitution_rule_sets`
- `substitution_engine_runs`

`substitution_vacancies` deve referenciar `official_schedule_occurrences(id)` quando essa entidade estiver fisicamente criada e auditada.

Não criar FK para `schedules(id)`.

Cada `substitution_engine_run` deve armazenar pelo menos:

- `schedule_version_id`;
- versão do conjunto de regras;
- escopo institucional;
- timestamp de início/fim;
- status;
- identificador/idempotency key;
- hash dos inputs relevantes;
- resultado resumido;
- referência de provenance.

## 7. Temporalidade e concorrência

Conflito entre dois intervalos A/B:

```text
A.start < B.end
AND
B.start < A.end
```

A confirmação de uma substituição deve ocorrer em transação e revalidar:

1. ausência ainda ativa;
2. ocorrência ainda válida;
3. grade ainda vigente;
4. candidato ainda elegível;
5. inexistência de conflito temporal;
6. inexistência de outra substituição confirmada incompatível;
7. impedimentos institucionais novos.

Se a grade mudar após a recomendação, a confirmação exige revalidação.

## 8. RLS e autorização

Não usar `organization_id = current_organization_id()` como única autorização para candidatos, scores e decisões.

A policy deverá combinar:

- organização;
- escola;
- escopo de responsabilidade;
- `product_code` da Escala;
- permissão específica da operação.

Permissões candidatas:

- `escala.view_vacancies`
- `escala.view_candidates`
- `escala.view_explanations`
- `escala.run_engine`
- `escala.rerun_engine`
- `escala.confirm_substitution`
- `escala.override_decision`
- `escala.view_audit`

O professor não recebe acesso a candidatos/scores por pertencer à organização. A gestão recebe somente conforme escopo e permissão.

## 9. Governance e auditoria

A Escala deve integrar os registros `eios_governance_audit_events`, `eios_governance_workflow_transitions`, `eios_governance_provenance_records` e `eios_governance_decision_records` quando suas APIs/policies estiverem comprovadamente adequadas ao novo produto.

Não criar um segundo ledger de auditoria sem justificativa.

Eventos mínimos:

- importação;
- publicação de grade;
- criação/alteração de ausência;
- criação de vaga;
- execução/reexecução do motor;
- eliminação de candidato e motivo;
- recomendação;
- confirmação;
- override;
- bloqueio por regra;
- acesso negado relevante.

Decisão humana deve registrar ator, timestamp, estado anterior, novo estado, justificativa e versão dos dados utilizados.

## 10. Constraints de integridade institucional

Toda entidade deve respeitar o encadeamento:

```text
organization → school → academic context → grade → occurrence
```

Nenhuma FK deve permitir que uma escola de organização A seja relacionada a professor/turma da organização B.

Quando PostgreSQL não conseguir expressar diretamente uma regra composta por FK simples, ela deverá ser garantida por constraint, trigger ou função transacional explicitamente auditada.

## 11. Ordem futura de DDL

Somente depois de fechar os bloqueadores:

```text
1. identidade docente
2. academic_classes
3. academic_components
4. import/staging
5. official_schedule_versions
6. official_schedule_entries
7. official_schedule_occurrences
8. permissões Escala
9. Escala absences/vacancies/runs/candidates
10. integração governance
11. RLS
12. testes de integração
```

A ordem real poderá ser ajustada se a auditoria de dependências encontrar entidades Core já existentes que possam ser reutilizadas.

## 12. Auditoria desta fase

| ID | Achado | Severidade | Evidência/decisão |
|---|---|---|---|
| PHY-01 | Modelo não pode referenciar tabelas legadas ausentes | Critical | removidas dependências `schedules/substitutions/availability/audit_logs` |
| PHY-02 | Identidade docente ainda não comprovada | High | associação condicional, sem criação automática |
| PHY-03 | Turma oficial precisa identidade própria | Critical | `academic_classes` proposta no Core |
| PHY-04 | Componente curricular precisa identidade própria | Critical | `academic_components` proposta no Core |
| PHY-05 | Grade precisa versionamento e publicação | Critical | `official_schedule_versions` |
| PHY-06 | Motor precisa ocorrência temporal concreta | High | `official_schedule_occurrences` |
| PHY-07 | Importação precisa preservar origem/matching | High | staging + provenance |
| PHY-08 | RLS amplo por organização é insuficiente | High | permissões + responsibility scopes |
| PHY-09 | Governance EIOS deve ser reutilizado sem duplicação | Medium | integração condicionada à auditoria |
| PHY-10 | DDL de produção ainda não está autorizado | Critical | documento permanece DRAFT |

## 13. Casos de validação física obrigatórios

Antes de qualquer migration:

1. FK de organização/escola inválida deve falhar.
2. `end_time <= start_time` deve falhar.
3. versão publicada duplicada deve falhar.
4. entry fora da validade da versão deve falhar.
5. ocorrência sem professor/turma/componente resolvidos não deve ser publicada.
6. matching ambíguo não pode alimentar o motor.
7. duas atividades simultâneas do mesmo professor devem produzir conflito.
8. nova versão da grade deve exigir revalidação.
9. usuário sem permissão não pode consultar candidatos.
10. usuário de outra escola não pode acessar vaga/candidatos.
11. reexecução deve criar novo run sem apagar histórico.
12. confirmação deve registrar decisão humana e provenance.

## 14. Decisão

O modelo físico candidato está suficientemente detalhado para orientar a próxima auditoria, mas **não é migration executável**.

O próximo gate técnico é fechar, com evidência de dados reais:

- relação `teacher_profiles` ↔ identidade autenticada;
- forma definitiva de turma oficial;
- forma definitiva do componente curricular;
- contrato de staging/importação;
- materialização das permissões `escala.*`;
- integração concreta com EIOS Governance;
- testes de RLS e integridade composta.

**Status global:** 🟡 AMARELO — desenho físico candidato concluído; execução de DDL continua bloqueada.
