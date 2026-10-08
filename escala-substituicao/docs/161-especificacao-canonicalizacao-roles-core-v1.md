# 161 — Especificação preliminar de canonicalização de roles do Core v1

**Data:** 08/10/2026  
**Status:** 🟡 ESPECIFICAÇÃO — NÃO IMPLEMENTAR

## Objetivo

Eliminar a divergência entre a taxonomia legada de `organization_members.role` e o catálogo canônico `identity_roles.code`, sem criar RBAC paralelo.

## Evidência

Foi confirmado que:

- `identity_roles` usa códigos canônicos;
- `identity_product_permissions` usa somente códigos canônicos;
- `organization_members.role` aceita somente `professor`, `coordenador`, `diretor`, `administrador`;
- `can_access_identity_product()` faz igualdade direta entre membership.role e permission.role_code;
- `can_view_agenda_record_as()` e `can_manage_agenda_record_as()` repetem a mesma dependência para `agenda_edi`.

## Princípio

A fonte canônica deve ser `identity_roles.code`.

A compatibilidade com dados legados deve ser tratada no Core, não na Escala.

## Estratégia a validar

Antes de qualquer DDL, comparar duas alternativas:

### A — Canonicalização física do membership

Migrar os valores legados de `organization_members.role` para os códigos canônicos correspondentes e ajustar a constraint.

Mapeamento preliminar a validar:

- professor → teacher
- coordenador → coordinator
- diretor → principal
- administrador → institution_admin

Os demais papéis canônicos continuariam disponíveis para novos memberships conforme regras do Core.

### B — Camada canônica derivada

Manter temporariamente o valor legado no membership, mas expor uma resolução canônica centralizada usada por todas as funções de autorização/produto.

Essa alternativa somente é aceitável se não criar segunda fonte de verdade e se a resolução for única, documentada e testada.

## Requisito obrigatório

Não escolher A ou B apenas para destravar a Escala.

A decisão deve considerar todos os consumidores existentes:

- `can_access_identity_product()`;
- `can_view_agenda_record_as()`;
- `can_manage_agenda_record_as()`;
- `current_identity_role()`;
- `current_identity_membership()`;
- RLS/policies;
- produtos já existentes.

## Testes mínimos antes da produção

1. cada papel canônico resolve corretamente;
2. cada produto mantém suas permissões;
3. professor/teacher continua restrito;
4. coordinator mantém escopo;
5. principal mantém escopo institucional;
6. papéis regionais/plataforma continuam distintos;
7. membership ativo/inativo continua respeitado;
8. access_starts_at/access_ends_at continuam respeitados;
9. RLS não ganha privilégio por mudança de código;
10. ausência de membership continua negando;
11. produto sem permissão continua negando;
12. Escala continua sem permissão até seu próprio gate.

## Decisão atual

**Não implementar A nem B ainda.**

A especificação fecha o problema e delimita as duas soluções tecnicamente aceitáveis.

O próximo passo seguro é construir um harness de compatibilidade em PostgreSQL, isolado, cobrindo a estratégia de canonicalização e regressão dos consumidores existentes.

Nenhuma alteração de produção foi realizada.
