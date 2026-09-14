# 112 — Matriz de Reconciliação Core × Grade SED v1

**Data:** 2026-09-14  
**Status:** DOCUMENTO DE RECONCILIAÇÃO — NÃO HOMOLOGA A FONTE SED

## 1. Objetivo

Registrar, de forma controlada, o que o Core físico da EduData IA já fornece para a Escala e o que depende de homologação do artefato operacional da SED.

A matriz evita dois erros opostos:

- duplicar no Core uma estrutura que já existe e é suficiente;
- interpretar uma estrutura existente como equivalente à Grade/Associação SED sem evidência.

## 2. Estado físico observado

A inspeção do schema `public` confirmou estruturas compartilhadas para:

- `organizations`;
- `schools`;
- `teacher_profiles`;
- `organization_members`;
- `school_years`;
- `academic_periods`;
- `institutional_calendar_events`;
- `school_operating_hours`;
- `school_calendar_exceptions`;
- `identity_roles`;
- `identity_responsibility_scopes`;
- `identity_product_permissions`;
- `identity_audit_logs`;
- `eios_governance_audit_events`;
- `eios_governance_provenance_records`;
- estruturas da Agenda, incluindo `agenda_classes`, `agenda_lessons` e `agenda_schedule_templates`.

Todas as estruturas observadas acima devem ser tratadas como entidades do Core/Agenda conforme seus contratos próprios. Nenhuma delas foi promovida semanticamente a Grade Oficial SED.

## 3. Matriz

| Necessidade da Escala | Core atual | Evidência suficiente? | Estado |
|---|---|---|---|
| Organização | `organizations.id` | Sim, entidade Core | 🟢 reutilizar |
| Escola | `schools.id` | Sim, entidade Core; vínculo INEP disponível quando aplicável | 🟢 reutilizar |
| Usuário/Auth | `user_profiles`, `auth.users` | Sim para identidade de plataforma | 🟢 reutilizar |
| Perfil docente | `teacher_profiles.id` | Sim para identidade EduData; não comprova ID SED | 🟡 reutilizar somente como identidade interna |
| Ano letivo | `school_years.id` | Sim para calendário institucional | 🟢 reutilizar |
| Período acadêmico | `academic_periods.id` | Sim para período institucional | 🟢 reutilizar |
| Calendário | `institutional_calendar_events` | Sim para calendário institucional | 🟢 reutilizar |
| Horário de funcionamento | `school_operating_hours` | Sim para operação da escola; não é Grade de aulas | 🟡 contexto |
| Exceção de funcionamento | `school_calendar_exceptions` | Sim para exceções institucionais | 🟡 contexto |
| Turma acadêmica canônica | nenhuma entidade Core independente confirmada | Não | 🔴 E3 SED |
| Componente curricular canônico | nenhuma entidade Core independente confirmada | Não | 🔴 E3 SED |
| Associação professor–classe SED | nenhuma entidade Core confirmada | Não | 🔴 E3 SED |
| Grade Horária SED | nenhuma entidade Core confirmada | Não | 🔴 E3 SED |
| Vigência da Associação/Grade | nenhuma estrutura canônica SED confirmada | Não | 🔴 E3 SED |
| Publicação/versionamento da Grade SED | nenhuma semântica SED confirmada | Não | 🔴 E3 SED |
| Ocorrência operacional derivada da Grade | não implementada como entidade da Escala | Depende da Grade homologada | 🔴 bloqueada |
| Ausência | domínio da Escala ainda não persistido | contrato lógico disponível | 🟡 pós-homologação |
| Vaga de substituição | domínio da Escala ainda não persistido | contrato lógico disponível | 🟡 pós-homologação |
| Candidato | domínio da Escala ainda não persistido | contrato lógico disponível | 🟡 pós-homologação |
| Execução do motor | domínio da Escala ainda não persistido | contrato de rodada disponível | 🟡 pós-homologação |
| Auditoria | `identity_audit_logs` + EIOS Governance disponíveis | Estrutura Core existente; semântica específica da Escala ainda deve ser mapeada | 🟢/🟡 |

