# 165 — Contrato do Resolvedor Canônico de Roles do Core v1

**Data:** 2026-10-08
**Status:** 🟠 especificação pronta para harness; produção ainda bloqueada

## 1. Objetivo
Definir uma única regra central para transformar a identidade operacional do Core em um role canônico, sem criar RBAC paralelo e sem permitir que produtos resolvam roles localmente.

O resolvedor deve servir como infraestrutura compartilhada para Agenda Inteligente EDI, Calendário Acadêmico, Escala Inteligente EDI, Support e demais produtos que utilizem autorização baseada em identidade.

## 2. Fonte de autoridade
A autorização continua pertencendo ao Core.

Ordem conceitual: auth.uid() → user_profile/membership válidos → role canônico → produto → operação → scope → recurso.

O resolvedor não concede permissão. Ele somente resolve identidade/role. Produto, operação e escopo continuam sendo avaliados pelas respectivas camadas de autorização.

## 3. Vocabulário canônico
Os únicos códigos de saída aceitos são: student, teacher, coordinator, vice_principal, principal, supervisor, regional_manager, institution_admin, platform_admin, super_admin.

Nenhum alias histórico pode ser devolvido como role canônico.

## 4. Mapeamento legado homologado

| Membership legado | Role canônico |
|---|---|
| professor | teacher |
| coordenador | coordinator |
| diretor | principal |
| administrador | institution_admin |

Esse mapeamento pertence ao Core; a Escala não pode implementá-lo localmente.

## 5. Roles de plataforma
platform_admin e super_admin são determinados pelo contexto de identidade de plataforma homologado.

Membership institucional não deve ser convertido arbitrariamente em role de plataforma. Textos como superadmin ou superadministrador não são suficientes, por si só, para conceder role canônico.

## 6. Precedência
Sem auth.uid(): UNAUTHENTICATED e nenhum role.

Com identidade de plataforma ativa e homologada: super_admin precede platform_admin.

Na ausência de contexto de plataforma, considerar somente memberships institucionais ativas, respeitando janela temporal e organização/escola solicitadas.

Seleção determinística: hierarchy_level DESC, updated_at DESC, created_at ASC.

## 7. Multiple memberships
O resolvedor deve produzir uma resolução determinística por contexto.

Não é permitido escolher aleatoriamente, depender da ordem física sem ORDER BY, misturar permissões de duas memberships ou elevar role por membership de outra organização.

## 8. Role desconhecido
Qualquer role não resolvido inequivocamente resulta em ROLE_UNRESOLVED.

Comportamento: fail closed para autorização; sem fallback silencioso para teacher; sem aceitar aliases novos automaticamente; homologação obrigatória no Core.

## 9. Resultado mínimo
resolved; denial_code ou resolution_code; actor_user_id; organization_id; school_id; membership_id; role_code canônico; role_source; hierarchy_level; resolution_version.

Quando não resolvido, role_code deve ser NULL.

## 10. Códigos mínimos
RESOLVED_PLATFORM_SUPER_ADMIN, RESOLVED_PLATFORM_ADMIN, RESOLVED_MEMBERSHIP, RESOLVED_PROFILE, UNAUTHENTICATED, NO_VALID_MEMBERSHIP, ROLE_UNRESOLVED, CONTEXT_INVALID, MULTIPLE_CONTEXTS_AMBIGUOUS.

## 11. Compatibilidade
can_access_identity_product() deve consumir o role canônico.

can_view_agenda_record_as() e can_manage_agenda_record_as() devem consumir o role canônico, preservando organização, escola, escopo e permissões.

O Calendário deve abandonar listas locais de aliases e consumir o role canônico.

resolve_support_requester_context() deve preservar seu contrato externo, mas requester_role deve representar o role canônico quando resolvido.

A Escala consumirá o resolvedor do Core e não terá tabela, função ou enumeração própria de roles.

## 12. Segurança
O resolvedor não usa user_metadata.role, app_metadata.role, role enviado pelo cliente, matching por nome/e-mail/CPF/título ou conversão automática de dados SED em identidade.

Não concede permissões, não substitui RLS e não substitui responsibility scopes.

Se SECURITY DEFINER for necessário, deverá usar search_path controlado.

## 13. Versionamento
Mudanças no mapeamento ou na precedência exigem nova resolution_version e novo harness de regressão.

Nenhum resultado histórico de autorização deve ser reinterpretado retroativamente.

## 14. Gate de implementação
Antes da implementação física: harness do resolvedor; múltiplas memberships; plataforma; roles desconhecidos; regressão dos consumidores Core; validação de Support, Agenda e Calendário.

Nenhuma alteração de produção é autorizada por este documento.