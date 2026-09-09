# 13 — Modelo da Grade Oficial v1

**Projeto:** Escala Inteligente de Substituição  
**Data:** 2026-09-09  
**Status:** CONTRATO DE ARQUITETURA — NÃO EXECUTAR DDL DE PRODUÇÃO

## 1. Objetivo

Definir o modelo canônico que deverá representar a grade institucional oficial consumida pela Escala, sem reutilizar indevidamente entidades da Agenda e sem criar uma segunda identidade acadêmica paralela.

## 2. Evidência de auditoria

A auditoria física do projeto Supabase `EduData IA` (`ihchzfndmdwtoabttkil`) confirmou:

- `organizations`, `schools`, `school_years` e `academic_periods` existem fisicamente e possuem relações institucionais/temporais adequadas.
- `teacher_profiles` existe e possui `id`, `school_id`, `organization_id`, `name`, `area`, `knowledge_area`, `teaching_stage` e `subjects[]`, porém não possui `user_id` do modelo legado.
- `agenda_classes`, `agenda_lessons` e `agenda_schedule_templates` existem, mas são entidades da Agenda e não constituem, por si só, a grade institucional oficial.
- Não foram localizadas no Core físico as tabelas canônicas `classes`, `subjects`, `knowledge_areas`, `schedules`, `availability`, `substitutions` ou `audit_logs` do modelo legado.
- A Agenda possui contrato curricular em software: `CurriculumNode` suporta tipos como `component`, e `CurriculumVersion` possui versionamento, validade, publicação e hash de origem. Isso é relevante para alinhamento curricular, mas não substitui a identidade operacional da grade.

## 3. Decisão arquitetural

A grade oficial será tratada como **fonte institucional versionada de ocorrências letivas**, separada semanticamente da Agenda.

Modelo conceitual:

```text
ORGANIZAÇÃO
   ↓
ESCOLA
   ↓
ANO LETIVO
   ↓
VERSÃO DA GRADE OFICIAL
   ├── TURMAS OFICIAIS
   ├── COMPONENTES CURRICULARES
   └── OCORRÊNCIAS DA GRADE
          ├── docente responsável
          ├── turma
          ├── componente
          ├── data/recorrência
          ├── início/fim
          ├── turno
          └── validade
```

A Escala não deve depender de `agenda_classes` para determinar a existência de uma aula vaga.

## 4. Entidades canônicas propostas

### 4.1 `academic_classes`

Representa a turma institucional, não uma turma criada pelo professor na Agenda.

Campos mínimos:

- `id`
- `organization_id`
- `school_id`
- `school_year_id`
- identificador/código oficial da turma
- nome oficial
- etapa/ano/série
- turno
- status
- origem
- metadados de importação
- timestamps

A identidade da turma deve ser estável entre versões da grade quando o vínculo institucional permitir. Alterações estruturais devem gerar histórico/proveniência, não sobrescrita silenciosa.

### 4.2 `academic_components`

Representa o componente curricular institucional utilizado para qualificação e compatibilidade da substituição.

Campos mínimos:

- `id`
- `organization_id` quando houver componente local
- código oficial, quando houver
- nome oficial
- área de conhecimento
- etapa de ensino
- fonte/origem
- referência curricular opcional
- status
- metadados

O componente não deve ser inferido exclusivamente a partir de texto livre de `teacher_profiles.subjects[]` ou `agenda_lessons.subject`.

### 4.3 `official_schedule_versions`

Representa uma publicação versionada da grade de uma escola/ano letivo.

Campos mínimos:

- `id`
- `organization_id`
- `school_id`
- `school_year_id`
- versão
- status (`draft`, `validated`, `published`, `superseded`, `revoked`)
- `valid_from`
- `valid_until`
- origem
- `source_name`
- `source_hash`
- `imported_at`
- `published_at`
- `published_by`
- `created_by`
- metadados

Somente uma versão explicitamente publicada e válida pode alimentar o motor em produção.

