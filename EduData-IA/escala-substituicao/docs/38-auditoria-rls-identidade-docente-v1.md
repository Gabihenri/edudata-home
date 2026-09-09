# 38 — Auditoria RLS e Segurança do Vínculo de Identidade Docente v1

**Data:** 2026-09-09  
**Status:** 🔴 GATE BLOQUEADO  
**Produto:** Escala Inteligente de Substituição

## 1. Objetivo

Auditar o Core físico atual antes de liberar `academic_teacher_identity_links`, verificando a base real de autorização, as policies existentes, as funções centrais de identidade e as condições necessárias para uma futura RLS da ponte.

**Regra:** esta auditoria não executa DDL e não cria nenhuma tabela de produção.

## 2. Evidência física consultada

Projeto Supabase: `EduData IA` (`ihchzfndmdwtoabttkil`).

Foram inspecionados diretamente:

- `user_profiles`;
- `organization_members`;
- `teacher_profiles`;
- `identity_product_permissions`;
- `identity_responsibility_scopes`;
- `identity_audit_logs`;
- policies RLS existentes;
- funções `can_access_identity_product`, `current_identity_role`, `can_view_identity_user`, `can_view_agenda_record` e `can_update_agenda_record`.

## 3. Achados

### RLS-AUD-01 — autorização central existente

**Severidade:** High  
**Estado:** FECHADO

O Core já possui `organization_members` como base institucional e `identity_product_permissions` como catálogo de acesso por produto/papel.

A função `can_access_identity_product(requested_product_code)` verifica membership ativo, janela temporal de acesso e permissão do produto.

**Decisão:** não criar RBAC específico para Escala.

---

### RLS-AUD-02 — leitura atual de permissões é ampla

**Severidade:** High  
**Estado:** ABERTO

A policy física observada para `identity_product_permissions` permite `SELECT` a qualquer usuário `authenticated` (`qual = true`).

Isso não significa, por si só, exposição de dados de professores, mas demonstra que a tabela de catálogo não deve ser tratada como mecanismo suficiente de confidencialidade.

**Ação:** futuras policies da ponte devem avaliar o contexto do usuário e usar função de autorização; não depender de leitura irrestrita do catálogo.

---

### RLS-AUD-03 — `organization_members` não fornece visão administrativa geral por policy direta

**Severidade:** High  
**Estado:** ABERTO

A policy observada é `organization_members_own_read`, com `user_id = auth.uid()`.

Portanto, a futura homologação de vínculo docente não pode pressupor que um gestor conseguirá consultar diretamente todos os memberships necessários apenas através da RLS atual.

**Ação:** usar função SECURITY DEFINER cuidadosamente desenhada ou fluxo administrativo server-side já homologado, sem ampliar a policy de forma indiscriminada.

---

### RLS-AUD-04 — `user_profiles` segue princípio de leitura própria

**Severidade:** Medium  
**Estado:** FECHADO

A policy observada restringe leitura a `user_id = auth.uid()`.

Isso reforça a separação entre identidade autenticada e autorização institucional. A ponte não deve quebrar esse isolamento.

---

### RLS-AUD-05 — `identity_responsibility_scopes` já representa delegação

**Severidade:** High  
**Estado:** FECHADO

A policy observada permite leitura quando o usuário é `manager_user_id` ou `target_user_id`.

A futura autorização da ponte deve considerar essa camada de responsabilidade quando aplicável, em vez de criar uma segunda hierarquia administrativa.

---

### RLS-AUD-06 — `can_view_identity_user` contém lógica institucional relevante

**Severidade:** High  
**Estado:** ABERTO PARA INTEGRAÇÃO

A função verifica `auth.uid()`, membership ativo, organização alvo, responsibility scope, `can_view_school` e `can_view_network`.

Ela é evidência útil para o desenho de autorização, mas não deve ser reutilizada automaticamente para a ponte sem verificar se seu conceito de “ver usuário” é equivalente ao de “homologar identidade acadêmica”.

**Decisão:** não usar a função como substituta da permissão específica de homologação.

---

### RLS-AUD-07 — `teacher_profiles` não possui vínculo Auth físico

**Severidade:** Critical  
**Estado:** ABERTO

A auditoria física confirmou que `teacher_profiles` possui `school_id` → `schools.id`, mas não possui FK para `user_profiles.user_id` ou `auth.users.id`.

Portanto, a ponte explícita continua necessária como hipótese técnica.

---

### RLS-AUD-08 — `teacher_profiles` está vazio no momento da auditoria

**Severidade:** Critical  
**Estado:** ABERTO / DADO OPERACIONAL

A consulta física encontrou **0 registros** em `teacher_profiles`.

Consequência: não é possível homologar uma relação Auth ↔ docente usando dados reais do Core neste momento. Também não é possível validar empiricamente uma política de multi-escola sobre docentes existentes.

**Ação obrigatória:** a carga/homologação de perfis docentes deve preceder qualquer ativação operacional da Escala.

---

### RLS-AUD-09 — referência a `auth.users` ainda requer decisão de implementação

