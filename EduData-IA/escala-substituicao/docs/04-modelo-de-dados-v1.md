# Modelo de Dados v1 — Escala Inteligente de Substituição

## 1. Objetivo

Definir o modelo lógico de dados da Escala Inteligente de Substituição, separando dados de origem, configurações institucionais, resultados derivados pelo motor e decisões humanas.

O modelo deve permitir rastreabilidade completa desde a ausência de um docente até a substituição confirmada.

## 2. Princípios

- **Instituição como escopo obrigatório:** todo dado operacional deve estar vinculado à instituição correspondente.
- **Reutilização do Core/EIOS:** identidade de usuário, instituição, autenticação e autorização não devem ser duplicadas quando já existirem no ecossistema EduData IA.
- **Fonte ≠ derivação:** horários, disponibilidades e ausências são fatos de origem; candidatos, pontuações e recomendações são resultados do motor.
- **Auditoria:** recomendações e decisões devem preservar autor, data/hora, origem e justificativa.
- **Privacidade e mínimo privilégio:** somente dados necessários à operação da escala devem ser expostos.
- **Não sobrescrever decisão humana:** uma alocação confirmada deve possuir histórico próprio.

## 3. Entidades principais

### 3.1 `teachers`

Representa o perfil operacional do docente usado pelo motor.

Campos mínimos:

- `id` — UUID
- `institution_id` — referência à instituição
- `user_id` — referência opcional ao usuário do Core/EIOS
- `display_name` — nome operacional
- `status` — `active`, `inactive`
- `employment_type` — tipo de vínculo, quando necessário
- `created_at`
- `updated_at`

Não armazenar aqui informações pessoais que não sejam necessárias para a escala.

### 3.2 `teacher_subject_qualifications`

Relaciona docentes às disciplinas/competências que podem ser consideradas pelo motor.

Campos mínimos:

- `id`
- `teacher_id`
- `subject_id` ou referência à disciplina do Core
- `knowledge_area_id` — referência à área de conhecimento
- `qualification_level` — grau de aderência configurado
- `source` — origem do dado
- `created_at`
- `updated_at`

A qualificação deve ser tratada como dado institucional configurável e auditável.

### 3.3 `teacher_availability`

Registra disponibilidade operacional do docente.

Campos mínimos:

- `id`
- `institution_id`
- `teacher_id`
- `weekday`
- `start_time`
- `end_time`
- `availability_type` — `available`, `unavailable`, `conditional`
- `reason` — opcional
- `valid_from`
- `valid_until`
- `source`
- `created_at`
- `updated_at`

Eventos de agenda, formação, ATPCA, reunião ou apoio presencial que bloqueiem uma faixa devem prevalecer sobre uma disponibilidade genérica.

### 3.4 `school_schedule`

Representa o horário oficial das aulas.

Campos mínimos:

- `id`
- `institution_id`
- `academic_year`
- `weekday`
- `period_order`
- `start_time`
- `end_time`
- `class_id`
- `subject_id`
- `teacher_id`
- `room` — opcional
- `status`
- `source`
- `created_at`
- `updated_at`

O registro deve permitir identificar exatamente qual aula fica descoberta em caso de ausência.

### 3.5 `absences`

Registra a ausência de um docente.

Campos mínimos:

- `id`
- `institution_id`
- `teacher_id`
- `absence_date`
- `start_time`
- `end_time`
- `reason_category`
- `status` — `draft`, `confirmed`, `cancelled`
- `source`
- `created_by`
- `confirmed_by`
- `confirmed_at`
- `created_at`
- `updated_at`

Uma ausência só deve gerar escala automática quando estiver em estado operacional válido, preferencialmente `confirmed`.

### 3.6 `vacant_lessons`

É uma entidade derivada que materializa as aulas afetadas por uma ausência.

Campos mínimos:

- `id`
- `institution_id`
- `absence_id`
- `schedule_id`
- `vacancy_date`
- `start_time`
- `end_time`
- `status` — `open`, `recommended`, `allocated`, `unallocated`, `blocked`
- `created_at`
- `updated_at`

Uma ausência pode produzir uma ou várias vagas.

### 3.7 `substitution_candidates`

Registra cada relação entre uma vaga e um docente considerado pelo motor.

Campos mínimos:

- `id`
- `institution_id`
- `vacant_lesson_id`
- `teacher_id`
- `eligibility_status` — `eligible`, `ineligible`
- `score`
- `score_breakdown` — JSON estruturado com critérios e pesos
- `rule_results` — JSON estruturado com regras aplicadas
- `ineligibility_reason` — opcional
- `engine_version`
- `generated_at`

Essa entidade é essencial para explicar por que um docente foi recomendado ou descartado.

### 3.8 `substitutions`

