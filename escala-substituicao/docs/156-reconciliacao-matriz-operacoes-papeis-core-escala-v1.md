# 156 — Reconciliação da Matriz de Operações × Papéis Core da Escala v1

**Data:** 07/10/2026  
**Status:** 🟢 CONTRATO RECONCILIADO / 🔴 IMPLEMENTAÇÃO FÍSICA BLOQUEADA

## Achado

A matriz de autorização da Escala já está definida em documentação e exercitada pelos harnesses de autorização.

As operações críticas são:

- `escala.view_vacancies`
- `escala.view_candidates`
- `escala.view_explanations`
- `escala.run_engine`
- `escala.rerun_engine`
- `escala.confirm_substitution`
- `escala.override_decision`
- `escala.view_audit`
- `escala.manage_teacher_identity_links`

A revalidação do Core confirmou que os papéis necessários existem no catálogo canônico:

- `teacher`
- `coordinator`
- `vice_principal`
- `principal`
- `supervisor`
- `regional_manager`
- `institution_admin`

## Reconciliação

A matriz conceitual não precisa criar novos papéis.

O controle de acesso da Escala deve continuar combinando:

**papel canônico + produto Escala + operação + scope + contexto do recurso + justificativa/auditoria quando exigida.**

Especialmente:

- `confirm_substitution` não equivale a simples acesso ao produto;
- `override_decision` exige nível superior e justificativa;
- `manage_teacher_identity_links` é operação administrativa/homologatória;
- `run_engine` e `rerun_engine` permanecem subordinados ao scope;
- professores não recebem autorização administrativa por herança de cargo;
- papel hierarquicamente superior fora do contexto institucional correto não concede acesso automaticamente.

## Decisão

A matriz comportamental está **🟢 fechada**.

A implementação física permanece bloqueada por:

1. ausência de memberships reais;
2. ausência de scopes reais;
3. ausência de permissões `escala.*` no catálogo físico;
4. ausência de identidade docente homologada;
5. ausência do recurso acadêmico oficial E3.

Não inserir permissões ou alterar RBAC neste momento.

Nenhuma alteração de produção foi realizada.