**Severidade:** Critical  
**Estado:** ABERTO

O modelo candidato não assume FK direta para `auth.users`. A estratégia precisa considerar segurança, privilégios de migration, comportamento de RLS e manutenção do desacoplamento entre Auth e domínio acadêmico.

**Decisão provisória:** manter `auth_user_id uuid NOT NULL` no contrato lógico, mas deixar o mecanismo físico de validação para uma migration específica após homologação.

---

### RLS-AUD-10 — permissão de homologação ainda não comprovada no catálogo

**Severidade:** Critical  
**Estado:** ABERTO

As permissões operacionais previstas para Escala incluem `escala.*`, porém ainda não foi comprovada uma permissão administrativa específica para homologar vínculos de identidade docente.

**Ação:** definir e homologar uma permissão central, por exemplo `escala.manage_teacher_identity_links`, sem criar RBAC paralelo.

---

### RLS-AUD-11 — produto Escala ainda não pode ser considerado protegido pela RLS atual

**Severidade:** Critical  
**Estado:** ABERTO

Não existe ainda tabela física de `academic_teacher_identity_links` nem policy correspondente. Logo, não há evidência de que a ponte futura estará protegida por:

```text
auth.uid()
+ membership ativo
+ organização
+ escola/escopo
+ permissão Escala
+ responsabilidade administrativa
```

**Ação:** desenhar policy específica antes da migration.

---

### RLS-AUD-12 — não criar FK ou policy baseada em nome/e-mail

**Severidade:** Critical  
**Estado:** FECHADO COMO REGRA

Nome e e-mail podem aparecer como apoio à revisão, mas não podem estabelecer vínculo `active`.

---

## 4. Modelo de autorização aprovado para a ponte

A autorização deverá ser conceitualmente:

```text
request
  ↓
auth.uid()
  ↓
active organization membership
  ↓
organizational/school scope
  ↓
Escala product access
  ↓
specific administrative permission
  ↓
responsibility scope when required
  ↓
operation allowed
```

### Operações

| Operação | Perfil comum | Gestor autorizado | Escopo |
|---|---:|---:|---|
| consultar próprio vínculo | sim, quando aplicável | sim | próprio |
| consultar vínculos operacionais | não por padrão | sim | escola/escopo |
| criar `pending` | não | sim, se permitido | escola/escopo |
| homologar `active` | não | sim | administrativo |
| revogar | não | sim | administrativo |
| alterar vigência | não | sim | administrativo |

A tabela é contratual; a implementação só será liberada após prova das permissões reais.

## 5. Estratégia Auth

A arquitetura permanece:

```text
auth.users
   ↓
user_profiles
   ↓
organization_members
   ↓
academic_teacher_identity_links
   ↓
teacher_profiles
```

A ponte deve validar que `auth_user_id` representa uma identidade existente e que essa identidade possui membership institucional compatível.

Não é permitido criar uma cópia pública de `auth.users` apenas para facilitar FK.

## 6. Multi-escola

A auditoria não encontrou evidência suficiente para declarar uma política institucional universal de multi-escola.

Portanto:

- não aplicar unicidade global em `auth_user_id`;
- permitir apenas vínculos contextualizados por escola/período;
- exigir autorização explícita para o segundo vínculo quando a política administrativa assim determinar;
- registrar a justificativa/proveniência.

**Gate:** política definitiva ainda aberta.

## 7. Auditoria contra requisitos

| Requisito | Evidência atual | Estado |
|---|---|---|
| Auth identificado | `user_profiles.user_id` | 🟢 |
| membership institucional | `organization_members` | 🟢 |
| responsabilidade | `identity_responsibility_scopes` | 🟢 |
| produto | `identity_product_permissions` | 🟢 |
| docente canônico | `teacher_profiles` vazio | 🔴 |
| ponte Auth ↔ docente | inexistente | 🔴 |
| permissão de homologação | não comprovada | 🔴 |
| RLS da ponte | inexistente | 🔴 |
| multi-escola | não homologada | 🟡 |
| auditoria central | `identity_audit_logs` existente | 🟢 |

## 8. Gate da fase

**Resultado: 🔴 BLOQUEADO.**

Há base suficiente para concluir o desenho arquitetural, mas não para liberar migration.

### Critical abertos

1. `teacher_profiles` sem registros reais;
2. ausência de vínculo Auth ↔ docente;
3. mecanismo físico Auth ainda não homologado;
4. permissão administrativa de homologação não comprovada;
5. RLS da nova ponte inexistente;
6. política multi-escola não homologada.

### Próximo avanço seguro

Antes de criar qualquer DDL da ponte, realizar uma auditoria do **catálogo de permissões Escala e da carga/integração de `teacher_profiles`**, definindo exatamente como um gestor autorizado poderá homologar a identidade docente sem ampliar indevidamente a superfície de acesso.

**Conclusão:** `Definir → Implementar → Auditar → Corrigir → Validar → Registrar → Avançar` permanece ativo. Não avançar para DDL de produção enquanto houver Critical aberto.