### 4.4 `official_schedule_entries`

Representa cada vínculo de grade que pode produzir uma ocorrência de aula.

Campos mínimos:

- `id`
- `schedule_version_id`
- `school_id`
- `academic_class_id`
- `academic_component_id`
- `teacher_profile_id`
- dia da semana ou regra de recorrência
- `start_time`
- `end_time`
- turno
- período acadêmico, quando aplicável
- data inicial/final de validade
- status
- identificador externo/origem
- metadados

Uma entrada não é automaticamente uma aula ocorrida em uma data específica; ela é uma regra/registro de grade que pode gerar ocorrências.

### 4.5 `official_schedule_occurrences`

Representa a ocorrência temporal efetiva usada pelo motor da Escala.

Campos mínimos:

- `id`
- `schedule_version_id`
- `schedule_entry_id`
- `school_id`
- `academic_class_id`
- `academic_component_id`
- `teacher_profile_id`
- `scheduled_date`
- `start_time`
- `end_time`
- turno
- status
- origem da ocorrência
- metadados

Essa entidade é a principal candidata a referência futura de `substitution_vacancies`, porque torna explícitos data e intervalo temporal e permite detectar conflitos simultâneos.

## 5. Separação semântica obrigatória

### Grade oficial

Define a obrigação institucional programada: **quem deveria estar com qual turma/componente, quando e onde**.

### Agenda

Registra planejamento, aula, evidência, eventos, reagendamentos e outros elementos operacionais/pedagógicos. `agenda_lessons` possui inclusive `scheduled_date`, `start_time`, `end_time` e `rescheduled_*`, mas seu vínculo é com a Agenda e seu proprietário; por isso não deve ser tratado como fonte oficial da grade.

### Currículo EIOS

Define estruturas curriculares, versões, componentes e relações pedagógicas. O contrato existente suporta `CurriculumVersion` e `CurriculumNode` com `component`, portanto deve ser integrado por referência quando houver correspondência validada, sem transformar o currículo em grade horária.

### Escala

Consome a ocorrência oficial da grade e combina-a com ausência, impedimentos, disponibilidade, qualificação, outras alocações e regras institucionais.

## 6. Importação e resolução de identidade

Toda importação externa deve preservar:

1. valor original;
2. origem;
3. versão da importação;
4. hash, quando possível;
5. resultado do matching;
6. confiança;
7. motivo da resolução;
8. responsável pela validação humana quando necessária.

Estados mínimos de matching:

- `resolved`
- `ambiguous`
- `unresolved`
- `rejected`

Nenhuma correspondência ambígua deve entrar silenciosamente no motor de produção.

## 7. Regras temporais

A ocorrência deve permitir detectar pelo menos:

- docente já ocupado no mesmo intervalo;
- docente com duas substituições simultâneas;
- turma com duas aulas simultâneas;
- intervalo inválido (`end <= start`);
- entrada fora da validade da versão;
- aula em dia não abrangido pela grade publicada;
- ausência que não cobre a ocorrência;
- impedimento de Agenda que bloqueia explicitamente o intervalo;
- alteração de grade entre a geração da recomendação e a confirmação.

O motor deve trabalhar com intervalos temporais, não apenas com `period` textual.

## 8. Relação com teacher_profiles

O `teacher_profiles.id` físico é a referência provisória do domínio docente porque existe fisicamente e possui vínculo com `schools.id`.

Entretanto, a auditoria mostrou que ele não possui `user_id`. Portanto:

- não assumir que `teacher_profiles.id = auth.uid()`;
- não criar FK artificial para Auth;
- resolver a identidade de acesso por meio do Core `identity_*`;
- antes da execução de DDL, documentar a relação entre identidade de usuário, membership e perfil docente.

## 9. RBAC/RLS

A grade oficial deve reutilizar a governança central de identidade.

Permissões futuras devem distinguir, no mínimo:

