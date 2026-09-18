# Baseline Reprodutível do Core — Agenda EDI

## Objetivo

Registrar a reconciliação entre o Core versionado em `database/*.sql`, as migrations ativas em `supabase/migrations/` e o schema efetivamente existente no Supabase.

Este documento é um contrato de engenharia: nenhuma migration nova deve criar tabelas paralelas apenas para satisfazer o CI.

## Evidência do schema operacional

O banco Supabase contém atualmente, entre outras, as estruturas:

- `organizations`
- `organization_members`
- `agenda_events`
- `agenda_planning`
- `agenda_tasks`
- `agenda_lessons`
- `agenda_evidences`
- `agenda_classes`
- `academic_periods`
- `school_years`
- `institutional_calendar_events`
- `school_operating_hours`
- `identity_audit_logs`

A versão física de `agenda_events` usa `start_at`/`end_at`, além de `organization_id`, `class_id`, `lesson_id`, `objective_id` e campos de exclusão lógica. Essa é a estrutura consumida pela Inteligência Operacional EDI.

## Dependências

```
Core base
  00_setup
    ↓
  organizations / schools / users
    ↓
  academic structure
    ↓
  Agenda base
    ↓
  identity & governance
    ↓
  agenda operational cycle
    ↓
  calendar + operating hours
    ↓
  Agenda Operational Intelligence EDI
```

## Problema atual

O runner local do Supabase aplica somente `supabase/migrations/*`.

Parte importante do Core histórico permanece em `database/*.sql` e em `database/supabase/migrations/001..016`. Esses dois conjuntos não podem ser simplesmente concatenados: existem gerações diferentes de `agenda_events`.

A geração histórica antiga usa `start_at`/`end_at`, enquanto `database/05_agenda.sql` usa `start_datetime`/`end_datetime`. A evolução posterior do Core modifica novamente a estrutura.

Por isso, copiar migrations históricas para o diretório ativo seria uma reconciliação incorreta.

## Decisão

O baseline deverá ser obtido a partir do schema físico atual e transformado em uma migration inicial/reprodutível.

Depois do baseline:

1. migrations incrementais seguem em `supabase/migrations/`;
2. a Agenda Operacional EDI permanece incremental;
3. CI deve conseguir reconstruir o banco sem depender de `database/*.sql` fora do fluxo de migrations;
4. produção não deve receber alteração direta para corrigir CI;
5. nenhuma tabela ou coluna de compatibilidade será inventada.

## Critério de aceite do baseline

O baseline será considerado válido quando:

- `supabase db reset`/runner equivalente criar o Core sem erro;
- `agenda_events` possuir o contrato moderno usado pela Agenda EDI;
- governança, RLS e funções exigidas pelas migrations seguintes existirem;
- as migrations atuais 017, 018 e 2026+ puderem executar em ordem;
- os testes da Inteligência Operacional puderem ser executados sobre banco reconstruído do zero.

## Estado em 18/09/2026

A PR #24 está 11 commits à frente de `main` e 0 atrás.

A Inteligência Operacional EDI está implementada, mas sua validação de banco permanece bloqueada pela ausência de um baseline reproduzível completo.

**Não aplicar a migration operacional em produção até o baseline passar pelos critérios acima.**
