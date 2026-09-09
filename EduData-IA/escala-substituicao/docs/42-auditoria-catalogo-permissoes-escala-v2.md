# 42 — Auditoria e Contrato de Permissões da Escala v2

**Data:** 2026-09-09  
**Status:** auditoria concluída; proposta de contrato, sem alteração de produção.

## 1. Evidência física atual

O catálogo central `identity_roles` possui os papéis institucionais `teacher`, `coordinator`, `vice_principal`, `principal`, `supervisor`, `regional_manager`, `institution_admin`, além dos papéis de plataforma.

O catálogo `identity_product_permissions` possui colunas suficientes para controle de acesso por produto e escopo, mas **não possui nenhuma linha com `product_code = 'escala'`**.

`teacher_profiles` existe fisicamente, porém a consulta atual retornou **0 registros**. Portanto, a homologação Auth ↔ docente e os cenários reais de escala ainda não podem ser empiricamente validados.

## 2. Decisão arquitetural

Não será criado RBAC próprio da Escala. O produto utilizará o mecanismo central de identidade, complementado por permissões de operação no domínio.

O acesso deve ser composto por:

`identidade ativa + contexto institucional + produto Escala + permissão operacional + escopo de responsabilidade`.

## 3. Matriz proposta

| Permissão | teacher | coordinator | vice_principal | principal | supervisor | regional_manager | institution_admin |
|---|---:|---:|---:|---:|---:|---:|---:|
| `escala.view_vacancies` | própria | sim | sim | sim | sim | sim | sim |
| `escala.view_candidates` | própria/atribuída | sim | sim | sim | sim | sim | sim |
| `escala.view_explanations` | própria/atribuída | sim | sim | sim | sim | sim | sim |
| `escala.run_engine` | não | sim | sim | sim | sim | sim | sim |
| `escala.rerun_engine` | não | sim | sim | sim | sim | sim | sim |
| `escala.confirm_substitution` | não | sim* | sim | sim | sim | sim | sim |
| `escala.override_decision` | não | não | sim* | sim | sim* | sim | sim |
| `escala.view_audit` | não | sim | sim | sim | sim | sim | sim |
| `escala.manage_teacher_identity_links` | não | não** | não** | sim | sim** | sim | sim |

`*` depende do escopo institucional efetivamente concedido.  
`**` não é concedido automaticamente pelo cargo; requer responsabilidade/escopo explícito e trilha de auditoria.

## 4. Princípio de menor privilégio

Cargo não equivale automaticamente a autorização irrestrita. `identity_responsibility_scopes` deve limitar a atuação ao contexto efetivamente aprovado.

Um coordenador de uma escola não pode homologar docentes de outra escola apenas por possuir o papel `coordinator`.

Um professor não recebe acesso aos candidatos ou ausências de outros docentes apenas por pertencer à mesma organização.

## 5. Operações críticas

As operações `confirm_substitution`, `override_decision` e `manage_teacher_identity_links` exigem:

1. identidade autenticada e ativa;
2. membership institucional válido;
3. acesso ao produto Escala;
4. permissão operacional específica;
5. escopo compatível com organização/escola;
6. registro da decisão em `identity_audit_logs` e/ou mecanismo EIOS apropriado;
7. para override, justificativa obrigatória.

## 6. Achados da auditoria

- **PERM-ESC-01 — CRITICAL:** produto `escala` ausente do catálogo físico.
- **PERM-ESC-02 — CRITICAL:** permissões operacionais da Escala ainda não estão persistidas nem homologadas.
- **PERM-ESC-03 — HIGH:** cargo sozinho não pode determinar autorização de homologação docente.
- **PERM-ESC-04 — HIGH:** `identity_responsibility_scopes` precisa participar da autorização das operações por escola.
- **PERM-ESC-05 — CRITICAL:** `teacher_profiles` sem dados reais impede validação de integração Auth ↔ docente.
- **PERM-ESC-06 — HIGH:** RLS da futura ponte docente ainda não foi liberada/homologada.

## 7. Gate

**RED / BLOCKED para produção.**

Nenhum `INSERT` no catálogo de permissões e nenhuma alteração de RLS foi executada nesta etapa. A matriz é uma decisão técnica documentada para posterior homologação, não uma autorização automática de produção.

## 8. Próximo avanço seguro

Consolidar o **contrato de fonte institucional de docentes** e o protocolo de importação/homologação com uma amostra real ou formalmente homologada. Em paralelo, preparar um harness de autorização que simule os papéis e escopos acima sem tocar no banco produtivo.
