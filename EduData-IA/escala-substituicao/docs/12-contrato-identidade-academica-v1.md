# Escala Inteligente de Substituição — Contrato de Identidade Acadêmica v1

**Data:** 2026-09-09  
**Status:** AUDITORIA CONCLUÍDA — BLOQUEIO PARA MIGRAÇÃO FÍSICA MANTIDO  
**Escopo:** professor, escola, turma, componente curricular e período letivo utilizados pelo motor da Escala.

---

## 1. Objetivo

Estabelecer o contrato mínimo de identidade acadêmica que permita à Escala relacionar uma ausência e uma aula vaga a entidades institucionais reais, sem duplicar o Core nem transformar entidades operacionais da Agenda em fonte oficial da grade.

A regra é: **existência física não implica adequação semântica**. Uma tabela somente pode ser usada pelo motor quando sua finalidade, identidade, escopo, integridade e autorização estiverem comprovados.

---

## 2. Evidência física auditada

No projeto Supabase `EduData IA` (`ihchzfndmdwtoabttkil`) foram confirmadas fisicamente:

- `organizations`
- `schools`
- `teacher_profiles`
- `school_years`
- `academic_periods`
- `agenda_classes`
- `agenda_lessons`
- `agenda_schedule_templates`
- estruturas `identity_*` de autorização/auditoria.

Não foram encontradas fisicamente, na auditoria atual:

- `users`
- `classes`
- `subjects`
- `knowledge_areas`
- `schedules`
- `availability`
- `substitutions`
- `audit_logs`.

Consequentemente, o modelo lógico legado que pressupunha essas tabelas não pode ser convertido diretamente em DDL de produção.

---

## 3. Contrato de identidade por entidade

### 3.1 Organização

**Entidade:** `organizations.id`  
**Status:** APROVADA COMO IDENTIDADE INSTITUCIONAL.

É a raiz de isolamento organizacional e deve participar das relações da Escala quando o dado for multi-institucional.

### 3.2 Escola

**Entidade:** `schools.id`  
**Status:** APROVADA COMO IDENTIDADE ESCOLAR.

A tabela possui `organization_id`, permitindo validar a relação organização → escola. O motor deve sempre preservar essa cadeia.

### 3.3 Professor

**Entidade física atual:** `teacher_profiles.id`  
**Status:** APROVADA PROVISORIAMENTE COMO IDENTIDADE DOCENTE DO DOMÍNIO, PENDENTE DE AUDITORIA DE INTEGRAÇÃO COM AUTH/IDENTITY.

Evidências:

- `teacher_profiles.id` é UUID e obrigatório;
- possui `school_id` com FK para `schools.id`;
- possui `organization_id`;
- possui `name`, `email`, `area`, `knowledge_area`, `teaching_stage` e `subjects`;
- não possui `user_id` no esquema físico atual.

**Regra:** não criar `users` apenas para satisfazer o modelo antigo. Antes de qualquer FK para usuário/autenticação, deve ser comprovado como `teacher_profiles.id` se relaciona com a identidade autenticada e com `identity_*`.

### 3.4 Ano letivo

**Entidade:** `school_years.id`  
**Status:** APROVADA.

Possui `school_id`, `organization_id`, `year`, validade, `status`, `calendar_version`, publicação e histórico de exclusão/restauração. É adequada para versionar o contexto acadêmico temporal.

### 3.5 Período acadêmico

**Entidade:** `academic_periods.id`  
**Status:** APROVADA.

Possui relação com organização, escola e ano letivo, além de sequência, datas, status e publicação. Pode contextualizar ocorrências da Escala, mas não representa a grade horária por si só.

### 3.6 Turma

**Entidade candidata:** `agenda_classes.id`  
**Status:** **REPROVADA COMO IDENTIDADE OFICIAL DA GRADE.**

Evidência de origem: a migration `005_agenda_classes.sql` define uma entidade com `name`, `school_year`, `grade`, `subject`, `school_id`, `teacher_id` e `active`, criada especificamente dentro do domínio Agenda. fileciteturn173file0L2-L10

A estrutura não possui, por si só, uma chave acadêmica institucional/versionada nem relações normalizadas para componente curricular, ano letivo e vínculo oficial docente.

Além disso, as políticas físicas atuais de `agenda_classes` são governadas por `can_view_agenda_record`/`can_update_agenda_record`, e a inserção de proprietário exige `teacher_id = auth.uid()`. Isso caracteriza uma entidade operacional orientada ao registro docente, não uma fonte institucional neutra para o motor de substituição.

**Conclusão:** `agenda_classes` pode ser referência de contexto da Agenda, mas não deve ser promovida silenciosamente a `class_id` oficial da Escala.

### 3.7 Componente curricular / disciplina

**Entidades:** nenhuma tabela canônica física de `subjects` ou `knowledge_areas` foi confirmada na auditoria atual.  
**Status:** **BLOQUEADA.**

`teacher_profiles.subjects` é um ARRAY textual e `agenda_classes.subject`/`agenda_lessons.subject` são campos textuais. Esses campos podem auxiliar importação/matching, mas não constituem uma identidade curricular canônica suficiente para integridade referencial.

**Regra:** o motor não deve usar texto livre como FK sem um contrato de normalização e identidade curricular.

---

## 4. Grade oficial

O contrato estabelecido em `11-contrato-fonte-oficial-grade-v1.md` permanece vigente.

A Escala necessita de uma representação institucional de ocorrência de aula contendo, no mínimo:

