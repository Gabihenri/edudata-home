# 172 — Auditoria da implementação do resolvedor canônico de roles Core

**Data:** 2026-10-08  
**Status:** 🟡 implementado e validado estruturalmente; regressão com usuários reais ainda limitada pela ausência de memberships operacionais.

## Implementado no Supabase

Criada/atualizada a função:

`public.resolve_canonical_role(uuid)`

Características:
- fonte Core: `organization_members`, `identity_roles`, `user_profiles`;
- saída somente com roles canônicos;
- mapeamento legado: professor→teacher, coordenador→coordinator, diretor→principal, administrador→institution_admin;
- plataforma somente quando o perfil coincide com role ativo homologado em `identity_roles.is_platform_role`;
- super_admin precede platform_admin;
- membership exige status ativo e janela temporal válida;
- role desconhecido falha fechado;
- empate após critérios determinísticos resulta em `MULTIPLE_CONTEXTS_AMBIGUOUS`;
- nenhum desempate por UUID, nome, e-mail ou ordem física;
- versão de resolução `v1`;
- chamada pública restrita a usuário autenticado e ao próprio `auth.uid()`.

## Consumidores migrados

Foram adaptados para consumir o resolvedor:
- `current_identity_role()`
- `can_access_identity_product()`
- `can_view_agenda_record_as()`
- `can_manage_agenda_record_as()`
- `current_user_is_academic_calendar_platform_admin()`
- `current_user_can_manage_academic_calendar()`
- `resolve_support_requester_context()`

## Correção de segurança adicional

`can_manage_agenda_record_as()` deixou de conceder a operação própria quando não existe membership resolvida. O comportamento anterior era incompatível com fail-closed.

## Validação

- função permanece `STABLE`;
- não utiliza tabela temporária;
- `anon` não possui EXECUTE no resolvedor;
- `authenticated` possui EXECUTE;
- nenhum dado operacional de memberships foi criado artificialmente;
- nenhum DDL de Escala foi criado;
- nenhum role físico de `organization_members` foi canonicalizado.

## Limitação atual

O Core operacional continua vazio para memberships/teacher profiles/scopes. Portanto, a correção estrutural está aplicada, mas o teste ponta a ponta com identidade institucional real permanece pendente.

Próximo gate: reproduzir H01–H36 e C01–C24 contra a implementação física usando contexto autenticado controlado; depois executar regressão dos consumidores antes de avançar para RLS/Escala.