Representa a proposta e/ou decisão de alocação.

Campos mínimos:

- `id`
- `institution_id`
- `vacant_lesson_id`
- `teacher_id`
- `candidate_id` — referência à recomendação utilizada, quando houver
- `status` — `recommended`, `pending_validation`, `confirmed`, `unallocated`, `blocked`
- `decision_source` — `engine`, `manual`
- `decided_by`
- `decided_at`
- `justification`
- `engine_version`
- `created_at`
- `updated_at`

A recomendação do motor e a confirmação da gestão são estados diferentes do mesmo processo, mas devem manter sua proveniência.

## 4. Regras institucionais

### `substitution_rules`

Tabela para parâmetros configuráveis sem alterar o código do motor.

Campos sugeridos:

- `id`
- `institution_id`
- `rule_code`
- `rule_name`
- `rule_type` — `mandatory`, `preferential`, `institutional`
- `enabled`
- `priority`
- `parameters` — JSON
- `valid_from`
- `valid_until`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

Exemplos de `rule_code`: `R01_SCHEDULE_CONFLICT`, `R02_AVAILABILITY`, `R03_QUALIFICATION`, `R04_SUBSTITUTION_LIMIT`.

## 5. Auditoria

### `substitution_audit_log`

Registra mudanças relevantes do processo.

Campos mínimos:

- `id`
- `institution_id`
- `entity_type`
- `entity_id`
- `action`
- `actor_user_id`
- `previous_state` — JSON, quando aplicável
- `new_state` — JSON, quando aplicável
- `reason`
- `created_at`

Eventos importantes incluem geração de recomendação, confirmação, rejeição, alteração manual, bloqueio e cancelamento.

## 6. Relações

```text
Instituição
   │
   ├── Docentes
   │     ├── Qualificações
   │     └── Disponibilidades
   │
   ├── Horário oficial
   │
   ├── Ausências
   │      │
   │      └── Aulas vagas
   │              │
   │              └── Candidatos
   │                       │
   │                       └── Substituição
   │
   ├── Regras institucionais
   │
   └── Auditoria
```

## 7. Linha de proveniência

A cadeia de dados deve ser preservada:

1. identidade institucional — Core/EIOS;
2. horário oficial — fonte institucional;
3. disponibilidade e impedimentos — agenda/registro operacional;
4. ausência confirmada — operação escolar;
5. regras — configuração institucional;
6. vaga — derivação da ausência + horário;
7. candidatos — execução do motor;
8. ranking — cálculo do motor;
9. substituição — decisão humana ou proposta do motor;
10. auditoria — histórico da operação.

## 8. Dados derivados x dados de origem

| Categoria | Exemplos | Pode ser recalculada? |
|---|---|---|
| Origem | docente, horário, ausência | Não sem alterar a fonte |
| Configuração | regras, pesos, limites | Sim, por configuração autorizada |
| Derivação | vaga, candidato, score | Sim |
| Decisão | substituição confirmada | Não silenciosamente |
| Auditoria | eventos e estados anteriores | Não |

## 9. Consistência e idempotência

O processamento deve ser idempotente para uma mesma combinação de:

- instituição;
- data;
- horário;
- ausência;
- versão do horário;
- versão das regras.

Reprocessamentos não devem criar duplicações de vagas ou recomendações sem necessidade. O motor deve identificar uma execução anterior e registrar nova versão quando houver alteração relevante de dados ou regras.

## 10. Versionamento do motor

Toda recomendação deve registrar `engine_version`.

Exemplo:

```text
engine_version = substitution-v1.0
```

Isso permite reconstruir posteriormente por que determinada recomendação foi produzida.

## 11. Segurança e RLS

Todas as tabelas operacionais devem possuir escopo por `institution_id` e políticas compatíveis com o modelo de autorização do Core/EIOS.

Princípios mínimos:

- docente acessa apenas o que sua função permitir;
- gestão autorizada acessa dados necessários à escala;
- dados de outras instituições nunca devem aparecer em consultas operacionais;
- candidatos não devem revelar informações desnecessárias sobre outros docentes;
- auditoria deve ser protegida contra alteração por usuários comuns;
- o motor deve executar respeitando as mesmas fronteiras de autorização do produto.

## 12. MVP recomendado

A primeira implementação persistente pode começar com:

1. `teachers`
2. `teacher_subject_qualifications`
3. `teacher_availability`
4. `school_schedule`
5. `absences`
6. `vacant_lessons`
7. `substitution_candidates`
8. `substitutions`
9. `substitution_rules`
10. `substitution_audit_log`

A implementação física deve reutilizar as tabelas de identidade/instituição existentes no EduData IA quando houver equivalência funcional, evitando duplicação do Core.