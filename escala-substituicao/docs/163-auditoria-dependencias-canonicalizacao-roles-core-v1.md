# 163 — Auditoria de Dependências Físicas da Canonicalização de Roles no Core

**Data:** 2026-10-08  
**Escopo:** Core Compartilhado / EIOS — identidade e autorização  
**Status:** 🟠 BLOQUEADOR CRÍTICO CONFIRMADO; correção ainda não aplicada

## 1. Objetivo

Determinar se a correção da divergência entre os códigos legados de `organization_members.role` e os códigos canônicos de `identity_roles` pode ser aplicada sem alterar indevidamente RLS, triggers ou contratos dos produtos existentes.

## 2. Evidência física revalidada

### 2.1 Membership

`organization_members.role` possui somente:

- `professor`
- `coordenador`
- `diretor`
- `administrador`

A restrição física é um CHECK:

`organization_members_role_check`

Não existe FK de `organization_members.role` para `identity_roles.code`.

### 2.2 Catálogo canônico

`identity_roles.code` é PK e contém os códigos canônicos:

- student
- teacher
- coordinator
- vice_principal
- principal
- supervisor
- regional_manager
- institution_admin
- platform_admin
- super_admin

### 2.3 Permissões

`identity_product_permissions.role_code` não possui FK observada para `identity_roles.code` e possui somente a unicidade:

`UNIQUE (role_code, product_code)`

Os 25 registros físicos existentes usam códigos canônicos; nenhum usa os quatro códigos legados de membership.

### 2.4 RLS

As policies físicas atualmente observadas são:

- `organization_members_own_read`: `user_id = auth.uid()`
- `identity_permissions_authenticated_read`: `true`
- `identity_roles_authenticated_read`: `is_active = true`

Não foi encontrada policy dessas três tabelas chamando `current_identity_role()` ou `can_access_identity_product()`.

**Conclusão:** a divergência de role não é, neste momento, uma dependência direta das policies RLS auditadas.

### 2.5 Triggers

A auditoria anterior de triggers não encontrou trigger dependente do valor de `organization_members.role`. O trigger relevante de atualização automática está associado ao controle de `identity_roles.updated_at`.

**Conclusão:** não há evidência atual de que a canonicalização exija alteração de triggers.

## 3. Dependências funcionais críticas

A divergência é efetivamente consumida pelas funções:

- `can_access_identity_product(text)`
- `can_view_agenda_record_as(uuid,uuid,uuid,uuid)`
- `can_manage_agenda_record_as(uuid,uuid,uuid,uuid,text)`
- `current_identity_role()`

As três primeiras fazem igualdade direta entre:

`organization_members.role = identity_product_permissions.role_code`

A função `current_identity_role()` devolve diretamente o código legado de membership.

Portanto, uma membership real com `role='professor'` não encontra a permissão canônica `teacher`. O mesmo problema ocorre com os demais pares legados/canônicos.

## 4. Origem arquitetural observada

O arquivo `database/13_identity_governance.sql` confirma que o catálogo `identity_roles` foi introduzido como matriz central de perfis e que `identity_product_permissions` foi concebido para autorização compartilhada entre produtos.

O mesmo arquivo, porém, evolui `organization_members` sem substituir o contrato legado de `role`.

Resultado: existem dois vocabulários físicos para o mesmo conceito de identidade:

- membership: vocabulário legado;
- catálogo/permissões: vocabulário canônico.

Não foi encontrada evidência suficiente para concluir que a coluna legacy possa ser simplesmente renomeada ou seus valores alterados em produção.

## 5. Decisão técnica

**Não aplicar ainda a estratégia A (canonicalização física direta).**

A estratégia segura permanece:

1. definir um único resolvedor canônico no Core;
2. fazer todas as funções de autorização dependentes de role consumirem esse resolvedor;
3. preservar o armazenamento legado enquanto a migração operacional de memberships não for homologada;
4. testar regressão dos produtos existentes, especialmente Agenda;
5. somente depois avaliar uma eventual migração física dos valores de membership.

O resolvedor deve ser centralizado no Core. A Escala não deve criar tabela de mapeamento, função de role ou RBAC paralelo.

## 6. Critérios para a próxima etapa

Antes de qualquer DDL produtivo:

- identificar todas as funções/views/policies que leem `organization_members.role`;
- identificar todas as referências a `identity_product_permissions.role_code`;
- definir contrato formal do resolvedor canônico;
- executar harness isolado de compatibilidade;
- executar regressão dos produtos que usam autorização compartilhada;
- validar comportamento com memberships ativas, suspensas, expiradas e múltiplas memberships;
- somente então escolher entre resolver centralmente e, posteriormente, canonicalizar fisicamente.

## 7. Resultado do gate

| Área | Estado |
|---|---|
| Estrutura do catálogo canônico | 🟢 |
| Identificação da divergência | 🟢 |
| RLS dependente diretamente de role | 🟢 sem dependência encontrada |
| Triggers dependentes diretamente de role | 🟢 sem dependência encontrada |
| Funções de autorização afetadas | 🔴 |
| Canonicalização física segura para produção | 🔴 não homologada |
| Necessidade de novo RBAC | 🟢 não |
| Necessidade de resolvedor central no Core | 🟠 alta |
| Implementação da Escala | 🔴 bloqueada até correção do Core |

## 8. Regra de governança

Nenhuma permissão `escala.*`, membership operacional, vínculo Auth↔teacher, RLS da Escala ou RPC da Escala deve ser criada enquanto a resolução canônica de roles do Core não estiver homologada.

**Nenhuma alteração de produção foi realizada nesta auditoria.**
