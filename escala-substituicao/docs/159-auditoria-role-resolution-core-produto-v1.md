# 159 — Auditoria de resolução de papel no Core e impacto no acesso a produtos v1

**Data:** 08/10/2026  
**Status:** 🔴 BLOQUEIO CORE CONFIRMADO — SEM ALTERAÇÃO

## Evidência

Foi inspecionado o conjunto de funções de identidade do Core.

### `current_identity_role()`

Retorna diretamente:

`organization_members.role`

Não consulta `identity_roles`.

### `current_identity_membership()`

Retorna o membership ativo diretamente de `organization_members`.

### `current_identity_hierarchy_level()`

Retorna diretamente `organization_members.hierarchy_level`.

### `can_access_identity_product(requested_product_code)`

A função realiza:

`organization_members.role = identity_product_permissions.role_code`

e exige `can_access = true`.

Portanto, existe dependência física direta entre o código legado de papel do membership e o código utilizado em `identity_product_permissions`.

## Relevância

A auditoria 158 identificou:

- `organization_members.role` aceita: `professor`, `coordenador`, `diretor`, `administrador`;
- `identity_roles.code` utiliza códigos canônicos como `teacher`, `coordinator`, `principal`, `institution_admin`, etc.

A função de acesso a produto não possui tradução entre esses conjuntos.

Isso significa que a divergência não é meramente documental da Escala: ela é uma **incompatibilidade de resolução de identidade do Core**.

## Consequência para Escala

Não é seguro implementar o Resolver da Escala sobre uma tradução local.

Não se deve:

- duplicar o catálogo de papéis na Escala;
- criar CASE/mapeamento dentro do Resolver;
- alterar `organization_members.role` diretamente;
- inserir permissões `escala` usando códigos escolhidos ad hoc;
- assumir que `current_identity_role()` já retorna o papel canônico.

## Decisão

O Core precisa primeiro definir uma estratégia oficial de canonicalização/compatibilidade de roles.

Essa decisão deve preservar os produtos existentes e ser validada contra:

- `identity_roles`;
- `organization_members`;
- `identity_product_permissions`;
- `current_identity_role()`;
- `can_access_identity_product()`;
- RLS/policies existentes;
- regressão dos produtos já operacionais.

Nenhuma alteração de produção foi realizada.

## Gate

O Authorization Resolver da Escala permanece bloqueado até que a resolução de papel do Core esteja formalmente definida e testada.

A descoberta não invalida o catálogo canônico de `identity_roles`; ela demonstra que a camada física de membership/produto ainda opera com uma taxonomia legada.