- organização;
- escola;
- professor responsável;
- turma;
- componente curricular;
- data/recorrência;
- início e fim;
- turno/período;
- validade;
- versão da grade;
- origem;
- publicação e responsável.

A entidade física ainda não está definida. Portanto, **não é permitido criar `substitution_vacancies.schedule_id` apontando para uma tabela inexistente ou converter `agenda_lessons` automaticamente em grade oficial.**

---

## 5. Separação semântica obrigatória

```text
IDENTIDADE INSTITUCIONAL
organizations
      ↓
schools
      ↓
teacher_profiles / identidade docente
      ↓
school_years → academic_periods

GRADE OFICIAL (AINDA A DEFINIR)
      ↓
ocorrência institucional de aula
      ↓
Escala → ausência → vaga → candidatos → recomendação → decisão

AGENDA
agenda_classes
agenda_lessons
agenda_events
agenda_schedule_templates
      ↓
planejamento, registro, contexto e impedimentos complementares
```

A Agenda pode informar cancelamentos, reagendamentos, eventos ou contexto operacional quando uma regra explícita determinar que o fato constitui impedimento. Ela não deve ser confundida com a grade institucional.

---

## 6. Contrato de importação

Enquanto a entidade oficial da grade não estiver implantada, uma importação poderá receber dados externos, mas deverá produzir um conjunto validável com identidade canônica ou referência de origem.

Nenhuma importação deve:

- sobrescrever silenciosamente uma versão publicada;
- criar professores duplicados;
- converter nomes de turma em identidade sem regra de matching;
- converter nomes de disciplinas em FK implícita;
- misturar dados da Agenda com dados da grade;
- publicar uma grade sem responsável e evidência de auditoria.

Matching de professor, turma e componente deve ter resultado explícito: `resolvido`, `ambíguo` ou `não_resolvido`.

---

## 7. RBAC/RLS — resultado da auditoria

A autorização deve continuar centralizada no Core `identity_*`.

A auditoria física confirmou que `identity_product_permissions` possui permissões separadas para acesso, visualização própria/equipe/escola/organização, atualização, exportação e auditoria. `identity_responsibility_scopes` também possui escopo por organização/escola/usuário e validade.

Para a Escala, isso exige um `product_code` e permissões próprias do produto/módulo, sem criar um RBAC paralelo.

As políticas atuais de `agenda_classes` e `agenda_lessons` reforçam que seus registros são protegidos por autorização específica da Agenda. Portanto, suas funções de autorização não devem ser reutilizadas automaticamente para a Escala sem revisão semântica.

---

## 8. Achados de auditoria

| ID | Achado | Severidade | Resultado |
|---|---|---|---|
| AUD-IDENT-01 | `teacher_profiles` existe, mas não possui `user_id` do modelo legado | High | Pendente integração Auth/Identity |
| AUD-IDENT-02 | `agenda_classes` é entidade da Agenda e não grade institucional | Critical | Não usar como `class_id` oficial |
| AUD-IDENT-03 | Não há entidade física canônica confirmada para componente curricular | Critical | Bloqueia FK curricular |
| AUD-IDENT-04 | `schedules` não existe fisicamente | Critical | Bloqueia `schedule_id` legado |
| AUD-IDENT-05 | `availability`, `substitutions` e `audit_logs` legados não existem fisicamente | Critical | Reconciliar Core antes da migration |
| AUD-IDENT-06 | Ano/período acadêmico possuem estrutura institucional/versionada | Medium | Reutilizar |
| AUD-IDENT-07 | RLS da Agenda é orientada ao registro/proprietário | High | Não reutilizar semântica automaticamente |

---

## 9. Decisão arquitetural desta fase

**Não criar ainda as tabelas físicas da Escala.**

O próximo desenho deve partir de dois contratos canônicos:

1. **identidade acadêmica institucional**, reaproveitando `organizations`, `schools`, `teacher_profiles`, `school_years` e `academic_periods` onde semanticamente adequados;
2. **grade oficial versionada**, ainda ausente fisicamente.

Para turma e componente curricular, a solução preferencial é uma extensão do Core institucional, não uma cópia dentro da Escala e não a promoção de entidades da Agenda a entidades oficiais.

---

## 10. Critério para desbloqueio

A migration física da Escala só poderá avançar quando houver evidência de:

- identidade docente integrada ao sistema de identidade;
- entidade canônica de turma;
- entidade canônica de componente curricular;
- entidade/versionamento da grade oficial;
- relações FK verificadas;
- publicação/versionamento da grade;
- RLS e permissões próprias da Escala;
- auditoria de importação e publicação;
- testes temporais de conflito;
- reconciliação definitiva de disponibilidade e registros de substituição;
- preservação histórica e idempotência.

**Status global:** NÃO LIBERADO PARA EXECUÇÃO DE DDL DE PRODUÇÃO.

---

## 11. Auditoria desta fase

### Evidências executadas

- inspeção das colunas físicas no Supabase;
- inspeção das FKs das entidades acadêmicas e Agenda;
- inspeção das políticas RLS das entidades relevantes;
- inspeção do SQL de criação de `agenda_classes` no repositório;
- comparação com os contratos e auditorias anteriores da Escala.

### Resultado

A auditoria reduziu a ambiguidade do modelo: professor, escola, ano e período já possuem candidatos físicos fortes; turma e componente curricular continuam sem identidade canônica suficiente; a grade oficial continua sendo o principal bloqueador estrutural.

Nenhum DDL de produção foi executado nesta fase.
