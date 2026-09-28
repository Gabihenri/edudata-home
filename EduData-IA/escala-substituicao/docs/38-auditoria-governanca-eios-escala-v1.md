# 38 — Auditoria de Governança EIOS × Escala Inteligente EDI v1

**Data:** 2026-09-28  
**Status:** 🔴 GATE BLOQUEADO — governança física existente ainda está acoplada semanticamente à Agenda; nenhuma DDL da Escala foi executada.

## 1. Objetivo

Fechar a auditoria de governança antes da materialização física da Escala Inteligente EDI, verificando:

1. existência física do ledger EIOS;
2. existência de provenance, workflow e decision records;
3. políticas RLS atualmente aplicadas;
4. funções efetivamente usadas pelas policies;
5. compatibilidade dessas funções com a autorização específica da Escala;
6. ausência de auditoria paralela;
7. condições mínimas para liberar a próxima etapa.

Esta auditoria é somente de leitura. Nenhuma migration, DDL ou alteração de policy foi executada.

## 2. Evidência física do EIOS Governance

O banco Supabase conectado contém:

- `eios_governance_audit_events`;
- `eios_governance_decision_records`;
- `eios_governance_provenance_records`;
- `eios_governance_workflow_transitions`.

**Conclusão:** o EIOS possui fisicamente o núcleo necessário para registrar auditoria, proveniência, transições e decisões.

A Escala deve integrar-se a essas estruturas quando os contratos de recurso, `run_id`, versão, escopo e autorização forem homologados.

## 3. Policies físicas atualmente encontradas

As quatro estruturas EIOS possuem policies de SELECT e INSERT.

Entretanto, as policies atualmente utilizam:

- `can_view_agenda_record(...)` para SELECT;
- `can_update_agenda_record(...)` para INSERT.

A mesma dependência aparece nas quatro entidades:

- audit events;
- decision records;
- provenance records;
- workflow transitions.

### Achado GOV-01

**Severidade:** CRÍTICA  
**Estado:** ABERTO / BLOQUEADOR

O ledger EIOS existe, mas sua autorização física atual está baseada semanticamente no produto `agenda_edi`.

Isso significa que a existência do ledger **não comprova** que a Escala já esteja autorizada a utilizá-lo.

**Regra:** não reutilizar essas policies como autorização da Escala sem homologação explícita.

## 4. Semântica efetiva das funções Agenda

A função `can_view_agenda_record_as` consulta:

- `organization_members`;
- `identity_product_permissions` com `product_code = 'agenda_edi'`;
- escopo organizacional/escolar;
- `can_view_identity_user`.

A função `can_manage_agenda_record_as` consulta:

- membership ativo;
- permissões do produto `agenda_edi`;
- visualização contextual;
- permissões de update/delete/restore.

Portanto, as funções não são genéricas de autorização EIOS. Elas são funções de autorização da Agenda.

### Achado GOV-02

**Severidade:** CRÍTICA  
**Estado:** ABERTO / BLOQUEADOR

Não é válido tratar `can_view_agenda_record` ou `can_update_agenda_record` como resolver oficial da Escala.

A Escala possui operações próprias, incluindo:

- `escala.view_vacancies`;
- `escala.view_candidates`;
- `escala.view_explanations`;
- `escala.run_engine`;
- `escala.rerun_engine`;
- `escala.confirm_substitution`;
- `escala.override_decision`;
- `escala.view_audit`;
- `escala.manage_teacher_identity_links`.

Essas operações não são equivalentes a update/delete/restore de Agenda.

## 5. Governança versus autorização

O desenho correto permanece:

```
Auth
  ↓
Core Identity
  ↓
Membership
  ↓
Role
  ↓
Product Permission (Escala)
  ↓
Responsibility Scope
  ↓
Resource / School / Organization
  ↓
Operation
  ↓
Audit / EIOS Governance
```

A governança registra e explica o fato decisório.

Ela não deve substituir a autorização.

Consequentemente:

- EIOS Governance ≠ RBAC;
- EIOS Governance ≠ RLS;
- EIOS Governance ≠ permission catalog;
- Escala não deve criar um ledger paralelo;
- Escala não deve considerar a simples existência de um registro EIOS como autorização.

## 6. identity_audit_logs

A tabela `identity_audit_logs` existe fisicamente e permanece com RLS habilitado, porém sem policy física.

### Achado GOV-03

**Severidade:** ALTA  
**Estado:** ABERTO

Não é seguro declarar o ledger de identidade pronto para uso da Escala enquanto sua policy RLS não estiver homologada.

A responsabilidade deve ser separada:

- `identity_audit_logs`: acesso/autorização/identidade;
- EIOS Governance: provenance/workflow/decision;
- nenhum terceiro ledger específico da Escala.

## 7. teacher_profiles

`teacher_profiles` existe fisicamente com RLS habilitado, porém sem policy.

### Achado GOV-04

**Severidade:** CRÍTICA  
**Estado:** ABERTO

Como o motor da Escala utiliza identidade acadêmica docente, não há autorização física suficiente para liberar operações produtivas sobre `teacher_profiles`.

Isso permanece independente do fato de o modelo lógico já estar definido.

## 8. identity_product_permissions

