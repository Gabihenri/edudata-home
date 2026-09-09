# Auditoria do Schema Core — Escala de Substituição v1

**Status:** auditoria técnica inicial — bloqueio antes da migration física  
**Repositório:** `Gabihenri/edudata-home`  
**Domínio:** `EduData-IA/escala-substituicao/`  

## 1. Objetivo

Confrontar o modelo de dados planejado para a Escala Inteligente de Substituição com o schema SQL atualmente versionado no Core do repositório, antes de qualquer execução de migration no Supabase.

A regra é simples: **não executar DDL novo enquanto as dependências, tipos, FKs e RLS reais não estiverem verificadas.**

## 2. Evidências verificadas

### 2.1 Usuários e perfis docentes

O Core possui `users` com `id UUID`, `school_id UUID`, `organization_id UUID`, papel, status ativo e dados de identidade. `teacher_profiles` possui `user_id UUID UNIQUE` e informações como vínculo, carga semanal, experiência e área de conhecimento.

**Decisão:** reutilizar `users` como identidade do docente e `teacher_profiles` como perfil complementar. Não criar tabela paralela `teachers`.

### 2.2 Estrutura acadêmica

O Core possui `knowledge_areas`, `subjects`, `school_years` e `classes`. `classes` possui `school_id`, `school_year_id`, nome, série, turno e modalidade. `subjects` possui relação com `knowledge_areas`.

**Decisão:** reutilizar integralmente essas entidades no domínio da Escala.

### 2.3 Disponibilidade

O Core possui `availability` com `teacher_id UUID`, escola, organização, dia da semana, horário inicial/final, status e preferência.

**Decisão:** reutilizar `availability`. A engine deverá tratar disponibilidade como fonte de elegibilidade, sem criar `teacher_availability` paralelo.

### 2.4 Substituições existentes

O Core já possui `substitutions`, vinculando escola, organização, docente ausente, substituto, turma, componente curricular e `schedule_id`, além de data/horário, justificativa, recomendação de IA, score, status e aprovação.

**Decisão:** `substitutions` permanece como registro operacional da substituição confirmada. A evolução deve ser incremental, preservando compatibilidade e histórico.

### 2.5 Auditoria

O Core possui `audit_logs` central com escola, organização, usuário, ação, entidade, entidade/registro afetado, valores anterior/novo, metadados, request/session e timestamp.

**Decisão:** reutilizar `audit_logs`. Não criar `substitution_audit_log` paralelo.

### 2.6 Agenda e impedimentos

`agenda_events` possui docente, escola, organização, turma, componente, início/fim, tipo, categoria e status.

**Decisão:** a Escala poderá consultar eventos de agenda como fonte adicional de impedimentos, mas a regra de conflito deve ser definida explicitamente antes da implementação da engine. Não assumir que todo evento de agenda bloqueia substituição.

## 3. Achado crítico

### CORE-SCHEMA-01 — `schedules` não foi localizada no schema atual

**Severidade:** CRÍTICA  
**Estado:** BLOQUEADOR

O arquivo `database/08_substitutions.sql` cria uma FK de `substitutions.schedule_id` para `schedules(id)`, porém a auditoria do diretório `database/` não localizou uma declaração `CREATE TABLE schedules` correspondente. A busca também retornou somente essa referência à tabela `schedules`.

Isso produz uma inconsistência estrutural relevante: o modelo da Escala depende de uma grade/horário oficial, mas o Core atualmente não apresenta, no conjunto de SQL auditado, uma tabela `schedules` verificável.

**Impacto:** não é seguro criar `substitution_vacancies` referenciando `schedules(id)` até que a existência real dessa tabela no banco seja comprovada ou que o modelo oficial de horários seja definido.

**Ação obrigatória:** antes da migration v1, verificar diretamente o schema efetivamente aplicado no Supabase e reconciliar essa divergência com o repositório.

## 4. RLS — achado de governança

O `database/12_rls.sql` habilita RLS para `users`, `teacher_profiles`, `substitutions` e `audit_logs`, utilizando principalmente escopo por organização; classes e algumas entidades acadêmicas utilizam escopo por escola.

Para a Escala, isso é insuficiente como especificação final de autorização: a regra de negócio exige que a recomendação seja acessível somente a usuários autorizados a administrar a escala, sem ampliar automaticamente a visibilidade de dados docentes.

**Risco:** copiar mecanicamente uma policy `same_organization` para todas as novas tabelas pode permitir acesso de pares que não deveriam administrar ou confirmar substituições.

**Ação:** a migration da Escala deverá separar, no mínimo:
- leitura operacional compatível com o escopo institucional;
- acesso a candidatos/recomendações conforme papel/permissão;
- confirmação administrativa somente por usuário autorizado;
- preservação da auditoria sem abrir dados além do necessário.

## 5. Matriz de decisão

| Item | Evidência | Reutilizar? | Risco | Decisão |
|---|---|---:|---|---|
| `users` | Confirmado | Sim | Baixo | Fonte de identidade |
| `teacher_profiles` | Confirmado | Sim | Baixo | Perfil docente |
| `schools` / `organizations` | Confirmado no Core | Sim | Baixo | Escopo institucional |
| `classes` | Confirmado | Sim | Baixo | Turmas |
| `subjects` | Confirmado | Sim | Baixo | Componentes curriculares |
| `knowledge_areas` | Confirmado | Sim | Baixo | Área de conhecimento |
| `availability` | Confirmado | Sim | Médio | Elegibilidade temporal |
| `agenda_events` | Confirmado | Sim | Médio | Impedimentos/contexto |
| `substitutions` | Confirmado | Sim, evolutivo | Alto | Resultado operacional |
| `audit_logs` | Confirmado | Sim | Baixo | Auditoria central |
| `schedules` | Não localizado | Ainda não | Crítico | BLOQUEADO |

## 6. O que pode avançar

A arquitetura lógica permanece válida para as entidades específicas da Escala:

- `substitution_absences`
- `substitution_vacancies`
- `substitution_candidates`
- `substitution_rule_sets`
- `substitution_engine_runs`

Entretanto, os FKs dessas tabelas só devem ser definidos após a reconciliação do modelo oficial de horários.

## 7. Critério para liberar a migration

A migration SQL v1 somente será considerada pronta quando:

1. a existência e o schema de `schedules` forem comprovados ou substituídos pelo modelo oficial de horários;
2. tipos de todas as FKs forem confirmados;
3. políticas RLS reais e funções de autorização forem confrontadas com o desenho da Escala;
4. a evolução de `substitutions` for validada sem perda de compatibilidade;
5. houver testes para conflito de horário, indisponibilidade, dupla alocação, ausência de candidato e acesso indevido;
6. a auditoria de cada decisão estiver preservada no `audit_logs` central;
7. a migration for revisada como artefato antes de qualquer execução no Supabase.

## 8. Resultado da auditoria

**Resultado: NÃO LIBERADO PARA EXECUÇÃO.**

O bloqueio é deliberado e positivo: foi identificado um ponto estrutural que precisa ser resolvido antes de criar tabelas dependentes. A próxima etapa deve ser a reconciliação do modelo de horários real do Core/Supabase e, somente depois, a elaboração da migration SQL v1.
