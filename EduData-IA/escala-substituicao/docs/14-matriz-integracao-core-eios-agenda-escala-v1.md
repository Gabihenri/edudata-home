# 14 — Matriz de Integração Core × EIOS × Agenda × Escala v1

**Data:** 2026-09-09  
**Status:** CONTRATO DE INTEGRAÇÃO — NÃO EXECUTAR DDL DE PRODUÇÃO

## 1. Objetivo

Consolidar a fronteira entre os quatro domínios envolvidos na Escala e definir, para cada informação, quem é a fonte de verdade, quem apenas fornece contexto e como o dado chega ao motor.

A regra central é:

> **uma entidade deve possuir uma fonte semântica principal; os demais produtos podem referenciá-la, enriquecê-la ou sinalizar exceções, mas não criar uma segunda verdade concorrente.**

## 2. Evidências de auditoria

A auditoria física do Supabase confirmou `organizations`, `schools`, `teacher_profiles`, `school_years`, `academic_periods`, `organization_members` e estruturas `identity_*`. Não foram encontradas fisicamente as tabelas legadas `schedules`, `classes`, `subjects`, `knowledge_areas`, `availability`, `substitutions` e `audit_logs`.

A Agenda possui `agenda_classes`, `agenda_lessons` e `agenda_schedule_templates`. A migration da Agenda mostra que `agenda_classes` foi criada com campos textuais de ano, série e componente e referências próprias de escola/professor; isso confirma seu caráter operacional, não uma identidade acadêmica institucional versionada.

O EIOS possui contratos semânticos para `ACADEMIC_COMPONENT`, `LEARNING_GROUP` e `EDUCATOR`, além de contrato curricular no qual `CurriculumNode` pode representar `component` e `CurriculumVersion` possui versionamento e validade. Esses contratos são semanticamente úteis, mas não constituem evidência de que as entidades físicas correspondentes já existam no banco.

A camada de governança EIOS também possui registros de auditoria, workflow e proveniência com organização, escola, usuário, versão e hashes. A integração deve reutilizar essa capacidade sem criar ledgers concorrentes sem justificativa.

## 3. Matriz de responsabilidade

| Dado | Fonte primária | EIOS | Agenda | Escala |
|---|---|---|---|---|
| Organização | Core `organizations` | interpreta | referencia | filtra |
| Escola | Core `schools` | interpreta | referencia | filtra |
| Identidade de acesso | `organization_members` + `identity_*` | autoriza | consulta conforme escopo | autoriza |
| Perfil docente | `teacher_profiles` | semântica de educador | usa contexto | usa elegibilidade |
| Ano letivo | `school_years` | contexto acadêmico | referencia | determina vigência |
| Período acadêmico | `academic_periods` | contexto acadêmico | referencia | restringe ocorrência |
| Turma oficial | futuro Core `academic_classes` | `LEARNING_GROUP` | referencia opcional | usa como alvo da vaga |
| Componente curricular | futuro Core `academic_components` | `ACADEMIC_COMPONENT` / currículo | texto/contexto, quando houver | usa para qualificação |
| Grade publicada | futuro `official_schedule_versions` | contexto | não é fonte primária | fonte primária |
| Entrada da grade | futuro `official_schedule_entries` | contexto | não é fonte primária | gera ocorrência |
| Ocorrência temporal | futuro `official_schedule_occurrences` | contexto | pode sinalizar exceção | fonte temporal do motor |
| Planejamento/aula Agenda | `agenda_lessons` | pode enriquecer | fonte primária | apenas contexto |
| Evento/impedimento | `agenda_events` | pode classificar | fonte primária do evento | bloqueia somente por regra |
| Ausência | futuro domínio Escala | pode auditar | pode sinalizar | fonte operacional da vaga |
| Candidato | derivado pelo motor | explica | fornece contexto | calcula |
| Recomendação | derivada pelo motor | pode registrar decisão/proveniência | não decide | calcula |
| Confirmação | decisão autorizada | governance/decision | não decide | registra resultado |

## 4. Identidade docente: decisão de integração

Não é permitido assumir `teacher_profiles.id = auth.uid()`.

