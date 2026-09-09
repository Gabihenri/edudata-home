# Modelo de Dados v1 — Escala Inteligente de Substituição

## 1. Objetivo

Definir o modelo lógico da Escala Inteligente de Substituição sem duplicar entidades já pertencentes ao Core/EIOS do EduData IA.

O módulo deve consumir os dados institucionais existentes e acrescentar somente os dados específicos do processo de substituição.

## 2. Princípio arquitetural

A Escala não cria uma segunda identidade institucional.

```text
Core / EIOS
├── organizations
├── schools
├── users
├── organization_members
├── teacher_profiles
├── knowledge_areas
├── subjects
├── classes
├── schedules
├── availability
├── agenda_events
└── audit_logs
        │
        ▼
Escala Inteligente
├── substitution_absences
├── substitution_vacancies
├── substitution_candidates
├── substitution_rule_sets
├── substitution_engine_runs
└── substitutions  ← registro operacional do Core
```

A tabela `substitutions` existente no Core permanece como registro operacional de alocação. Não será criada uma segunda tabela concorrente de alocações.

## 3. Fontes de verdade

| Prioridade | Fonte | Natureza |
|---|---|---|
| 1 | Identidade institucional | Core/EIOS |
| 2 | Escola e organização | Core/EIOS |
| 3 | Horário oficial | Core/EIOS |
| 4 | Perfil e qualificação docente | Core/EIOS |
| 5 | Disponibilidade | Core/operacional |
| 6 | Agenda e impedimentos | Agenda EDI/Core |
| 7 | Ausência confirmada | Escala |
| 8 | Regras configuradas | Escala, versionadas |
| 9 | Candidatos/ranking | Resultado derivado |
| 10 | Substituição confirmada | Decisão humana |

Dados derivados nunca devem substituir silenciosamente os dados de origem.

## 4. Entidades específicas do módulo

### 4.1 `substitution_absences`

Representa a ausência de um docente em determinado período.

Campos mínimos:

- `id` — UUID;
- `organization_id`;
- `school_id`;
- `teacher_id`;
- `absence_date`;
- `start_time`;
- `end_time`;
- `reason_code`;
- `reason_notes`;
- `status` — `draft`, `confirmed`, `cancelled`;
- `source`;
- `created_by`;
- `confirmed_by`;
- `confirmed_at`;
- `created_at` / `updated_at`.

A ausência é um **fato de entrada**, não uma recomendação.

### 4.2 `substitution_vacancies`

Representa cada aula efetivamente afetada por uma ausência.

Campos mínimos:

- `id`;
- `absence_id`;
- `schedule_id`;
- `class_id`;
- `subject_id`;
- `absent_teacher_id`;
- `vacancy_date`;
- `start_time` / `end_time`;
- `status` — `open`, `processing`, `recommended`, `allocated`, `unallocated`, `cancelled`;
- `engine_run_id`;
- `created_at` / `updated_at`.

Uma ausência pode produzir várias vagas.

### 4.3 `substitution_candidates`

Representa a avaliação de um docente para uma vaga específica.

Campos mínimos:

- `id`;
- `vacancy_id`;
- `candidate_teacher_id`;
- `eligibility_status` — `eligible`, `ineligible`, `blocked`;
- `score`;
- `rank`;
- `hard_rule_failures` — JSONB;
- `score_breakdown` — JSONB;
- `explanation`;
- `engine_run_id`;
- `created_at`.

Essa entidade permite reconstruir por que um docente foi considerado, priorizado ou descartado.

### 4.4 `substitution_rule_sets`

Representa uma versão das regras utilizadas pelo motor.

Campos mínimos:

- `id`;
- `organization_id`;
- `school_id` opcional;
- `version`;
- `name`;
- `rules` — JSONB;
- `status` — `draft`, `active`, `archived`;
- `created_by`;
- `activated_by`;
- `activated_at`;
- `created_at` / `updated_at`.

Após ativação, a versão utilizada por uma execução deve ser imutável.

### 4.5 `substitution_engine_runs`

Representa uma execução do motor.

Campos mínimos:

- `id`;
- `organization_id`;
- `school_id`;
- `run_date`;
- `input_reference`;
- `rule_set_id`;
- `engine_version`;
- `status` — `running`, `completed`, `failed`, `cancelled`;
- `input_hash`;
- `result_summary` — JSONB;
- `started_at`;
- `completed_at`;
- `created_by`.

O `input_hash`, `engine_version` e `rule_set_id` permitem diferenciar reprocessamentos e verificar determinismo.

## 5. `substitutions` — registro final

O Core já possui `substitutions` com escola, organização, docente ausente, substituto, turma, disciplina, horário, data, recomendação, score, status e aprovação.

