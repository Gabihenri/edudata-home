# 152 — Auditoria Membership × Scope do Core para Escala v1

**Data:** 29/09/2026  
**Status:** 🟢 ESTRUTURA / 🔴 DADOS OPERACIONAIS AUSENTES

## 1. Organization Members

A estrutura física de `public.organization_members` contém os elementos necessários para contextualização inicial da autorização:

- `organization_id`
- `user_id`
- `role`
- `status`
- `school_id`
- `hierarchy_level`
- `scope_type`
- `scope_id`
- `access_starts_at`
- `access_ends_at`
- `approved_by`
- `approved_at`
- indicadores de visualização, gestão e auditoria.

A consulta de 29/09/2026 encontrou:

- membros: **0**
- membros ativos: **0**
- membros com escola: **0**
- membros com janela de acesso: **0**

Assim, a estrutura é compatível, mas ainda não existe contexto institucional real para o Resolver executar contra dados operacionais.

## 2. Responsibility Scopes

A estrutura física de `public.identity_responsibility_scopes` utiliza:

- `manager_user_id`
- `target_user_id`
- `organization_id`
- `school_id`
- `scope_type`
- `scope_reference_id`
- `permission_level`
- `valid_from`
- `valid_until`
- `status`
- `approved_by`
- `approved_at`.

### Ponto de reconciliação

Alguns contratos conceituais utilizam o termo genérico `scope_id`. A estrutura física usa `scope_reference_id` para a referência do escopo.

Isso **não deve ser alterado agora**.

A implementação futura deve mapear explicitamente o contrato lógico para a coluna física, sem criar uma segunda coluna ou uma tabela paralela.

## 3. Consequência para o Resolver

A sequência permanece:

`auth.uid()`
→ membership ativo
→ papel canônico
→ produto Escala
→ permissão da operação
→ responsibility scope
→ escola/recurso
→ auditoria.

Não há base para executar essa cadeia em produção enquanto membership, scopes, permissões Escala e identidade docente permanecerem sem dados homologados.

## 4. Decisão

**Não criar DDL.**  
**Não popular dados fictícios em produção.**  
**Não criar alias físico para `scope_id`.**  
**Não implementar Resolver produtivo ainda.**

Próximo gate seguro:

1. homologar membros reais;
2. homologar scopes reais;
3. homologar permissões `escala.*`;
4. homologar ponte Auth ↔ identidade docente;
5. somente então executar harness do Resolver contra Core real.

Nenhuma alteração de produção foi realizada.
