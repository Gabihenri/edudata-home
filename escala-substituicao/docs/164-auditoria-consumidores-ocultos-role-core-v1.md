# 164 — Auditoria de Consumidores Ocultos de Role no Core

**Data:** 2026-10-08  
**Status:** 🟠 bloqueador crítico ampliado  
**Escopo:** funções públicas do Core que leem `organization_members` e/ou resolvem role

## 1. Inventário revalidado

Além das funções já identificadas, a varredura física encontrou os seguintes consumidores:

- `can_access_identity_product(text)`
- `can_view_agenda_record_as(uuid,uuid,uuid,uuid)`
- `can_manage_agenda_record_as(uuid,uuid,uuid,uuid,text)`
- `current_identity_role()`
- `can_view_identity_user(uuid,uuid,uuid)`
- `current_user_can_manage_academic_calendar(uuid,uuid)`
- `current_user_can_view_academic_calendar(uuid,uuid)`
- `current_user_is_academic_calendar_platform_admin()`
- `resolve_support_requester_context(uuid)`
- `edi_current_user_access(text)`

Nem todos usam o valor de role para autorização direta, mas todos devem ser classificados antes da alteração do contrato.

## 2. Novo achado crítico — calendário acadêmico

`current_user_can_manage_academic_calendar` compara `organization_members.role` diretamente com:

- `institution_admin`
- `institutional_admin`
- `regional_manager`
- `supervisor`
- `principal`
- `director`
- `diretor`
- `vice_principal`
- `vice_director`
- `vice_diretor`

A coluna física de membership atualmente aceita somente:

- `professor`
- `coordenador`
- `diretor`
- `administrador`

Logo, parte relevante das condições dessa função não pode ser satisfeita por uma membership que respeite a constraint física atual.

Isso confirma que existe histórico de múltiplos vocabulários de role dentro do próprio Core.

## 3. Novo achado — administrador de plataforma

`current_user_is_academic_calendar_platform_admin` consulta tanto `user_profiles.role` quanto `organization_members.role` para:

- `platform_admin`
- `super_admin`
- `superadmin`
- `superadministrador`

O segundo caminho é incompatível com a constraint atual de `organization_members.role`.

A função também mantém uma fonte distinta de identidade de plataforma em `user_profiles`.

**Conclusão:** o futuro resolvedor canônico precisa declarar explicitamente precedência entre perfil de plataforma e membership institucional; não pode simplesmente substituir strings.

## 4. Consumidores sem role-dependência direta

### `can_view_identity_user`

Usa membership, organização, escola, janela temporal, flags de acesso e `identity_responsibility_scopes`, mas não compara `membership.role`.

**Classificação:** não precisa de alteração funcional por canonicalização de role, embora deva permanecer na regressão de autorização.

### `edi_current_user_access`

Usa `organization_members` para determinar vínculo institucional de assinatura/licença, mas não usa `organization_members.role`.

**Classificação:** não é consumidor semântico de role.

### `resolve_support_requester_context`

Lê `membership.role` e o propaga para `selected_role`. Para contas corporativas, o role retornado é preferencialmente o membership role; para contas de plataforma, o `user_profiles.role` prevalece.

**Classificação:** consumidor semântico de role e dependência de contrato de saída. Não deve ser alterado silenciosamente.

## 5. Implicação arquitetural

A canonicalização não pode ser tratada como correção exclusiva da Escala ou da função `can_access_identity_product`.

O Core possui pelo menos três padrões históricos:

1. membership com códigos legados;
2. catálogo/permissões com códigos canônicos;
3. funções com mistura de códigos canônicos, legados e aliases históricos.

Portanto, a próxima especificação deve definir **um resolvedor canônico central do Core**, incluindo:

- entrada: membership/profile/context;
- role canônico de saída;
- precedência de múltiplas memberships;
- tratamento de plataforma;
- tratamento de role desconhecido;
- fail closed;
- compatibilidade dos consumidores existentes;
- preservação do contrato de `resolve_support_requester_context`;
- regressão Agenda + calendário + demais consumidores.

## 6. Não fazer

Não:

- adicionar mais aliases à constraint;
- transformar Escala em resolvedor de roles;
- criar tabela de mapeamento específica da Escala;
- copiar permissões Agenda;
- canonicalizar fisicamente memberships sem migração e regressão;
- permitir que `user_profiles.role` substitua indiscriminadamente membership;
- usar título/cargo textual como autorização.

## 7. Estado do gate

| Dependência | Estado |
|---|---|
| Agenda | 🔴 depende de role |
| Identity product access | 🔴 depende de role |
| Current identity role | 🔴 retorna vocabulário legado |
| Academic calendar | 🔴 mistura canônico + aliases |
| Platform admin | 🔴 múltiplas fontes/aliases |
| Identity user scope | 🟢 sem role direto |
| Subscription/feature access | 🟢 sem role direto |
| Support context | 🟠 contrato depende do role retornado |
| RLS auditado | 🟢 sem dependência direta encontrada |
| Trigger auditado | 🟢 sem dependência direta encontrada |
| Resolvedor central | 🟠 necessário |
| DDL Escala | 🔴 continua bloqueado |

**Nenhuma alteração de produção foi realizada.**