O banco físico mostra `teacher_profiles.id` e `teacher_profiles.school_id`, enquanto `organization_members.user_id` é a identidade utilizada pelo mecanismo de acesso. A ausência de FK física entre esses modelos impede inferência automática.

### Estratégia

Antes da migration da Escala, deve ser determinada uma das duas soluções:

**A — equivalência comprovada:** se auditoria dos dados demonstrar que o UUID do perfil é deliberadamente o mesmo UUID da identidade autenticada, documentar essa invariância e criar apenas as FKs necessárias.

**B — associação explícita:** se os UUIDs forem diferentes, criar no Core uma relação de vínculo entre identidade autenticada e perfil docente, com organização, escola, validade, status e provenance. Isso não cria uma segunda identidade; apenas registra a relação entre duas identidades já existentes.

A opção B é preferível a inferências por nome ou e-mail.

## 5. Turma e componente

### Turma

`agenda_classes` não será promovida a turma oficial. A turma institucional deve possuir código/identidade estável, ano letivo, escola, status e origem, com histórico quando houver mudança estrutural.

No EIOS, o conceito semântico correspondente é `LEARNING_GROUP`; no Core físico, a entidade ainda precisa ser materializada.

### Componente

O componente curricular deve possuir identidade própria e ser compatível com o vocabulário curricular EIOS. Texto livre de `teacher_profiles.subjects[]`, `agenda_classes.subject` ou `agenda_lessons.subject` pode servir para matching/importação, mas não deve ser usado como FK implícita.

No EIOS, `ACADEMIC_COMPONENT` já existe como conceito semântico e `CurriculumNode` admite `component`; isso permite uma futura referência curricular sem confundir currículo com grade horária.

## 6. Grade e Agenda

A fronteira é obrigatória:

```text
GRADE OFICIAL
  = obrigação institucional programada

AGENDA
  = planejamento + registro + evidência + eventos + exceções

ESCALA
  = decisão operacional baseada na grade + regras + impedimentos
```

`agenda_schedule_templates` não deve alimentar diretamente a vaga, porque é um mecanismo de recorrência da Agenda.

`agenda_lessons` pode ter data e horário e até registrar reagendamento, mas não prova que seja a publicação administrativa da grade.

`agenda_events` pode bloquear um candidato somente quando seu tipo/status/regra determinar que o evento é um impedimento real no intervalo.

## 7. Temporalidade como contrato do motor

O motor deve receber intervalos concretos:

```text
scheduled_date
start_time
end_time
```

e resolver conflitos por sobreposição de intervalos.

Para duas atividades A e B, existe conflito quando:

```text
A.start < B.end
AND
B.start < A.end
```

O motor deve ainda validar:

- `end_time > start_time`;
- ocorrência dentro da validade da versão da grade;
- ausência cobrindo a ocorrência;
- inexistência de outra alocação do candidato no intervalo;
- impedimentos explícitos da Agenda;
- alterações de grade após a geração da recomendação.

Uma alteração posterior da grade deve invalidar ou exigir revalidação da recomendação antes da confirmação.

## 8. Proveniência e versionamento

Cada execução do motor deve conseguir responder:

1. qual versão da grade foi utilizada;
2. qual versão das regras foi utilizada;
3. quais ausências estavam confirmadas;
4. quais impedimentos foram considerados;
5. quais candidatos foram eliminados e por quê;
6. qual pontuação foi calculada;
7. quais alternativas permaneciam válidas;
8. quem tomou a decisão final;
9. em que momento a decisão ocorreu.

O EIOS governance já possui estruturas para audit event, workflow e provenance. A futura Escala deve integrar-se a esse mecanismo com `resource_type`, `resource_id`, `run_id`, versões e escopo institucional, em vez de criar uma auditoria paralela isolada.

## 9. RBAC/RLS da Escala

A autorização deve usar o Core `identity_*`.

Matriz mínima:

