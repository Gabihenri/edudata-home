# Auditoria do Schema Core × Escala v1

**Data da auditoria:** 2026-09-16  
**Projeto Supabase:** EduData IA (`ihchzfndmdwtoabttkil`)  
**Status:** OBSERVAÇÃO DE SCHEMA — NÃO EXECUTAR DDL DA ESCALA

## 1. Objetivo

Registrar o estado físico observado do banco compartilhado antes de qualquer migration da Escala Inteligente de Substituição.

A auditoria existe para separar:

- o que já existe fisicamente;
- o que pode ser reutilizado;
- o que existe apenas na Agenda e não deve ser promovido a fonte oficial da grade;
- o que ainda depende da homologação do artefato operacional SED.

Nenhuma conclusão deste documento transforma uma estrutura observada em contrato oficial da SED.

## 2. Resultado executivo

O banco compartilhado possui uma fundação institucional relevante, com RLS presente nas tabelas observadas, incluindo organização, escola, perfil docente, calendário, identidade e governança.

Entretanto, a auditoria **não encontrou no schema público observado tabelas canônicas chamadas `classes`, `subjects` ou `schedules`**. Existem estruturas relacionadas na Agenda, como `agenda_classes`, `agenda_lessons` e `agenda_schedule_templates`, mas elas não devem ser tratadas automaticamente como a Grade Horária oficial da SED.

Também existe `teacher_profiles`, porém a estrutura observada não comprova a existência de identificadores técnicos oficiais da SED nem o contrato de Associação do Professor à Classe.

Portanto:

> **O Core físico existente não elimina o GATE-FONTE-SED.**

## 3. Estruturas observadas relevantes

| Necessidade da Escala | Estrutura observada | Situação |
|---|---|---|
| organização | `organizations` | EXISTE |
| escola | `schools` | EXISTE |
| vínculo institucional | `organization_members` | EXISTE |
| identidade/roles | `user_profiles`, `identity_roles` | EXISTE |
| escopo de responsabilidade | `identity_responsibility_scopes` | EXISTE |
| permissões por produto | `identity_product_permissions` | EXISTE |
| perfil docente | `teacher_profiles` | EXISTE |
| auditoria | `identity_audit_logs` | EXISTE |
| governança/auditoria | `eios_governance_audit_events` | EXISTE |
| proveniência | `eios_governance_provenance_records` | EXISTE |
| decisões | `eios_governance_decision_records` | EXISTE |
| ano letivo | `school_years` | EXISTE |
| períodos letivos | `academic_periods` | EXISTE |
| calendário institucional | `institutional_calendar_events` | EXISTE |
| exceções de funcionamento | `school_calendar_exceptions` | EXISTE |
| horários operacionais da escola | `school_operating_hours` | EXISTE |
| aulas da Agenda | `agenda_lessons` | EXISTE — NÃO É GRADE SED HOMOLOGADA |
| turmas da Agenda | `agenda_classes` | EXISTE — NÃO É IDENTIDADE ACADÊMICA SED HOMOLOGADA |
| modelos de horário da Agenda | `agenda_schedule_templates` | EXISTE — NÃO É GRADE SED HOMOLOGADA |
| `classes` canônica | não observada | GAP |
| `subjects` canônica | não observada | GAP |
| `schedules` canônica | não observada | GAP |
| Associação Professor–Classe SED | não observada | GAP / E3 |
| Grade Horária SED publicada | não observada | GAP / E3 |

## 4. Identidade docente

`teacher_profiles` possui UUID interno, nome, e-mail, escola, organização, área, etapa de ensino, componentes em texto e registro profissional.

Isso é suficiente para reconhecer que existe um perfil docente no Core, mas **não é suficiente para homologar a identidade operacional SED**.

Não deve ser criado nenhum vínculo do tipo:

```text
teacher_profiles.id = algum ID SED
```

sem evidência documental/operacional que demonstre essa relação.

Também não devem ser usados nome, CPF, posição de coluna, e-mail ou outros atributos auxiliares como substitutos de uma chave oficial não homologada.

## 5. Agenda não substitui Grade Oficial

O schema possui estruturas de Agenda com informações temporais e acadêmicas, inclusive `agenda_lessons` com data, início, fim, turma e escola.

