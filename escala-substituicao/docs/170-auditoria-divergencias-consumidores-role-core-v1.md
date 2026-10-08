# 170 — Auditoria de divergência das funções consumidoras do role Core

**Data:** 2026-10-08
**Status:** 🔴 divergências encontradas; nenhum patch de produção aplicado

## 1. Divergência principal — Identity Product
`can_access_identity_product()` faz join direto `identity_product_permissions.role_code = organization_members.role`.

Consequência: membership com `professor` não encontra `teacher`; `coordenador` não encontra `coordinator`; `diretor` não encontra `principal`; `administrador` não encontra `institution_admin`.

Classificação: **BLOCKER para a correção central**.

## 2. Divergência — Agenda
`can_view_agenda_record_as()` e `can_manage_agenda_record_as()` também fazem join direto entre `permission.role_code` e `membership.role`.

Além do problema de vocabulário, `can_manage_agenda_record_as()` contém um comportamento legado: quando o ator é o próprio alvo e não possui membership ativa, pode retornar true para update/delete/restore antes da validação de permissão. Esse comportamento não será alterado junto com o resolvedor sem uma decisão específica de segurança/regressão.

Classificação: **role mismatch = blocker; comportamento self-without-membership = dívida de segurança separada**.

## 3. Divergência — current_identity_role
`current_identity_role()` retorna diretamente `organization_members.role`, portanto expõe o vocabulário legado.

Classificação: **deve passar a consumir o resolvedor canônico**, preservando assinatura.

## 4. Divergência — Calendário
`current_user_can_manage_academic_calendar()` compara diretamente membership.role contra uma mistura de códigos canônicos e aliases históricos.

`current_user_is_academic_calendar_platform_admin()` consulta tanto `user_profiles.role` quanto `organization_members.role` com aliases de plataforma.

Classificação: **deve migrar para o resolvedor central**, mas a semântica de plataforma precisa ser homologada antes.

## 5. Divergência — Support
`resolve_support_requester_context()` seleciona `profile_role` e `membership_role` separadamente e pode usar profile para determinar conta de plataforma. Seu contrato de saída não pode ser quebrado.

Classificação: **migração compatível obrigatória**, com regressão específica de account_type, requester_role, hierarchy, organization e school.

## 6. Divergência — EDI access
`edi_current_user_access()` usa role de profile para contexto de plataforma, mas membership serve principalmente para contexto institucional de assinatura. Não deve ser alterado automaticamente.

Classificação: **consumidor semântico de identidade; regressão necessária antes de eventual alteração**.

## 7. Decisão arquitetural
Não aplicar canonicalização física de `organization_members.role` neste momento.

Preparar primeiro um resolvedor Core central e uma camada de compatibilidade, mantendo assinaturas públicas das funções consumidoras.

Não corrigir simultaneamente o comportamento self-without-membership de Agenda; abrir esse ponto como gate separado para evitar uma mudança não auditada.

## 8. Próximo gate
Construir o contrato físico do resolvedor e seu harness contra as tabelas reais, sem persistência de dados. Em seguida, adaptar primeiro `can_access_identity_product()` em ambiente controlado e executar regressão antes de tocar Agenda/Calendário/Support.