A evolução deve ser incremental. Quando necessário, acrescentar referências como:

- `vacancy_id`;
- `engine_run_id`;
- `rule_set_id`;
- estado específico da recomendação;
- `decision_source`;
- `decision_reason`;
- timestamps de decisão.

**Não criar uma segunda tabela de alocações.**

## 6. Relacionamentos

```text
substitution_absences
        │
        ├── 1:N ── substitution_vacancies
        │                  │
        │                  └── 1:N ── substitution_candidates
        │
        └── teacher_id ──> users / teacher_profiles

substitution_vacancies
        ├── schedule_id ──> schedules
        ├── class_id ─────> classes
        └── subject_id ──> subjects

substitution_candidates
        └── candidate_teacher_id ──> users / teacher_profiles

substitution_engine_runs
        └── rule_set_id ──> substitution_rule_sets

substitution_vacancies
        └── substitution_id ──> substitutions
```

## 7. Proveniência

Todo dado produzido pelo motor deve permitir identificar:

```text
origem → transformação → versão → resultado → decisão
```

Exemplo:

```text
Horário oficial
      +
Ausência confirmada
      +
Disponibilidade
      +
Agenda/impedimentos
      +
Perfil docente
      +
Rule Set v1.0
      ↓
Engine v1.0
      ↓
Candidate ranking
      ↓
Recomendação
      ↓
Confirmação do gestor
```

## 8. Integridade temporal

O modelo deve impedir ou sinalizar:

- ausência sem período válido;
- vaga fora do período da ausência;
- horário com início posterior ao fim;
- candidato alocado em duas vagas simultâneas;
- substituição confirmada sem vaga correspondente;
- confirmação fora do período operacional da vaga;
- alteração de dados de origem que torne uma decisão histórica inconsistente.

## 9. Histórico e imutabilidade lógica

Recomendações e decisões não devem ser apagadas fisicamente para corrigir um processo.

Quando houver correção:

1. registrar a nova situação;
2. preservar a anterior;
3. registrar ator e timestamp;
4. registrar motivo;
5. associar nova execução do motor quando houver reprocessamento.

O histórico deve utilizar a auditoria central do Core, evitando criar um segundo mecanismo de auditoria sem necessidade.

## 10. Segurança

Todas as entidades operacionais específicas devem carregar `organization_id` e, quando aplicável, `school_id`, para permitir isolamento institucional.

O acesso deve respeitar o modelo de governança existente:

- professor: próprios registros autorizados;
- coordenador: equipe/escopo autorizado;
- direção: escola autorizada;
- gestores superiores: escopo atribuído;
- administrador técnico: sem acesso automático ao conteúdo pedagógico privado.

O motor deve processar somente os atributos docentes necessários para a decisão.

## 11. Estados principais

### Ausência
`draft → confirmed → cancelled`

### Vaga
`open → processing → recommended → allocated`

ou `open → processing → unallocated`

### Candidato
`eligible | ineligible | blocked`

### Execução
`running → completed` ou `running → failed`

### Substituição
`pending → recommended → confirmed`

ou `pending → rejected` / `pending → unallocated`.

Os estados do motor e da decisão administrativa permanecem distintos.

## 12. Regra contra dupla alocação

Um docente não pode ser confirmado para duas vagas que se sobreponham temporalmente na mesma unidade operacional.

A proteção deve existir em duas camadas:

1. validação do motor;
2. proteção transacional no banco, quando tecnicamente suportada pelo schema final.

## 13. Reutilização do Core

Não duplicar:

- organizações;
- escolas;
- usuários;
- perfis docentes;
- áreas de conhecimento;
- disciplinas;
- turmas;
- horários;
- disponibilidade;
- agenda;
- auditoria.

Antes de qualquer migration física, cada relação deve ser conferida contra o schema real do Core.

## 14. Próxima etapa física

Antes de executar qualquer SQL no Supabase:

1. validar nomes e tipos reais das tabelas/colunas do Core;
2. validar chaves estrangeiras existentes;
3. desenhar migration incremental;
4. desenhar RLS das novas entidades;
5. definir constraints e índices;
6. criar testes de integridade e dupla alocação;
7. testar idempotência e reprocessamento;
8. executar auditoria de segurança;
9. somente então aplicar a migration.

## 15. Decisão arquitetural

A Escala Inteligente de Substituição é um **módulo especializado do ecossistema EduData IA**, não um sistema isolado.

Seu domínio é transformar fatos institucionais e operacionais em recomendações de substituição explicáveis, auditáveis e submetidas à decisão humana.

O Core permanece como fonte de identidade, instituição, autorização e dados compartilhados. A Escala mantém apenas o estado e os artefatos próprios do processo de substituição.