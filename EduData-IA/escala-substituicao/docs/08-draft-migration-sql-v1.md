# Draft da Migration SQL — Escala de Substituição v1

**Status:** DRAFT — NÃO EXECUTAR

## 1. Regra de segurança

Este arquivo é um artefato de projeto e revisão. **Não deve ser executado no Supabase neste estado.**

A migration somente poderá ser transformada em SQL executável depois da liberação formal das auditorias do Core/EIOS **e da homologação da fonte oficial de grade/identidade operacional da SED**.

A existência de harnesses PostgreSQL sintéticos não libera esta migration. Eles validam comportamentos contratuais genéricos e permanecem isolados.

## 2. Objetivo

Criar apenas o estado específico necessário para a Escala Inteligente de Substituição, reutilizando as entidades já existentes no Core.

Não criar:

- `teachers`;
- `teacher_availability`;
- `school_schedule` paralelo;
- `substitution_audit_log`;
- uma segunda tabela operacional de substituições.

## 3. Entidades previstas

### 3.1 `substitution_absences`

Representa a ausência confirmada de um docente.

Campos conceituais mínimos:

- `id UUID`;
- `organization_id UUID`;
- `school_id UUID`;
- `teacher_id UUID` → `users(id)`;
- `absence_date DATE`;
- `start_time TIME`;
- `end_time TIME`;
- `reason TEXT`;
- `status`;
- `source`;
- `confirmed_by UUID` → `users(id)`;
- `confirmed_at TIMESTAMP`;
- timestamps.

### 3.2 `substitution_vacancies`

Representa cada aula efetivamente aberta pela ausência.

Campos conceituais mínimos:

- `id UUID`;
- `organization_id UUID`;
- `school_id UUID`;
- `absence_id UUID` → `substitution_absences(id)`;
- `schedule_id UUID` → **DEPENDÊNCIA BLOQUEADA**;
- `class_id UUID` → `classes(id)`;
- `subject_id UUID` → `subjects(id)`;
- `absent_teacher_id UUID` → `users(id)`;
- `vacancy_date DATE`;
- `start_time TIME`;
- `end_time TIME`;
- `status`;
- `engine_run_id UUID` → `substitution_engine_runs(id)`;
- timestamps.

O FK para `schedules(id)` não pode ser implementado até a reconciliação do schema de horários **e da identidade/versionamento da grade oficial**.

### 3.3 `substitution_rule_sets`

Representa uma versão imutável das regras utilizadas pelo motor.

Campos conceituais:

- `id UUID`;
- `organization_id UUID`;
- `school_id UUID` opcional conforme governança;
- `version TEXT`;
- `name TEXT`;
- `rules JSONB`;
- `status`;
- `activated_at TIMESTAMP`;
- `created_by UUID` → `users(id)`;
- `created_at TIMESTAMP`.

Regra: uma versão ativada não deve ser alterada silenciosamente.

### 3.4 `substitution_engine_runs`

Representa uma execução determinística/reprodutível do motor.

Campos conceituais:

- `id UUID`;
- `organization_id UUID`;
- `school_id UUID`;
- `rule_set_id UUID` → `substitution_rule_sets(id)`;
- `engine_version TEXT`;
- `status`;
- `input_hash TEXT`;
- `summary JSONB`;
- `started_at TIMESTAMP`;
- `completed_at TIMESTAMP`;
- `created_by UUID` → `users(id)`;
- `created_at TIMESTAMP`.

### 3.5 `substitution_candidates`

Representa a avaliação de um docente para uma vaga em uma execução específica.

Campos conceituais mínimos:

- `id UUID`;
- `vacancy_id UUID` → `substitution_vacancies(id)`;
- `candidate_teacher_id UUID` → `users(id)`;
- `engine_run_id UUID` → `substitution_engine_runs(id)`;
- `eligible BOOLEAN`;
- `score NUMERIC`;
- `rank INTEGER`;
- `hard_rule_failures JSONB`;
- `score_breakdown JSONB`;
- `explanation TEXT`;
- timestamps.

Regra: a combinação vaga + candidato + execução deve ser única.

## 4. Entidade operacional existente

`substitutions` continuará sendo utilizada como registro operacional da substituição confirmada.

A evolução de seus campos deverá ser feita separadamente, depois de verificar dependências e compatibilidade. Nenhuma coluna existente deve ser removida ou reinterpretada sem auditoria.

## 5. Índices previstos

Após confirmação dos tipos, avaliar índices para:

