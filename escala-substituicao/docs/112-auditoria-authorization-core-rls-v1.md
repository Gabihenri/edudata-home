# 112 — Auditoria Authorization Core / RLS

**Data:** 29/09/2026  
**Status:** AUDITORIA FECHADA / IMPLEMENTAÇÃO FÍSICA BLOQUEADA

## Evidência física atual

O Core possui as estruturas necessárias para representar autorização contextual:

- `organization_members`: organização, usuário, papel, escola, escopo e validade;
- `identity_roles`: papel canônico e nível hierárquico;
- `identity_product_permissions`: permissões por produto;
- `identity_responsibility_scopes`: escopo organizacional/escolar e validade;
- `identity_audit_logs`: estrutura de auditoria;
- `user_profiles`: identidade Core;
- `teacher_profiles`: perfil acadêmico.

Porém, os dados operacionais necessários à Escala ainda estão vazios:

- `organization_members`: **0**
- `identity_responsibility_scopes`: **0**
- `teacher_profiles`: **0**
- `identity_product_permissions` para `product_code='escala'`: **0**

O catálogo atual contém apenas: academy, agenda_edi, analytics, backoffice, experience_manager, professor_digital e sgpa.

## RLS

Todas as estruturas auditadas estão com RLS habilitado.

Entretanto:

- `identity_audit_logs`: 0 políticas;
- `teacher_profiles`: 0 políticas;
- `schools`: 0 políticas;
- `organization_members`: 1 política, somente leitura do próprio membership;
- `identity_responsibility_scopes`: 1 política, somente owner/manager;
- `identity_product_permissions`: 1 política de leitura autenticada ampla;
- `identity_roles`: 1 política de leitura de papéis ativos.

As quatro tabelas de governança EIOS possuem duas políticas cada, mas as expressões físicas existentes usam `can_view_agenda_record` / `can_update_agenda_record` e, portanto, são específicas do produto Agenda. Elas não constituem autorização da Escala.

## Conclusão

A estrutura Core é compatível com o Authorization Resolver especificado, mas **não existe ainda evidência física suficiente para implementar o Resolver da Escala ou suas RLS de produção**.

Não foi criado:

- `product_code='escala'`;
- política RLS da Escala;
- função paralela de autorização;
- tabela paralela de RBAC;
- DDL de recurso da Escala.

Isso é deliberado.

## Gate

**Authorization Core estrutural:** 🟢  
**Dados de autorização operacionais:** 🔴  
**Permissões Escala:** 🔴  
**RLS Escala:** 🔴  
**Governança EIOS específica Escala:** 🔴

A implementação deve aguardar a homologação de membership, role, scope, vínculo identidade-docente e recursos acadêmicos. Depois disso:

1. fixture Core real;
2. Resolver contra Core;
3. harness RLS allow/deny;
4. governança EIOS;
5. somente então DDL/migration produtiva.

A documentação Supabase atual reforça que RLS deve ser combinado com grants e políticas específicas por operação, e que políticas apenas para `authenticated` não constituem autorização por si mesmas. citeturn0search0turn0search2
