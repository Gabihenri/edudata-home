# Auditoria do Harness Ocorrência → Vaga v1

**Projeto:** Escala de Substituição  
**Repositório:** `Gabihenri/edudata-home`  
**Branch:** `main`  
**Arquivo auditado:** `EduData-IA/escala-substituicao/tests/occurrence-vacancy.postgres.test.sql`  
**Commit do harness:** `c10a8b57b6a4e357b2c3d0384e3a563859e8728f`  
**Data:** 2026-09-10

## 1. Objetivo

Validar estruturalmente o contrato entre a obrigação oficial de aula, a ausência docente e a geração de vaga de substituição, sem alterar o banco de produção.

Fluxo coberto:

`official_schedule_occurrence → confirmed_absence → substitution_vacancy`

O harness é sintético, isolado em `escala_vacancy_test` e termina com `ROLLBACK`.

## 2. Controles auditados

| ID | Controle | Resultado | Evidência no harness |
|---|---|---|---|
| VAC-AUD-01 | Somente ocorrência derivada de versão publicada é elegível | 🟢 | `VAC-01`, `VAC-08` |
| VAC-AUD-02 | Ausência confirmada deve cobrir temporalmente a ocorrência | 🟢 | `VAC-02`, `VAC-09` |
| VAC-AUD-03 | Ausência pendente não gera vaga | 🟢 | `VAC-04` |
| VAC-AUD-04 | Ausência cancelada não gera vaga ativa | 🟢 | `VAC-05` |
| VAC-AUD-05 | Mesma ocorrência + mesma ausência é idempotente | 🟢 | `VAC-03` + `UNIQUE (occurrence_id, absence_id)` |
| VAC-AUD-06 | Uma ocorrência não pode possuir duas vagas ativas | 🟢 | índice parcial `vacancies_one_active_per_occurrence` + `VAC-06` |
| VAC-AUD-07 | Vaga preserva proveniência da ocorrência, ausência e versão | 🟢 | `VAC-07` |
| VAC-AUD-08 | Organização e escola permanecem no mesmo escopo | 🟢 | `VAC-10` |
| VAC-AUD-09 | Harness é não destrutivo | 🟢 | schema sintético + `ROLLBACK` |
| VAC-AUD-10 | Execução real em PostgreSQL | 🔴 | não executada neste ambiente |
| VAC-AUD-11 | Integração com tabela/contrato físico de vagas de produção | 🔴 | ainda inexistente/homologação pendente |
| VAC-AUD-12 | Integração com ocorrência oficial real da SEDUC-SP | 🔴 | fonte técnica operacional ainda não homologada |

## 3. Decisões estruturais validadas

### 3.1 A ocorrência é a obrigação primária

A vaga não deve nascer de uma ausência isolada. A ausência só produz uma necessidade de substituição quando existe uma ocorrência oficial publicada que ela efetivamente cobre.

### 3.2 Idempotência por origem

A combinação `(occurrence_id, absence_id)` é única. Isso impede a duplicação da mesma relação de origem em reprocessamentos.

Além disso, o índice parcial:

`UNIQUE (occurrence_id) WHERE status = 'active'`

protege a invariável de que uma única obrigação de aula não tenha duas vagas ativas simultaneamente.

### 3.3 Proveniência obrigatória

A vaga mantém referência para:

- ocorrência;
- ausência;
- organização;
- escola;
- versão da grade que originou a ocorrência.

Isso permite reconstruir a cadeia decisória posteriormente no mecanismo de auditoria central.

### 3.4 Estados da ausência

Somente `confirmed` pode produzir vaga. `pending` e `cancelled` não produzem vaga ativa.

O harness deliberadamente não transforma uma ausência pendente em decisão definitiva.

## 4. Limitações do harness

Este arquivo **não é migration de produção** e não comprova que o modelo físico final já esteja pronto.

Também não resolve:

1. o artefato técnico real da Grade Horária/Associação Professor–Classe da SEDUC-SP;
2. os identificadores oficiais de docente, turma e componente curricular;
3. a homologação do vínculo Auth → `teacher_profiles`;
4. o catálogo de permissões do produto Escala;
5. RLS de produção;
6. o contrato físico definitivo de `substitution_vacancies`;
7. execução do SQL em uma instância PostgreSQL real;
8. regras de atualização/cancelamento de uma vaga já criada quando a ausência for posteriormente cancelada;
9. ausências parciais, múltiplos intervalos no mesmo dia e regras administrativas excepcionais;
10. integração com o motor de candidatos, pontuação e alocação.

## 5. Gate

**STATUS: 🔴 RED / BLOCKED**

O contrato lógico `ocorrência oficial → ausência confirmada → vaga` está estruturalmente coberto por harness sintético, mas não deve ser promovido a produção.

### Bloqueios críticos atuais

- fonte técnica real da grade SEDUC-SP ainda não homologada;
- identificadores oficiais de docente/turma/componente ainda não homologados;
- execução PostgreSQL real ainda pendente;
- contrato físico de produção de vagas ainda pendente;
- RLS/permissões específicas do produto Escala ainda pendentes.

## 6. Próximo passo seguro

Avançar para a especificação/auditoria do **contrato físico da vaga de substituição**, mantendo a separação entre:

`ocorrência oficial → ausência → vaga → candidatos → alocação`

Sem criar DDL de produção até que os bloqueios críticos sejam fechados.