## 4. Regra para estruturas da Agenda

### `agenda_classes`

Pode representar uma classe utilizada pela Agenda, mas seus campos atuais não comprovam que o registro seja a classe canônica da SED nem que sua identidade corresponda ao identificador acadêmico oficial.

**Decisão:** não usar como chave de matching da Grade SED sem homologação.

### `agenda_lessons`

Contém data, horário, classe e componente textual, mas representa a operação da Agenda. Não deve ser tratado como captura da Grade Oficial SED.

**Decisão:** pode fornecer contexto operacional da Agenda, nunca substituir a fonte oficial.

### `agenda_schedule_templates`

Contém dia da semana, intervalo horário e vigência, mas é um mecanismo de planejamento da Agenda.

**Decisão:** não promover para Grade Oficial SED.

## 5. Identidade

A Escala terá duas camadas de identidade:

```text
IDENTIDADE CANÔNICA EDI
organizations / schools / users / teacher_profiles

                ↕ matching homologado

IDENTIDADE ACADÊMICA SED
professor / classe / componente / associação / grade
```

A segunda camada somente poderá ser materializada após evidência E3.

Não utilizar como chave substituta:

- nome do professor;
- CPF;
- DI histórico;
- posição da coluna;
- e-mail;
- nome da turma;
- descrição da disciplina;
- IDs observados em documentação histórica.

## 6. Calendário × Grade

O Core já possui calendário institucional e períodos acadêmicos. Isso resolve o **contexto temporal institucional**, mas não resolve o quadro de aulas.

A derivação correta permanece:

```text
Ano letivo / calendário Core
          ↓
Grade SED homologada
          ↓
Associação + vigência
          ↓
Ocorrência temporal
          ↓
Ausência
          ↓
Vaga
          ↓
Alocação
```

Uma data válida no calendário não cria, por si só, uma aula.

## 7. Proveniência e governança

O Core já possui estruturas de auditoria e proveniência EIOS. Elas podem ser candidatas a suporte da rastreabilidade da Escala, mas a ligação física definitiva deverá ser decidida depois de:

1. receber o artefato SED atual;
2. definir sua origem e autoridade;
3. definir versão/hash;
4. homologar identidade e validade;
5. confirmar como a publicação oficial será representada.

## 8. Decisões de arquitetura

### D112-01 — reutilizar Core institucional
**DECIDIDO:** `organizations`, `schools`, identidade, calendário e governança não serão duplicados sem justificativa formal.

### D112-02 — não promover Agenda a fonte oficial
**DECIDIDO:** estruturas Agenda não serão utilizadas como substitutas da Grade SED.

### D112-03 — identidade acadêmica separada até homologação
**DECIDIDO:** a Escala não criará FKs acadêmicas de produção antes da homologação dos identificadores SED.

### D112-04 — migration continua condicionada
**DECIDIDO:** o plano de migration somente poderá ser convertido em DDL executável depois do gate de fonte, identidade, temporalidade, publicação e autorização.

## 9. Próximo artefato necessário

O próximo material que destrava esta matriz é um pequeno artefato operacional atual da SED, preferencialmente:

- exportação XLSX/CSV da Associação do Professor à Classe;
- exportação XLSX/CSV da Grade Horária ou Relatório Grade Horária;
- dicionário/layout, se disponível;
- contexto de aquisição: módulo, operação, perfil, escola, ano letivo e data/hora.

Com o artefato, a matriz deverá ser substituída por um **mapa observado de campos**, com evidência individual e status `HOMOLOGATED`, `OBSERVED_ONLY`, `AMBIGUOUS` ou `REJECTED`.

## 10. Gate

**GATE-FONTE-SED = RED/BLOCKED**

Este documento reduz incerteza sobre o que o Core já oferece, mas não reduz o requisito de homologação da fonte operacional SED.

**Não executar DDL de produção. Não criar parser SED específico. Não promover estruturas da Agenda a Grade Oficial.**