# 27 — Auditoria da Decisão de Ponte de Identidade Docente v1

**Data:** 2026-09-09  
**Status:** 🟡 AUDITORIA CONCLUÍDA — PONTE NECESSÁRIA; DDL DE PRODUÇÃO BLOQUEADO

## 1. Objetivo

Revalidar, por evidência de código e banco, se o Core atual possui uma relação canônica entre a identidade autenticada (`auth.users` / `user_profiles`) e o domínio docente (`teacher_profiles`) antes de criar qualquer estrutura para a Escala.

## 2. Evidências auditadas

### 2.1 `user_profiles`

A estrutura atual utiliza `user_profiles.user_id` como referência da identidade autenticada. A política física existente restringe leitura ao próprio `auth.uid()`.

### 2.2 `organization_members`

`organization_members.user_id` é a base atual de associação/autorização institucional. A política existente restringe a leitura do registro ao próprio usuário autenticado.

### 2.3 `teacher_profiles`

O perfil docente atual possui `id`, `school_id` e demais atributos profissionais, porém não possui `user_id`.

### 2.4 Chaves estrangeiras reais

Consulta ao `information_schema` do projeto Supabase `EduData IA` (`ihchzfndmdwtoabttkil`) encontrou, entre essas três tabelas, somente:

```text
teacher_profiles.school_id → schools.id
```

Não foi encontrada FK entre `user_profiles` e `teacher_profiles`, nem entre `organization_members` e `teacher_profiles`.

### 2.5 Funções atuais

Existem funções de identidade e autorização no Core, incluindo `current_identity_membership()`, `current_identity_role()`, `can_access_identity_product()` e `can_view_identity_user()`. Nenhuma evidência auditada estabelece por si só a identidade acadêmica docente como equivalente ao `auth.uid()`.

## 3. Decisão arquitetural

A relação canônica abaixo **não está materializada atualmente**:

```text
auth.users.id
      ↓
user_profiles.user_id
      ↓
organization_members.user_id
      ↓
teacher_profile_id
      ↓
teacher_profiles.id
```

Portanto, não é seguro:

- assumir `teacher_profiles.id = auth.users.id`;
- restaurar a antiga tabela `public.users` apenas para satisfazer o modelo legado;
- inferir vínculo por nome, e-mail, cargo, ordem de importação ou similaridade textual;
- usar `organization_members` como substituto silencioso do vínculo acadêmico.

### Decisão

Se nova auditoria não encontrar outra relação canônica no Core, a Escala deverá materializar explicitamente uma ponte `academic_teacher_identity_links`.

## 4. Contrato mínimo da ponte

Campos obrigatórios de referência:

- `id`
- `organization_id`
- `school_id`
- `teacher_profile_id`
- `auth_user_id`
- `status`
- `valid_from`
- `valid_until`
- `source`
- `verified_by`
- `verified_at`
- `provenance`
- `metadata`
- `created_at`
- `updated_at`

A ponte resolve identidade; não substitui o RBAC.

## 5. Integridade obrigatória

1. `organization_id` deve apontar para `organizations.id`.
2. `school_id` deve apontar para `schools.id`.
3. `teacher_profile_id` deve apontar para `teacher_profiles.id`.
4. O perfil docente deve pertencer à mesma organização/escola do vínculo, salvo política explícita para atuação multi-escola.
5. Não pode existir mais de um vínculo ativo incompatível para a mesma identidade docente no mesmo escopo temporal.
6. Revogação deve preservar histórico.
7. Um vínculo ativo deve possuir evidência de homologação (`verified_by`/`verified_at` ou mecanismo equivalente).

A referência `auth_user_id` não deve receber FK direta para `auth.users` sem validar previamente o padrão de segurança e manutenção adotado pelo Core/Supabase. A integridade dessa referência pode ser garantida por função transacional controlada, caso seja a opção homologada.

## 6. Canonização

### Permitido

- `auth_user_id` validado;
- identificador institucional docente homologado;
- associação explícita por responsável autorizado;
- evidência de origem/proveniência.

### Proibido

- nome isoladamente;
- e-mail isoladamente;
- cargo textual;
- posição em lista/importação;
- escola isoladamente;
- fuzzy matching como mecanismo de publicação automática.

Estados de importação continuam sendo `resolved`, `ambiguous` e `unresolved`.

## 7. Autorização

A autorização permanece no Core:

- `organization_members`;
- `identity_roles`;
- `identity_responsibility_scopes`;
- `identity_product_permissions`.

A Escala deverá registrar posteriormente suas permissões próprias, no mínimo:

- `escala.view_vacancies`
- `escala.view_candidates`
- `escala.view_explanations`
- `escala.run_engine`
- `escala.rerun_engine`
- `escala.confirm_substitution`
- `escala.override_decision`
- `escala.view_audit`

Nenhuma dessas permissões deve ser criada por uma nova matriz RBAC paralela.

## 8. Auditoria e governança

`identity_audit_logs` permanece o ledger central de identidade/acesso. `eios_governance_*` pode registrar proveniência, workflow e decisão humana quando sua integração e autorização forem homologadas.

Não criar um terceiro ledger de auditoria concorrente.

## 9. Testes obrigatórios

Antes da liberação de DDL de produção, homologar no ambiente isolado:

- ID-01 vínculo válido;
- ID-02 Auth inexistente/referência inválida;
- ID-03 perfil docente inexistente;
- ID-04 organização incompatível;
- ID-05 escola incompatível;
- ID-06 duplicidade de vínculo ativo;
- ID-07 revogação preservando histórico;
- ID-08 reativação controlada;
- ID-09 tentativa de fuzzy matching bloqueada;
- ID-10 reprodução histórica de decisão com o vínculo vigente na época.

## 10. Resultado da auditoria

| Achado | Severidade | Estado |
|---|---|---|
| Auth → `user_profiles` | Alta | FECHADO estruturalmente |
| `organization_members.user_id` como base de autorização | Alta | FECHADO |
| `user_profiles` → `teacher_profiles` | **Crítica** | **ABERTO** |
| `teacher_profiles.id = auth.users.id` | **Crítica** | **NÃO COMPROVADO** |
| Ponte explícita | **Crítica** | **NECESSÁRIA se não houver relação canônica adicional** |
| Integridade organização/escola | **Crítica** | A HOMOLOGAR |
| Unicidade temporal | Alta | A HOMOLOGAR |
| Fuzzy matching | **Crítica** | REGRA BLOQUEADA |
| RLS por produto + escopo | Alta | A HOMOLOGAR |
| Auditoria central | Alta | DEFINIDA |
| Reprodução histórica | Alta | A TESTAR |

## 11. Gate de avanço

A produção continua **BLOQUEADA** para DDL da Escala.

Próxima etapa técnica segura:

1. homologar a ponte em ambiente isolado;
2. transformar ID-01..ID-10 em testes físicos, sem placeholders;
3. validar política multi-escola;
4. validar RLS e permissões `escala.*`;
5. integrar auditoria/governança;
6. somente então fechar a identidade docente e avançar para `academic_classes` e `academic_components`.

## 12. Evidência de auditoria

A consulta remota foi somente leitura. **Nenhum DDL, migration ou alteração de dados foi executado no projeto de produção.**

O resultado mantém a regra permanente do projeto:

```text
Definir → Implementar → Auditar → Corrigir → Validar → Registrar → Avançar
```
