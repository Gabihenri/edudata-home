# Plano de Migration v1 — Escala Inteligente de Substituição

## 1. Objetivo

Preparar a primeira migration física da Escala sem duplicar o Core/EIOS e sem alterar estruturas compartilhadas antes da validação de compatibilidade.

## 2. Estratégia

A migration será incremental e dividida em duas categorias:

### A. Novas estruturas do domínio

Criar somente:

- `substitution_absences`
- `substitution_vacancies`
- `substitution_candidates`
- `substitution_rule_sets`
- `substitution_engine_runs`

### B. Evolução controlada do Core

Avaliar posteriormente a inclusão de referências em `substitutions`, especialmente `vacancy_id`, `engine_run_id` e `rule_set_id`.

Não duplicar `users`, `teacher_profiles`, `schools`, `classes`, `schedules`, `availability` ou `audit_logs`.

## 3. Ordem de dependências

```text
organizations / schools
        ↓
users / teacher_profiles
        ↓
schedules / classes / subjects
        ↓
substitution_absences
        ↓
substitution_vacancies
        ↓
substitution_rule_sets
        ↓
substitution_engine_runs
        ↓
substitution_candidates
        ↓
substitutions
```

## 4. Constraints obrigatórias

### Ausências

- `start_time < end_time`;
- `status` restrito aos valores previstos;
- `teacher_id`, `school_id` e `organization_id` válidos;
- ausência confirmada precisa de autor e timestamp de confirmação.

### Vagas

- referência obrigatória à ausência;
- referência ao horário oficial;
- data e intervalo temporal válidos;
- vaga não pode ser criada fora do intervalo da ausência confirmada.

### Candidatos

- uma combinação vaga/docente/execução não pode ser duplicada;
- score dentro do intervalo definido pelo motor;
- ranking determinístico dentro de uma execução;
- candidato inelegível não pode ser confirmado diretamente.

### Rule sets

- versão obrigatória;
- somente uma versão ativa por escopo efetivo;
- versão utilizada por execução não pode ser modificada retroativamente.

### Engine runs

- versão do motor obrigatória;
- rule set obrigatório;
- status controlado;
- `input_hash` obrigatório para execução concluída;
- execução concluída deve possuir `completed_at`.

## 5. Índices mínimos

Criar índices por:

- `organization_id`;
- `school_id`;
- docente;
- data operacional;
- status;
- relações entre ausência, vaga, candidato e execução.

Índices adicionais somente após observar consultas reais ou necessidade do motor.

## 6. RLS

Cada tabela nova deve ter RLS habilitado.

A política deve utilizar as funções/estrutura de autorização já existentes no Core/EIOS, em vez de criar um segundo sistema de papéis.

Regras mínimas:

- isolamento por organização;
- isolamento por escola quando aplicável;
- professor não vê candidatos de outros docentes sem autorização;
- gestão vê somente o escopo autorizado;
- histórico de auditoria não pode ser alterado por usuário comum;
- operações de confirmação exigem autorização administrativa.

## 7. Auditoria

A migration não deve criar `substitution_audit_log` se o `audit_logs` central puder representar os mesmos eventos.

Registrar, no mínimo:

- criação/alteração/cancelamento de ausência;
- geração de vagas;
- execução do motor;
- recomendação;
- confirmação;
- rejeição;
- alteração manual;
- bloqueio por regra;
- reprocessamento.

## 8. Transação e dupla alocação

A confirmação de uma substituição deve ocorrer em transação.

Antes da confirmação:

1. verificar se o docente continua elegível;
2. verificar conflitos de horário;
3. verificar novas indisponibilidades/agenda;
4. verificar se outra substituição já ocupou o docente no mesmo intervalo;
5. confirmar somente após todas as validações.

## 9. Idempotência

A geração de vagas deve ser idempotente para a mesma ausência e versão do horário.

A geração de candidatos deve ser idempotente para a mesma vaga, execução e versão do motor.

Reprocessamentos devem gerar nova execução identificável, sem apagar resultados históricos.

## 10. Rollback

A migration deve ser executável de forma controlada e documentar dependências antes de remover ou alterar estruturas do Core.

Nenhuma tabela compartilhada deve ser removida pela primeira migration da Escala.

## 11. Critérios de aprovação antes do Supabase

A migration só pode ser executada após:

- schema real conferido;
- foreign keys conferidas;
- RLS revisado;
- constraints revisadas;
- teste de isolamento institucional;
- teste de docente ocupado;
- teste de indisponibilidade;
- teste de dupla alocação;
- teste sem candidato;
- teste de empate;
- teste de reprocessamento;
- teste de cancelamento da ausência;
- teste de auditoria.

## 12. Resultado esperado

Após a migration v1, a plataforma terá persistência suficiente para executar o fluxo:

```text
Ausência confirmada
       ↓
Aulas afetadas
       ↓
Vagas
       ↓
Candidatos
       ↓
Regras eliminatórias
       ↓
Pontuação
       ↓
Ranking explicável
       ↓
Validação humana
       ↓
Substituição confirmada
       ↓
Auditoria
```

A implementação do motor só deve começar depois que esse contrato de dados estiver validado.