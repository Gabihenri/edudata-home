# 155 — Auditoria do Catálogo Físico de Permissões Core × Escala v2

**Data:** 07/10/2026  
**Status:** 🟢 MODELO GENÉRICO REUTILIZÁVEL / 🔴 ESCALA AINDA NÃO HOMOLOGADA

## Achado

`identity_product_permissions` utiliza um modelo físico de autorização por:

- `role_code`;
- `product_code`;
- acesso;
- criação;
- visualização própria/equipe/escola/organização;
- atualização própria/outros;
- exclusão própria/outros;
- exportação;
- auditoria.

O catálogo atual contém permissões para Academy, Agenda EDI, Analytics, Backoffice, Experience Manager, Professor Digital e SGPA.

Não existe registro para:

`product_code = 'escala'`

## Reconciliação com a Escala

A Escala possui operações mais específicas que não devem ser reduzidas a flags genéricas:

- `escala.view_vacancies`
- `escala.view_candidates`
- `escala.view_explanations`
- `escala.run_engine`
- `escala.rerun_engine`
- `escala.confirm_substitution`
- `escala.override_decision`
- `escala.view_audit`
- `escala.manage_teacher_identity_links`

Portanto, copiar permissões da Agenda EDI ou traduzir automaticamente os flags atuais para Escala seria insuficiente e poderia ampliar privilégio.

## Decisão

O modelo físico do Core pode ser reutilizado como infraestrutura de produto, mas o catálogo de permissões da Escala deve ser homologado especificamente.

A criação de `escala.*` continua bloqueada até:

1. homologação dos dados reais de membership/scope;
2. fechamento do modelo de autorização específico da Escala;
3. validação do Resolver contra o Core real;
4. definição dos controles de auditoria para operações críticas.

**Não inserir permissões em produção neste momento.**

Nenhuma alteração de produção foi realizada.
