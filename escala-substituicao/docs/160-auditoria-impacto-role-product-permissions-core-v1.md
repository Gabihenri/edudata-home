# 160 — Auditoria do impacto Role × Product Permission no Core v1

**Data:** 08/10/2026  
**Status:** 🔴 INCOMPATIBILIDADE CONFIRMADA

## Resultado

A tabela `identity_product_permissions` possui 25 registros distribuídos em 9 códigos canônicos:

- `teacher`: 4
- `coordinator`: 5
- `vice_principal`: 3
- `principal`: 4
- `supervisor`: 1
- `regional_manager`: 1
- `institution_admin`: 3
- `platform_admin`: 2
- `super_admin`: 2

Não há registros usando os códigos legados:

- `professor`
- `coordenador`
- `diretor`
- `administrador`

## Cruzamento com membership

A constraint física de `organization_members.role` aceita apenas os quatro códigos legados.

A função `can_access_identity_product()` faz join direto:

`identity_product_permissions.role_code = organization_members.role`

Consequentemente, os conjuntos atuais não possuem interseção.

## Importância

A incompatibilidade é estrutural e anterior à Escala.

Ela significa que não devemos concluir que o sistema de produtos esteja operacionalmente validado apenas pela presença de registros em `identity_product_permissions`. O mecanismo de resolução depende da existência de memberships compatíveis, que atualmente também estão zerados.

## Escala

Não inserir `escala` em `identity_product_permissions` neste estado.

Primeiro é necessário resolver no Core a canonicalização/compatibilidade de papéis e testar regressão dos produtos existentes.

## Decisão

Nenhuma correção local na Escala.

Nenhuma alteração de produção realizada.

Próximo gate: especificar e testar a estratégia oficial de canonicalização de roles no Core, incluindo compatibilidade retroativa, RLS e funções SECURITY DEFINER dependentes de `organization_members.role`.