Foi encontrada uma policy SELECT para usuários autenticados com condição:

```
USING (true)
```

### Achado GOV-05

**Severidade:** MÉDIA / REVISÃO DE SEGURANÇA  
**Estado:** ABERTO

A policy permite leitura do catálogo de permissões por usuários autenticados.

Isso não equivale a conceder a permissão operacional, pois o catálogo deve ser interpretado por uma resolução de autorização.

Mesmo assim, o comportamento deve ser documentado e reavaliado antes da homologação final, principalmente se o catálogo contiver informações que não devam ser expostas a qualquer usuário autenticado.

## 9. organization_members e responsibility scopes

A auditoria confirmou policies existentes:

- `organization_members_own_read`: leitura do próprio membership;
- `responsibility_scopes_owner_or_manager`: leitura quando o usuário é manager ou target.

Isso reforça que o Core possui mecanismos físicos de isolamento, mas não comprova que eles sejam suficientes para todas as operações da Escala.

### Achado GOV-06

**Severidade:** ALTA  
**Estado:** ABERTO

A resolução de autorização da Escala precisa combinar:

1. membership;
2. papel canônico;
3. produto;
4. operação;
5. escopo;
6. recurso;
7. validade temporal;
8. justificativa quando exigida;
9. auditoria quando exigida.

Nenhum desses elementos isoladamente é suficiente.

## 10. SECURITY DEFINER

O banco apresenta funções `SECURITY DEFINER` executáveis por usuários autenticados, inclusive as funções de autorização da Agenda.

Isso é um achado de segurança do Core que exige revisão, mas não autoriza uma correção ampla fora do escopo da Escala.

### Decisão

Não alterar essas funções neste estágio.

Para a Escala, qualquer função privilegiada futura deverá:

- ter autenticação explícita;
- restringir `EXECUTE` quando apropriado;
- validar `auth.uid()`;
- possuir `search_path` controlado;
- aplicar autorização contextual;
- ser testada contra acesso direto via RPC;
- ser coberta por auditoria.

## 11. Regras de integração com EIOS

A Escala poderá utilizar:

```
eios_governance_audit_events
eios_governance_provenance_records
eios_governance_workflow_transitions
eios_governance_decision_records
```

desde que o contrato final estabeleça, no mínimo:

- `resource_type`;
- `resource_id`;
- `run_id`;
- `organization_id`;
- `school_id`;
- versão da fonte;
- versão da rodada;
- ator;
- operação;
- estado anterior;
- estado posterior;
- justificativa;
- referência causal;
- timestamp;
- resultado;
- provenance.

A mesma decisão não deve gerar registros concorrentes e semanticamente incompatíveis em múltiplos ledgers.

## 12. Gate de governança

| Gate | Situação |
|---|---|
| EIOS Governance físico | 🟢 Confirmado |
| Provenance físico | 🟢 Confirmado |
| Workflow físico | 🟢 Confirmado |
| Decision record físico | 🟢 Confirmado |
| Integração sem ledger paralelo | 🟢 Arquitetura confirmada |
| Autorização EIOS independente da Agenda | 🔴 Não homologada |
| Permissions `escala.*` físicas | 🔴 Não materializadas |
| RLS `teacher_profiles` | 🔴 Sem policy |
| RLS `identity_audit_logs` | 🔴 Sem policy |
| Resolver de autorização Escala | 🔴 Não materializado |
| RLS das futuras tabelas Escala | 🔴 Não materializado |
| PostgreSQL real dos harnesses | 🔴 Pendente |
| E3 SED | 🔴 Pendente |
| Fonte oficial de grade | 🔴 Pendente |

## 13. Decisão

**GOVERNANCE GATE = RED / BLOCKED.**

O bloqueio não é causado pela ausência do EIOS Governance. O contrário foi confirmado: o EIOS Governance existe fisicamente.

O bloqueio decorre de uma diferença fundamental:

> **Governança existente não significa autorização da Escala.**

As policies físicas atuais do EIOS utilizam o resolver da Agenda e, portanto, não podem ser assumidas como contrato definitivo da Escala.

## 14. Próxima etapa autorizada

A próxima etapa é **especificação formal do Authorization Resolver da Escala**, ainda sem DDL produtiva.

Ela deverá fechar:

1. entrada do resolver;
2. operação;
3. recurso;
4. membership;
5. role;
6. product permission;
7. responsibility scope;
8. validade;
9. justification;
10. denial codes;
11. audit requirement;
12. integração com EIOS Governance;
13. comportamento em RPC direto;
14. comportamento em RLS;
15. testes negativos.

Somente depois disso será possível desenhar as policies físicas da Escala.

## 15. Regra de liberação

Nenhuma migration produtiva da Escala será liberada enquanto existir qualquer bloqueador Critical/High aberto em:

- identidade;
- autorização;
- RLS;
- proveniência;
- grade oficial;
- ocorrência;
- temporalidade;
- atomicidade;
- E3 SED;
- execução PostgreSQL real.

**Conclusão:** a auditoria de governança foi avançada e fechada como gate formal. O projeto pode avançar para o contrato do Authorization Resolver, mas permanece sem autorização para DDL produtiva.
