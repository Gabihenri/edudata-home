# 162 — Auditoria de dependências de Role em RLS e Triggers do Core v1

**Data:** 08/10/2026  
**Status:** 🟢 RISCO RLS/TRIGGER BAIXO; 🟡 FUNÇÕES DE AUTORIZAÇÃO PENDENTES

## RLS

As policies pesquisadas que consultam `organization_members` utilizam membership ativo, organização e janela de acesso, mas não dependem do valor de `organization_members.role`.

Não foram encontradas policies chamando:

- `current_identity_role()`;
- `can_access_identity_product()`;
- `can_view_identity_user()`.

Portanto, a eventual canonicalização do campo `role` não exige, pela evidência atual, alteração automática das RLS policies identificadas.

## Triggers

Não foram encontrados triggers de produção cuja definição dependa de `organization_members.role`.

O trigger encontrado em `identity_roles` é somente de atualização de timestamp.

## Funções

A dependência relevante permanece concentrada nas funções de autorização/produto já auditadas:

- `can_access_identity_product()`;
- `can_view_agenda_record_as()`;
- `can_manage_agenda_record_as()`;
- `current_identity_role()`.

Essas funções consultam membership e/ou fazem join com `identity_product_permissions`.

## Conclusão

A estratégia de canonicalização não apresenta, neste momento, evidência de quebra direta de RLS ou triggers.

O principal impacto está na camada de resolução de identidade/autorização.

Isso favorece uma correção centralizada no Core, desde que acompanhada por testes de regressão das funções acima e dos produtos existentes.

Nenhuma alteração de produção foi realizada.