- `(organization_id, school_id)`;
- docente;
- data;
- status;
- relação com ausência;
- relação com vaga;
- relação com execução do motor;
- combinação vaga/candidato.

## 6. RLS — desenho preliminar

As novas tabelas deverão ter RLS habilitado.

O desenho definitivo deverá usar as funções de autorização efetivamente existentes no Core/EIOS, após auditoria.

Princípios obrigatórios:

1. escopo por organização/escola;
2. nenhuma ampliação automática de visibilidade entre docentes;
3. recomendação visível somente a usuários autorizados;
4. confirmação somente por usuário com responsabilidade administrativa compatível;
5. registros históricos e decisões protegidos contra alteração silenciosa;
6. auditoria de criação, execução, recomendação e confirmação.

Não copiar mecanicamente `same_organization` como policy definitiva.

## 7. Integridade e concorrência

Antes de confirmar uma substituição, o sistema deverá revalidar:

- ausência ainda válida;
- aula ainda vaga;
- candidato ainda disponível;
- inexistência de conflito de horário;
- inexistência de outra substituição concorrente;
- autorização do usuário que confirma.

A confirmação deve ocorrer em operação transacional quando a infraestrutura permitir.

## 8. Idempotência

Uma nova execução do motor não deve apagar execuções anteriores.

O `input_hash`, a versão do motor e a versão das regras devem permitir identificar quando uma execução reproduz o mesmo conjunto de entradas.

Resultados anteriores permanecem como histórico.

## 9. Dependências bloqueadas

### BLOQUEADOR 01 — fonte oficial de horários

`substitution_vacancies.schedule_id` depende de `schedules(id)`, mas a definição de `schedules` não foi localizada no SQL versionado auditado. O Core possui referências e índices que pressupõem essa tabela, portanto é necessário reconciliar o schema efetivamente aplicado no Supabase com o repositório.

Além disso, a grade operacional precisa ser vinculada a uma fonte oficial publicada/versionada. Nenhum `schedule_id`, identificador de professor, turma ou componente curricular da SED será inferido a partir de nomes, CPF, posição de linha, dados históricos ou telas/tutorials.

### BLOQUEADOR 02 — identidade acadêmica e associação

Ainda falta um artefato técnico operacional atual que permita homologar os identificadores e a relação entre professor, classe/subturma e componente curricular, incluindo validade temporal e chave de associação.

Sem essa evidência, `teacher_id`, `class_id` e `subject_id` permanecem referências conceituais ao Core, não uma autorização para mapear campos físicos da SED.

### BLOQUEADOR 03 — autorização administrativa

O Core/EIOS possui funções de autorização específicas para registros da Agenda, mas ainda não foi demonstrado que elas expressam exatamente o papel/permissão necessário para administrar e confirmar a Escala.

A policy final não será escrita até essa verificação.

### BLOQUEADOR 04 — proveniência e publicação

A entrada que alimenta o motor deverá preservar fonte, lote, versão/hash, origem, momento de captura/publicação e estado de publicação. A regra sintética de que somente `published` é consumível já possui guarda isolada, mas a semântica institucional real da publicação ainda depende do artefato SED homologado.

## 10. Ordem de implementação após desbloqueio

1. obter e preservar o primeiro artefato técnico operacional atual da SED;
2. registrar proveniência, estrutura/dicionário e versão/hash;
3. homologar identificadores de professor, turma/subturma e componente;
4. confirmar `schedules` e seus tipos;
5. confirmar validade/versionamento e relação Associação ↔ Grade;
6. confirmar funções/papéis de autorização;
7. revisar este draft contra o schema e os contratos homologados;
8. converter o draft em migration SQL executável;
9. auditar a migration;
10. criar testes de integridade/RLS;
11. somente então executar no Supabase;
12. auditar o resultado pós-migration.

## 11. Status e gate

**NÃO EXECUTAR.**

Estado atual:

- arquitetura e modelo lógico: consolidados;
- contratos de staging: cobertos sinteticamente;
- guards PostgreSQL: isolados e sintéticos;
- execução PostgreSQL: não comprovada;
- artefato operacional SED 2026: ausente;
- identidade acadêmica/grade oficial: não homologada;
- RLS de produção: não finalizado;
- migration de produção: bloqueada.

Este documento existe para permitir avanço de engenharia sem transformar uma hipótese de schema em alteração física prematura. O próximo desbloqueio material é a aquisição autorizada do artefato técnico SED E3 e sua homologação.