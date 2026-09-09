# 25 — Auditoria do vínculo Auth → usuário → docente v2

**Data:** 2026-09-09  
**Status:** 🟡 AUDITORIA CONCLUÍDA — VÍNCULO DOCENTE AINDA NÃO HOMOLOGADO  
**Escopo:** `user_profiles`, `organization_members`, `teacher_profiles`, Auth e autorização compartilhada.

## 1. Objetivo

Revalidar a cadeia de identidade necessária para a Escala Inteligente de Substituição sem inferir que o perfil docente é o mesmo identificador do usuário autenticado.

## 2. Evidências auditadas

No projeto físico `EduData IA` foram confirmados:

- `public.user_profiles`;
- `public.organization_members`;
- `public.teacher_profiles`;
- `public.identity_roles`;
- `public.identity_responsibility_scopes`;
- `public.identity_product_permissions`;
- `public.identity_audit_logs`;
- `auth.users` é referenciada explicitamente pela migração de provisionamento de perfil.

A migração `database/21_default_user_profile.sql` valida a existência de `auth.users` e `public.user_profiles`, exige `user_profiles.user_id`, cria índice único sobre esse campo e provisiona o perfil padrão a partir de `auth.users`. Portanto, `user_profiles.user_id` é evidência forte de identidade Auth → perfil de usuário. fileciteturn153file0L2-L5

## 3. Resultado principal

### Auth → user_profiles

**APROVADO no nível estrutural.**

`user_profiles.user_id` é `uuid NOT NULL`, possui unicidade e a própria implementação do Core usa `auth.users.id` como origem do perfil.

### user_profiles → teacher_profiles

**NÃO HOMOLOGADO.**

A auditoria física encontrou:

- `user_profiles.user_id`;
- `teacher_profiles.id`;
- `teacher_profiles.organization_id`;
- `teacher_profiles.school_id`;
- nenhum `teacher_profiles.user_id`;
- nenhuma FK comprovando `user_profiles.user_id → teacher_profiles.id`;
- nenhuma FK equivalente comprovando `teacher_profiles → auth.users`.

Consequentemente, não é permitido assumir `teacher_profiles.id = auth.users.id`.

## 4. Organization membership

`organization_members.user_id` é a chave operacional utilizada pelas funções centrais de identidade. A função `can_access_identity_product()` relaciona `organization_members.user_id = auth.uid()` e verifica produto/permissão e período de acesso. A função `can_view_identity_user()` usa o mesmo vínculo Auth → membership e, adicionalmente, escopo explícito de responsabilidade ou permissões de escola/rede.

Conclusão: **o Core possui uma cadeia de autorização baseada em Auth + membership, mas isso não resolve sozinho a identidade acadêmica do docente.**

## 5. Decisão arquitetural

A Escala deverá usar três conceitos distintos:

```text
Auth user
   ↓
user_profiles.user_id
   ↓
organization_members.user_id
   ↓
[ vínculo acadêmico docente homologado ]
   ↓
teacher_profiles.id
```

O vínculo acadêmico intermediário somente deve ser criado se a auditoria do restante do Core não localizar uma relação canônica já existente.

Se for necessário criar `academic_teacher_identity_links`, ele deverá registrar pelo menos:

- `organization_id`;
- `school_id`;
- `teacher_profile_id`;
- `auth_user_id`;
- estado `resolved | ambiguous | unresolved`;
- origem da associação;
- responsável pela homologação;
- data de homologação;
- validade temporal;
- metadados/proveniência.

## 6. Regras proibidas

Não utilizar para canonização automática:

- nome;
- e-mail;
- cargo textual;
- posição na lista;
- similaridade aproximada;
- coincidência de escola isoladamente.

Esses campos podem gerar candidatos para revisão, nunca uma associação docente publicada automaticamente.

## 7. RBAC e auditoria

O Escala deve reutilizar o Core de identidade. Não criar RBAC paralelo.

Permissões específicas continuam previstas como:

- `escala.view_vacancies`;
- `escala.view_candidates`;
- `escala.view_explanations`;
- `escala.run_engine`;
- `escala.rerun_engine`;
- `escala.confirm_substitution`;
- `escala.override_decision`;
- `escala.view_audit`.

`identity_audit_logs` permanece o ledger central de identidade/acesso. A camada `eios_governance_*` poderá registrar proveniência, transições e decisões da Escala quando sua integração e autorização forem homologadas. Não criar um terceiro ledger.

## 8. Achados

| ID | Achado | Severidade | Estado |
|---|---|---|---|
| AUTH-DOC-01 | Auth → `user_profiles.user_id` estruturalmente estabelecido | High | **Fechado** |
| AUTH-DOC-02 | `organization_members.user_id` é usado pelo Core de autorização | High | **Fechado** |
| AUTH-DOC-03 | Relação canônica `user_profiles` → `teacher_profiles` não comprovada | Critical | **Aberto** |
| AUTH-DOC-04 | `teacher_profiles.id = auth.users.id` não comprovado | Critical | **Aberto** |
| AUTH-DOC-05 | Identidade docente não pode ser inferida por nome/e-mail | Critical | **Regra aprovada** |
| AUTH-DOC-06 | RBAC Escala deve reutilizar Core | High | **Regra aprovada** |
| AUTH-DOC-07 | Auditoria deve permanecer centralizada | High | **Regra aprovada** |

## 9. Gate para DDL

O vínculo docente continua sendo bloqueador para a publicação da grade oficial e para a geração de substituições.

Antes do DDL de produção ainda é necessário:

1. concluir a busca por relação canônica Auth ↔ docente;
2. homologar identidade docente ou criar vínculo explícito versionado;
3. definir `academic_classes`;
4. definir `academic_components`;
5. implementar staging da grade;
6. homologar fonte oficial da grade;
7. executar o harness PostgreSQL isolado;
8. homologar RLS Escala;
9. integrar proveniência/governança;
10. fechar os achados críticos e altos.

**Decisão:** nenhuma alteração DDL foi executada no projeto remoto. A Escala permanece em fase de arquitetura/homologação.

## 10. Próximo passo auditável

A próxima etapa é auditar as relações de identidade acadêmica no código e nas migrações, procurando especificamente qualquer associação existente entre `auth.users`, `user_profiles`, `organization_members` e `teacher_profiles`, antes de criar uma tabela de vínculo nova.
