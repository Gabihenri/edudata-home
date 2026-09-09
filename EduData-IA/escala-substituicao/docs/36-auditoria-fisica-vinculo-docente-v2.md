# 36 — Auditoria Física do Vínculo Auth ↔ Docente v2

**Data:** 2026-09-09  
**Produto:** Escala Inteligente de Substituição  
**Status:** 🔴 GATE BLOQUEADO — sem DDL de produção

## 1. Objetivo

Revalidar, com evidência física do PostgreSQL/Supabase, se o Core atual possui uma relação canônica entre a identidade autenticada e `teacher_profiles`, e definir o próximo passo seguro para a Escala.

## 2. Evidência física auditada

Projeto Supabase auditado: `EduData IA` (`ihchzfndmdwtoabttkil`).

### 2.1 `user_profiles`

Existe fisicamente e possui:

- `user_id uuid NOT NULL` como chave primária;
- `role`, `status`, `display_name`, `metadata` e timestamps;
- FK `user_profiles_user_id_fkey` para a identidade Auth.

**Conclusão:** `user_profiles.user_id` é a ponte estrutural comprovada entre Auth e perfil de aplicação.

### 2.2 `organization_members`

Existe fisicamente e possui:

- `organization_id`;
- `school_id` opcional;
- `user_id`;
- `role`, `status`, `hierarchy_level`, `scope_type` e `scope_id`;
- permissões institucionais e período de acesso;
- FK de `user_id` para a identidade Auth.

Há também restrições de unicidade envolvendo `user_id`/`organization_id`.

**Conclusão:** `organization_members` é base de autorização institucional, não prova de identidade acadêmica docente.

### 2.3 `teacher_profiles`

Existe fisicamente e possui:

- `id uuid` como PK;
- `name`, `email`;
- `school_id`;
- `organization_id`;
- `role`, `area`, `knowledge_area`, `teaching_stage`;
- `subjects`;
- dados de perfil e timestamps.

Foi comprovada FK de `teacher_profiles.school_id` para `schools.id`.

**Achado crítico:** não existe `teacher_profiles.user_id` e não foi encontrada FK direta entre `teacher_profiles` e `user_profiles`/Auth.

## 3. Auditoria de políticas RLS existente

A auditoria física encontrou:

- `user_profiles_own_read`: usuário autenticado lê somente seu próprio `user_profiles`;
- `organization_members_own_read`: usuário autenticado lê somente seu próprio vínculo em `organization_members`;
- `responsibility_scopes_owner_or_manager`: acesso ao escopo de responsabilidade condicionado ao próprio usuário ou gestor;
- `identity_permissions_authenticated_read`: permissões de produto podem ser lidas por usuários autenticados.

**Conclusão:** o Core já possui mecanismos de autorização e escopo. Não criar RBAC específico da Escala nem substituir `identity_*`.

Entretanto, essas políticas não estabelecem uma relação Auth → `teacher_profiles`.

## 4. Decisão arquitetural

A hipótese de `teacher_profiles.id = auth.users.id` permanece **não comprovada** e não deve ser assumida.

Também não é seguro utilizar:

- nome;
- e-mail;
- cargo;
- escola isoladamente;
- `organization_members.role`;
- similaridade textual/fuzzy.

A ponte explícita `academic_teacher_identity_links` permanece necessária como solução de projeto, caso uma nova inspeção do Core não revele relação canônica adicional.

## 5. Contrato físico a homologar

A entidade deverá conter, no mínimo:

- `id`;
- `organization_id`;
- `school_id`;
- `teacher_profile_id`;
- `auth_user_id`;
- `status` (`pending`, `active`, `revoked`);
- `valid_from`;
- `valid_until`;
- `source`;
- `verified_by`;
- `verified_at`;
- `provenance`;
- `metadata`;
- `created_at`;
- `updated_at`.

As referências a `organizations`, `schools` e `teacher_profiles` devem ser FKs físicas. A referência a Auth deve usar somente mecanismo previamente homologado para o projeto, sem criar dependência insegura ou duplicar identidade.

## 6. Integridade obrigatória

Um vínculo ativo somente poderá existir se:

1. Auth estiver comprovado;
2. `teacher_profile_id` existir;
3. professor e escola pertencerem à organização indicada;
4. o vínculo estiver dentro da vigência;
5. a homologação administrativa estiver registrada;
6. não houver sobreposição incompatível de vínculos ativos;
7. a política de múltiplas escolas estiver explicitamente respeitada.

Para vigências temporais, sobreposição deve considerar intervalos abertos (`valid_until IS NULL`) de forma explícita.

## 7. Multi-escola

O modelo atual contém `school_id` em `organization_members` e `teacher_profiles`, mas isso não prova a política de atuação docente em múltiplas escolas.

**Decisão:** não impor ainda uma regra 1:1 global por docente/Auth. A unicidade deve ser definida por escopo institucional e temporal depois de homologada a política multi-escola.

## 8. Auditoria de segurança

### AUTH-DOC-01 — relação Auth → `user_profiles`
**Severidade:** High  
**Estado:** 🟢 Fechado estruturalmente.

### AUTH-DOC-02 — relação Auth → `teacher_profiles`
**Severidade:** Critical  
**Estado:** 🔴 Aberto. Não comprovada fisicamente.

### AUTH-DOC-03 — autorização institucional
**Severidade:** High  
**Estado:** 🟢 Existe no Core via `organization_members` e `identity_*`.

### AUTH-DOC-04 — RLS da futura ponte
**Severidade:** Critical  
**Estado:** 🔴 Aberto. Ainda não existe tabela nem política homologada.

### AUTH-DOC-05 — canonização sem fuzzy
**Severidade:** Critical  
**Estado:** 🟢 Fechado como regra arquitetural.

### AUTH-DOC-06 — integridade escola/organização
**Severidade:** Critical  
**Estado:** 🟡 Definida no contrato; precisa de implementação/teste.

### AUTH-DOC-07 — temporalidade
**Severidade:** High  
**Estado:** 🟡 Definida; precisa de implementação/teste.

### AUTH-DOC-08 — multi-escola
**Severidade:** High  
**Estado:** 🔴 Política ainda não homologada.

### AUTH-DOC-09 — auditoria central
**Severidade:** High  
**Estado:** 🟢 `identity_audit_logs` permanece ledger central de identidade/acesso; EIOS governance permanece complementar para proveniência, workflow e decisão.

## 9. Resultado da auditoria

A auditoria confirma que a arquitetura anterior continua correta: **não existe evidência suficiente para eliminar a ponte acadêmica/Auth**.

O bloqueio não é mais conceitual. O próximo avanço deve transformar a especificação em um **modelo físico candidato isolado**, incluindo mecanismo seguro de referência à identidade Auth, constraints, temporalidade, multi-escola e RLS, e submetê-lo a uma nova auditoria/harness.

## 10. Gate

| Área | Estado |
|---|---|
| Auth → `user_profiles` | 🟢 comprovado |
| Auth → `teacher_profiles` | 🔴 não comprovado |
| Autorização institucional | 🟢 existente |
| Ponte acadêmica/Auth | 🟡 candidata |
| Integridade org/escola | 🟡 a implementar/testar |
| Temporalidade | 🟡 a implementar/testar |
| Multi-escola | 🔴 a homologar |
| RLS da ponte | 🔴 a homologar |
| Auditoria | 🟢 ledger definido |
| DDL produção | 🔴 BLOQUEADO |

**Regra:** nenhum DDL de produção deve ser executado enquanto existir `Critical` aberto.
