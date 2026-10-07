# 158 — Auditoria de compatibilidade de papéis do Core com o Resolver Escala v1

**Data:** 07/10/2026  
**Status:** 🔴 INCOMPATIBILIDADE FÍSICA A HOMOLOGAR — SEM ALTERAÇÃO

## Evidência física

O catálogo canônico `identity_roles` contém papéis em códigos normalizados:

- `teacher`
- `coordinator`
- `vice_principal`
- `principal`
- `supervisor`
- `regional_manager`
- `institution_admin`
- `platform_admin`
- `super_admin`

Entretanto, a constraint física de `organization_members.role` é:

`CHECK (role = ANY (ARRAY['professor', 'coordenador', 'diretor', 'administrador']))`

Também foi confirmado que `organization_members.role` possui default `'professor'`.

## Conclusão

Há uma divergência entre:

1. **catálogo canônico de identidade**, que já contém a taxonomia necessária ao Escala; e
2. **constraint física de membership**, que permanece com códigos legados em português e somente quatro valores.

Isso impede assumir que o Resolver físico possa simplesmente comparar `organization_members.role` com `identity_roles.code`.

## Risco para Escala

O Resolver precisa de uma fonte canônica de papel. Enquanto a incompatibilidade não for formalmente resolvida, não se deve:

- implementar comparação direta `organization_members.role = identity_roles.code`;
- criar mapeamento implícito dentro do Resolver;
- duplicar RBAC no produto Escala;
- inserir novos papéis na constraint sem decisão do Core;
- alterar registros de produção para contornar a divergência.

## Decisão

A estrutura de `identity_roles` é suficiente e não requer novos papéis.

O bloqueio está na **compatibilidade entre membership físico e catálogo canônico**.

A resolução correta deve ser definida no Core, com migração/compatibilidade controlada e testes de regressão, antes da implementação física do Authorization Resolver da Escala.

Nenhuma alteração de produção foi realizada.

## Próximo gate

Antes do Resolver físico:

`Core role canonicalization`
→ `membership compatibility`
→ `real memberships`
→ `real scopes`
→ `teacher identity homologation`
→ `E3 SED`
→ `Authorization Resolver physical`