| Capacidade | Professor | Gestão autorizada | Auditor |
|---|---:|---:|---:|
| Ver próprio vínculo | Sim | Conforme escopo | Conforme autorização |
| Ver vaga | Conforme regra | Sim | Conforme autorização |
| Ver candidatos | Não por padrão | Sim | Conforme autorização |
| Ver score/explicação | Não por padrão | Sim | Conforme autorização |
| Executar motor | Não por padrão | Sim, se permitido | Não |
| Reexecutar motor | Não por padrão | Sim, se permitido | Não |
| Confirmar substituição | Não | Sim, com permissão específica | Não |
| Alterar decisão excepcional | Não | Sim, com justificativa | Não |
| Consultar auditoria | Não | Se `can_audit` | Sim |

Nenhuma policy poderá conceder acesso operacional somente porque o usuário pertence à mesma organização.

## 10. Fluxo canônico

```text
Core institucional
   ↓
identidade + escola + docente + ano/período
   ↓
Grade oficial publicada
   ↓
Ocorrência temporal
   ↓
Ausência confirmada
   ↓
Vaga
   ↓
Agenda / impedimentos complementares
   ↓
Filtros obrigatórios
   ↓
Candidatos elegíveis
   ↓
Pontuação + alternativas
   ↓
Recomendação explicável
   ↓
Validação humana
   ↓
Decisão confirmada
   ↓
EIOS Governance + Identity Audit
```

## 11. Casos que devem ser testados antes do DDL

### Caso A — conflito simples
Professor candidato possui aula oficial simultânea. Resultado: inelegível.

### Caso B — formação institucional
Professor possui formação/reunião registrada como impedimento explícito no intervalo. Resultado: inelegível.

### Caso C — Agenda sem regra de bloqueio
Existe evento pessoal na Agenda, mas ele não está classificado como impedimento institucional. Resultado: não bloquear automaticamente.

### Caso D — múltiplas vagas
Duas vagas competem pelos mesmos candidatos. O motor precisa avaliar a alocação global, não resolver cada vaga isoladamente.

### Caso E — mudança da grade
Uma nova versão é publicada depois da recomendação e antes da confirmação. Resultado: recomendação exige revalidação.

### Caso F — identidade ambígua
Importação encontra dois perfis possíveis para o mesmo docente. Resultado: `ambiguous`; não entra silenciosamente no motor.

### Caso G — ausência sem candidato
Todos os candidatos são eliminados. Resultado: `não_alocada` com razões auditáveis.

### Caso H — acesso indevido
Usuário de outra escola tenta consultar candidatos. Resultado: acesso negado e evento de auditoria.

## 12. Auditoria desta fase

| ID | Achado | Severidade | Resultado |
|---|---|---|---|
| INT-01 | Fontes de verdade precisam permanecer separadas | Critical | Aprovado como arquitetura |
| INT-02 | `teacher_profiles` não possui relação comprovada com Auth | High | Bloqueado para DDL |
| INT-03 | Turma oficial ainda não existe fisicamente | Critical | Bloqueado |
| INT-04 | Componente curricular físico canônico ainda não existe | Critical | Bloqueado |
| INT-05 | Grade oficial ainda não existe fisicamente | Critical | Bloqueado |
| INT-06 | Agenda não pode ser promovida a grade | High | Aprovado |
| INT-07 | Temporalidade deve ser baseada em intervalos | High | Requisito obrigatório |
| INT-08 | Governance EIOS pode suportar provenance/workflow | Medium | Integração a validar |
| INT-09 | Permissões específicas da Escala ainda não materializadas | High | Bloqueado |
| INT-10 | Reprocessamento deve preservar versões/histórico | High | Requisito obrigatório |

## 13. Decisão final da fase

A arquitetura está suficientemente definida para iniciar o **desenho físico detalhado**, mas ainda não para executar migration.

A próxima etapa será produzir o **modelo físico candidato da fundação**, incluindo nomes definitivos, tipos UUID, FKs somente para entidades comprovadas, constraints, índices, RLS, provenance e estratégia de importação. Esse artefato continuará sendo `DRAFT — NÃO EXECUTAR` até a auditoria final de dependências.

**Status global:** AMARELO — arquitetura consolidada, DDL de produção bloqueado.
