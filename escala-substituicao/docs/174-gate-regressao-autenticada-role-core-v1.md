# 174 — Gate de regressão autenticada do resolvedor Role Core

**Data:** 2026-10-08  
**Status:** 🟡 pronto para execução; aguardando sessão autenticada controlada

## Decisão

Não é seguro nem metodologicamente válido simular `auth.uid()` no canal administrativo para declarar aprovação do resolvedor.

A função física exige:
- usuário autenticado;
- `p_user_id = auth.uid()`;
- membership real;
- fixtures controladas.

## Harness

Criado:
`escala-substituicao/tests/core-role-resolver-authenticated-session-v1.sql`

Casos H37–H48:
- mappings legados;
- role desconhecido;
- membership suspensa;
- validade temporal;
- prioridade de platform/super admin;
- conflito profile × membership;
- ambiguidade real.

## Bloqueio atual

O ambiente administrativo não fornece uma sessão JWT autenticada com `auth.uid()` substituível de maneira segura. Não serão criados usuários/memberships permanentes apenas para satisfazer o teste.

## Critério de aprovação

Aprovar somente quando os H37–H48 forem executados via cliente autenticado dedicado e os resultados coincidirem com o contrato v1.

Até lá, o resolvedor permanece **implementado, estruturalmente validado, mas não homologado ponta a ponta**.