- visualizar grade;
- importar grade;
- validar correspondências;
- publicar versão;
- executar motor;
- confirmar substituição;
- consultar auditoria.

O escopo deve respeitar organização e escola e, quando aplicável, responsabilidade explícita. Não basta permitir acesso a qualquer membro da mesma organização.

`identity_product_permissions` já possui campos de acesso, visualização por escopo, atualização, exportação e auditoria. A Escala deverá receber `product_code` próprio antes da liberação operacional.

## 10. Auditoria obrigatória

### AUD-GRADE-06 — identidade de turma
**Severidade:** Critical  
**Status:** Aberto  
A entidade oficial de turma ainda não existe fisicamente.

### AUD-GRADE-07 — identidade de componente
**Severidade:** Critical  
**Status:** Aberto  
Não existe entidade física canônica de componente curricular no Core auditado.

### AUD-GRADE-08 — versão publicada
**Severidade:** High  
**Status:** Contrato definido  
A grade deve possuir versão, validade, origem, publicação e histórico.

### AUD-GRADE-09 — ocorrência temporal
**Severidade:** Critical  
**Status:** Aberto  
O modelo físico necessário para gerar/verificar ocorrências ainda não existe.

### AUD-GRADE-10 — separação Agenda/Grade
**Severidade:** High  
**Status:** Aprovado  
`agenda_classes`, `agenda_lessons` e `agenda_schedule_templates` não serão usados como substitutos automáticos da grade oficial.

### AUD-GRADE-11 — matching
**Severidade:** High  
**Status:** Contrato definido  
Correspondências ambíguas ou não resolvidas não entram no motor sem validação.

### AUD-GRADE-12 — identidade de acesso docente
**Severidade:** High  
**Status:** Aberto  
A relação entre `teacher_profiles.id` e a identidade autenticada ainda precisa de fechamento formal.

## 11. Impacto na Escala

O desenho final recomendado passa a ser:

```text
GRADE OFICIAL PUBLICADA
        ↓
OCORRÊNCIA TEMPORAL
        ↓
AUSÊNCIA CONFIRMADA
        ↓
VAGA
        ↓
UNIVERSO DE DOCENTES
        ↓
FILTROS OBRIGATÓRIOS
        ↓
CONFLITOS TEMPORAIS / IMPEDIMENTOS
        ↓
PONTUAÇÃO
        ↓
ALTERNATIVAS VÁLIDAS
        ↓
RECOMENDAÇÃO EXPLICÁVEL
        ↓
DECISÃO HUMANA
        ↓
REGISTRO + AUDITORIA
```

A recomendação continua não sendo ato administrativo.

## 12. Critério de liberação para DDL

A execução física somente poderá ser liberada após:

- definição final dos nomes físicos;
- confirmação da relação docente ↔ identidade;
- criação/revisão da identidade oficial de turma;
- criação/revisão da identidade oficial de componente;
- modelo de versão publicada da grade;
- modelo de ocorrência temporal;
- contrato de importação e matching;
- RLS e permissões Escala;
- integração com auditoria EIOS/identity;
- testes de conflito temporal;
- testes de isolamento entre escolas/usuários;
- teste de reprocessamento/idempotência;
- teste de alteração de grade entre recomendação e confirmação.

## 13. Resultado da fase

**AUDITORIA + ARQUITETURA AVANÇADAS.**

O bloqueio deixou de ser apenas “falta a tabela `schedules`”. Agora existe um contrato explícito para uma **grade oficial versionada e temporal**, evitando recriar o modelo legado de forma incompatível com o Core físico atual.

**Status global da Escala:** NÃO LIBERADA PARA DDL DE PRODUÇÃO.

**Próxima fase:** fechar a matriz de integração entre `academic_classes`, `academic_components`, `official_schedule_versions`, `official_schedule_entries`, `official_schedule_occurrences`, `teacher_profiles` e `identity_*`, incluindo RLS e estratégia de importação.
