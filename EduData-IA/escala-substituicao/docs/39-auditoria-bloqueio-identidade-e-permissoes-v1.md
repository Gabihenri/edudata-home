# 39 — Auditoria de Bloqueio: Identidade Docente e Permissões v1

**Data:** 2026-09-09  
**Status:** 🔴 BLOQUEADO PARA DDL DE PRODUÇÃO  
**Produto:** Escala Inteligente de Substituição

## 1. Objetivo

Consolidar a auditoria do Core físico realizada antes da criação de `academic_teacher_identity_links` e da integração da grade oficial.

## 2. Evidência física atual

Projeto Supabase auditado: `EduData IA` (`ihchzfndmdwtoabttkil`).

### 2.1 `teacher_profiles`

A tabela existe e possui estrutura suficiente para funcionar como identidade acadêmica candidata, incluindo:

- `id` UUID;
- `name`;
- `email`;
- `school_id`;
- `organization_id`;
- `knowledge_area`;
- `teaching_stage`;
- `subjects`;
- `professional_registration`;
- `onboarding_completed`.

A auditoria atual não autoriza inferir vínculo Auth → docente a partir desses campos.

### 2.2 `organization_members`

Existe e contém:

- `organization_id`;
- `user_id`;
- `school_id`;
- `role`;
- `status`;
- `hierarchy_level`;
- `scope_type`;
- permissões de visualização/gestão;
- janela temporal de acesso.

Isso confirma que a autorização institucional deve continuar centralizada nessa entidade.

### 2.3 Permissões do produto

A consulta ao catálogo `identity_product_permissions` não encontrou registros para produtos contendo `escala` ou `substitut`.

Portanto, **não há evidência física atual de permissões de produto Escala já cadastradas**.

Não é permitido inventar essas permissões em uma migration da ponte sem homologação do catálogo central.

### 2.4 Membership atual

A consulta atual encontrou **zero registros em `organization_members`**.

Consequentemente, não há neste momento base de autorização institucional utilizável para homologar operacionalmente um vínculo docente no ambiente auditado.

### 2.5 `teacher_profiles`

A contagem operacional anteriormente realizada indicou ausência de perfis docentes. O fato essencial para o gate permanece: não existe atualmente massa de identidade docente homologável para testar o fluxo real de Auth → docente.

## 3. Funções centrais existentes

Foi confirmada a existência de funções centrais relacionadas a identidade e autorização, incluindo:

- `can_access_identity_product(text)`;
- `can_view_identity_user(uuid, uuid, uuid)`;
- `current_identity_role()`.

`can_access_identity_product()` resolve acesso consultando `organization_members` e `identity_product_permissions`, incluindo estado ativo e janela temporal.

Isso reforça a decisão arquitetural de **reutilizar o Core de identidade**, e não criar um RBAC específico para Escala.

## 4. Achados

| ID | Achado | Severidade | Estado |
|---|---|---|---|
| PERM-AUD-01 | catálogo sem permissões Escala comprovadas | Critical | **Aberto** |
| PERM-AUD-02 | nenhum membership institucional atual | Critical | **Aberto** |
| TEACH-AUD-01 | fluxo real Auth → docente não homologável com a massa atual | Critical | **Aberto** |
| TEACH-AUD-02 | `teacher_profiles` não pode ser preenchido por inferência Auth | Critical | **Fechado como regra** |
| RLS-AUD-01 | futura ponte ainda sem RLS homologado | Critical | **Aberto** |
| AUTH-AUD-01 | referência segura a `auth.users` ainda não homologada | High | **Aberto** |
| MULTI-AUD-01 | política multi-escola ainda não homologada | High | **Aberto** |
| AUDIT-AUD-01 | `identity_audit_logs` disponível como ledger central | High | **Fechado estruturalmente** |

## 5. Decisão arquitetural

A ponte `academic_teacher_identity_links` continua válida como solução de domínio, mas **não deve ser materializada em produção neste momento**.

A sequência correta passa a ser:

```text
Catálogo de permissões Escala
        ↓
Membership institucional real
        ↓
Perfil docente real
        ↓
Homologação Auth ↔ docente
        ↓
RLS da ponte
        ↓
Grade oficial
        ↓
Motor de substituição
```

## 6. Não decisões

Esta auditoria NÃO autoriza:

- inserir usuários artificialmente;
- criar perfis docentes fictícios em produção;
- cadastrar permissões Escala arbitrárias;
- criar FK direta para `auth.users` sem validação;
- executar a migration da ponte;
- publicar grade sem identidade docente homologada.

## 7. Gate

**GATE: 🔴 BLOQUEADO.**

Há achados Critical abertos. Pelo protocolo permanente da Escala, qualquer Critical aberto impede avanço para DDL de produção.

O desenvolvimento documental e de testes pode continuar em isolamento.

## 8. Próxima etapa

Construir o **contrato de provisionamento/homologação da identidade docente**, definindo como uma instituição passa de:

`Auth + membership → teacher_profile → vínculo acadêmico homologado`,

sem criar dados fictícios e sem alterar a produção até que a política seja aprovada e auditada.