Essas estruturas podem servir como contexto operacional quando autorizado pelo contrato do produto, mas não podem ser promovidas silenciosamente a:

- Grade Horária oficial;
- Associação do Professor à Classe;
- identidade oficial de turma/componente;
- versão publicada da grade SED.

A distinção permanece:

```text
GRADE OFICIAL SED
       ≠
AGENDA EDI
       ≠
IMPEDIMENTO/DISPONIBILIDADE
```

## 6. Calendário

O Core já possui `school_years`, `academic_periods`, `institutional_calendar_events`, `school_operating_hours` e `school_calendar_exceptions`.

Essas estruturas são úteis para o contexto temporal da Escala, mas não resolvem a lacuna da relação:

```text
professor + classe + componente + horário oficial + vigência + publicação
```

Essa relação continua dependente da homologação da fonte operacional SED.

## 7. Auditoria e governança

Foi observada uma fundação física de governança mais madura do que o modelo lógico original pressupunha, incluindo:

- `identity_roles`;
- `identity_responsibility_scopes`;
- `identity_product_permissions`;
- `identity_audit_logs`;
- `eios_governance_audit_events`;
- `eios_governance_provenance_records`;
- `eios_governance_decision_records`.

Isso reforça a decisão arquitetural de **reutilizar o Core/EIOS**, em vez de criar um segundo sistema de identidade, autorização, auditoria ou proveniência.

A forma exata de integração da Escala com essas estruturas ainda deve ser definida contra as funções, policies e contratos efetivamente aplicados, sem inventar nomes de funções ou permissões.

## 8. Implicações para o modelo da Escala

O modelo lógico existente continua válido como modelo de domínio, mas suas referências físicas devem ser tratadas como **dependências a reconciliar**, não como FKs já aprovadas.

Especialmente:

```text
substitution_vacancies.schedule_id
substitution_vacancies.class_id
substitution_vacancies.subject_id
```

não devem receber FKs de produção enquanto não forem conhecidos os objetos canônicos que representarão essas entidades no schema final.

Da mesma forma, referências de `teacher_id` devem ser revisadas à luz do contrato de identidade docente homologado.

## 9. Gate atualizado

### Verde

- organização/escola no Core;
- identidade e governança compartilhadas;
- calendário institucional;
- RLS presente nas estruturas observadas;
- auditoria/proveniência disponíveis no Core/EIOS.

### Amarelo

- estruturas da Agenda que podem fornecer contexto operacional;
- `teacher_profiles` como perfil interno, ainda sem equivalência SED homologada.

### Vermelho

- identidade acadêmica SED;
- Associação Professor–Classe atual;
- Grade Horária oficial atual;
- chaves técnicas SED;
- vigência/versionamento da relação professor–classe–componente;
- regra de publicação/consumo da versão oficial;
- parser de produção;
- migration física da Escala.

## 10. Próxima ação autorizada

Obter um pequeno artefato operacional atual e autorizado da SED, preferencialmente:

1. exportação da Associação do Professor à Classe;
2. exportação/relatório da Grade Horária;
3. dicionário/layout correspondente;
4. contexto de aquisição e proveniência.

Quando o artefato chegar:

```text
RAW ORIGINAL
   ↓
PROVENIÊNCIA + HASH
   ↓
DICIONÁRIO
   ↓
IDENTIDADE / CHAVES
   ↓
VIGÊNCIA / VERSIONAMENTO
   ↓
MATCHING
   ↓
FIXTURE SANITIZADO
   ↓
RECONCILIAÇÃO TEMPORAL
   ↓
R01–R16
   ↓
ESPECIFICAÇÃO FÍSICA
```

A execução de R01–R16 sobre um artefato real não transforma a fonte em oficial por si só; o `GATE-FONTE-SED` permanece condicionado à homologação de identidade, chaves, vigência, publicação e proveniência.

## 11. Decisão

Esta auditoria **não autoriza migration, parser, API ou alteração das estruturas compartilhadas**.

Ela confirma que já é possível auditar o Core físico diretamente, mas também confirma que o Core atual não contém evidência suficiente para substituir o artefato operacional SED exigido pelo projeto.

**GATE-FONTE-SED = RED/BLOCKED.**

**Nenhuma chave acadêmica SED deve ser inferida a partir do schema atual.**
