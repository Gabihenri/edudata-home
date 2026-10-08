# 166 — Auditoria do Harness do Resolvedor Canônico de Roles do Core v1

**Data:** 2026-10-08
**Status:** 🟢 harness sintético reproduzido em PostgreSQL real; 🔴 implementação física ainda bloqueada

## Evidência
O cenário H01–H10 do arquivo `escala-substituicao/tests/core-role-resolver-v1.postgres.test.sql` foi reproduzido em PostgreSQL real no projeto Supabase `ihchzfndmdwtoabttkil`.

Resultado: 10 casos totais.
- 8 casos de resolução canônica/platform passaram pela matriz esperada.
- 1 caso de membership inválida confirmou fail closed.
- 1 caso de role desconhecido confirmou fail closed.
- 0 falhas no cenário reproduzido.

## Revalidação física
A inspeção do Core confirmou que `organization_members.role` continua armazenando o vocabulário legado, enquanto `identity_roles.code` representa o vocabulário canônico.

Também permanecem as funções consumidoras que não devem ser corrigidas localmente na Escala. A correção deve ser centralizada no Core para preservar Agenda, Calendário, Support e demais consumidores.

## Limite da evidência
Este é um harness sintético reproduzido em PostgreSQL real. Ele não constitui validação de produção do resolvedor, porque o resolvedor físico ainda não existe.

Não foram alterados dados, funções, políticas RLS ou migrations de produção.

## Próximo gate
Expandir o harness para múltiplas memberships, contexto de organização/escola, plataforma versus membership, conflito profile × membership, aliases históricos do Calendário e compatibilidade de `resolve_support_requester_context()`.

Só depois dessa regressão deve ser preparada a alteração central das funções de autorização do Core.