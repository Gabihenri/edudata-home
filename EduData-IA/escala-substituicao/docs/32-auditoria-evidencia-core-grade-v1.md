# 32 — Auditoria de Evidência do Core para a Grade Oficial v1

**Data:** 2026-09-09  
**Status:** 🟡 AUDITORIA FÍSICA CONCLUÍDA — DDL DE PRODUÇÃO BLOQUEADO

## 1. Objetivo

Revalidar diretamente no PostgreSQL do projeto EduData IA as dependências físicas necessárias para avançar de identidade acadêmica para a futura grade oficial da Escala.

## 2. Evidências físicas obtidas

Projeto Supabase auditado: `EduData IA` (`ihchzfndmdwtoabttkil`).

### 2.1 Fundação institucional

Existem fisicamente no schema `public`:

- `organizations`;
- `schools`;
- `school_years`;
- `academic_periods`.

As chaves principais são UUID. `schools.organization_id` referencia `organizations.id`; `school_years` possui `school_id` e `organization_id`; `academic_periods` possui organização, escola e ano letivo.

### 2.2 Integridade observada

Consultas de auditoria retornaram:

- escolas órfãs em relação à organização: `0`;
- anos letivos órfãos em relação à escola: `0`;
- divergências `school_year.organization_id` × `school.organization_id`: `0`;
- duplicidades de `(school_id, organization_id, year)` em `school_years`: `0`.

Isso é evidência favorável à utilização dessas entidades como fundação, mas não substitui constraints compostas futuras quando necessárias para garantir coerência em novas tabelas.

## 3. Limitações críticas ainda confirmadas

### GRADE-PHY-01 — grade oficial inexistente
**Critical — ABERTO**

A auditoria física não encontrou uma tabela canônica de grade oficial equivalente a `official_schedule_versions`, `official_schedule_entries` ou `official_schedule_occurrences`.

### GRADE-PHY-02 — `agenda_schedule_templates` não é grade oficial
**Critical — FECHADO POR DECISÃO**

A existência de `agenda_schedule_templates` não altera a decisão arquitetural: seus registros são operacionais/contextuais da Agenda e não possuem o contrato de publicação da grade institucional exigido pela Escala.

### GRADE-PHY-03 — `agenda_lessons` não é substituto automático
**Critical — FECHADO POR DECISÃO**

`agenda_lessons` possui dados temporais, docente, escola, organização e `class_id`, mas isso não comprova que represente a obrigação institucional oficial nem que seu `class_id` seja a identidade canônica da turma.

### GRADE-PHY-04 — catálogo físico de componente não homologado
**High — ABERTO**

A auditoria não encontrou uma tabela física canônica simples `subjects`/`knowledge_areas` adequada para ser assumida como catálogo oficial da Escala. Estruturas de Agenda e contratos EIOS não são prova suficiente de uma FK física reutilizável.

## 4. Consequência para o modelo físico

A fundação de `academic_classes` pode referenciar com segurança lógica `organizations`, `schools` e `school_years`, mas a estratégia final de constraints compostas deve ser implementada somente depois de validar o DDL candidato contra essas chaves reais.

A fundação de `academic_components` deve permanecer desacoplada de uma FK EIOS até que a tabela curricular física canônica seja comprovada.

A grade oficial deve ser criada como novo domínio versionado, e não como uma extensão semântica de Agenda.

## 5. Auditoria de segurança e governança

As estruturas `identity_responsibility_scopes` e `identity_product_permissions` existem fisicamente e permanecem a base de autorização. Não será criado RBAC paralelo para a grade.

A autorização final das novas entidades deve ser homologada depois que o vínculo Auth ↔ docente e as permissões `escala.*` forem fechados.

## 6. Gate atualizado

| Dependência | Estado |
|---|---|
| Organizations | 🟢 comprovada |
| Schools | 🟢 comprovada |
| School years | 🟢 comprovada |
| Integridade escola/organização/ano | 🟢 evidência atual sem divergências |
| Academic classes | 🟡 modelo candidato |
| Academic components | 🟡 modelo candidato |
| Fonte oficial da grade | 🔴 não homologada |
| Grade version/entry/occurrence | 🔴 inexistente fisicamente |
| Catálogo oficial de componentes | 🔴 não homologado |
| Auth ↔ docente | 🔴 não homologado |
| RLS Escala | 🔴 não liberada |

## 7. Resultado

A auditoria **removeu uma incerteza**: a fundação institucional necessária para as futuras entidades acadêmicas está fisicamente presente e, nas verificações realizadas, coerente.

Ela **não remove o bloqueio principal**: ainda não existe uma fonte física canônica da grade oficial nem catálogo curricular homologado suficiente para alimentar o motor da Escala.

**DDL de produção permanece BLOQUEADO.**

## 8. Próximo avanço

Definir o contrato físico de staging da grade e de publicação versionada, sem criar ainda tabelas no Supabase de produção. O próximo modelo deverá permitir importar uma fonte externa preservando o registro original, identificar turma/componente, registrar ambiguidades e somente publicar ocorrências após homologação.

Fluxo:

**Fonte → Staging → Matching → Homologação → Versão → Publicação → Ocorrências → Escala**
