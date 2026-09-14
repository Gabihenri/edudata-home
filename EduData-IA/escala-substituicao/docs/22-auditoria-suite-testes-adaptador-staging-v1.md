# Auditoria da Suite de Testes do Adaptador/Staging da Grade v1

**Data:** 2026-09-14  
**Status:** 🟡 AUDITORIA ATUALIZADA — CONTRATO E HOMOLOGAÇÃO SINTÉTICA AVANÇADOS, HOMOLOGAÇÃO OPERACIONAL BLOQUEADA

## 1. Objetivo

Auditar a evolução da suíte sintética derivada do contrato do adaptador/staging da Grade, mantendo a separação entre contrato comportamental, homologação sintética de banco e homologação de produção. Nenhum dado SED real foi utilizado e nenhuma publicação operacional foi realizada.

## 2. Evidência de implementação

Arquivo principal do contrato comportamental:

`EduData-IA/escala-substituicao/tests/adapter-staging-grade.contract.test.ts`

A suíte permanece autocontida e sintética. O contrato foi ampliado para cobrir, além dos cenários originais, identidade docente/turma/componente ausente, versionamento por alteração de professor/horário e guarda de publicação: somente uma versão explicitamente `published` pode seguir para consumo.

Também existem dois artefatos PostgreSQL sintéticos e isolados:

- `EduData-IA/escala-substituicao/tests/adapter-staging-grade.postgres.test.sql`
- `EduData-IA/escala-substituicao/tests/adapter-staging-grade.publication-gate.postgres.test.sql`

O segundo é deliberadamente isolado e cobre ADP-16 sem contaminar o harness principal. Ambos permanecem sem execução comprovada neste ambiente.

## 3. Matriz atual dos fixtures comportamentais

| Fixture | Cenário | Resultado esperado |
|---|---|---|
| F01–F10 | estrutura, matching, temporalidade, duplicidade, idempotência, nova versão e validade | conforme contrato |
| F13 | identidade docente ausente | blocked |
| F14 | identidade da turma ausente | blocked |
| F15 | identidade do componente ausente | blocked |
| F16 | versão publicada | publishable |
| F17 | versão validada, ainda não publicada | blocked |
| F18 | versão superada | blocked |
| F19 | versão revogada | blocked |

A ausência de F11/F12 no bloco de fixtures comportamentais não representa lacuna: esses cenários são tratados pelas regras de alteração de professor/horário e pelos guards de versionamento.

## 4. Testes de regra atualmente cobertos

A camada comportamental verifica:

- precedência de `unresolved` sobre `ambiguous` e `resolved`;
- precedência de `ambiguous` sobre `resolved`;
- regra de interseção temporal `A.start < B.end AND B.start < A.end`;
- intervalos encostados sem sobreposição;
- classificação determinística;
- ausência de identidade obrigatória bloqueia publicação;
- alteração de professor ou horário exige nova versão;
- mesma origem/hash mantém idempotência;
- somente estado `published` é consumível pelo downstream.

## 5. Achados atualizados

### ADP-TEST-01 — cobertura sintética
**Status:** FECHADO NO NÍVEL DE CONTRATO

Os cenários comportamentais previstos possuem representação explícita, incluindo os novos guards de identidade e publicação.

### ADP-TEST-02 — matching determinístico
**Status:** FECHADO NO NÍVEL DE CONTRATO

A precedência dos estados está protegida. A resolução contra entidades reais continua bloqueada até existir artefato técnico atual da SED e chaves homologadas.

### ADP-TEST-03 — ambiguidade não publica
**Status:** FECHADO NO NÍVEL DE CONTRATO

`ambiguous` produz revisão e `unresolved` produz bloqueio. Não existe fallback fuzzy para transformar incerteza em identidade canônica.

### ADP-TEST-04 — integridade temporal
**Status:** FECHADO NO NÍVEL DE CONTRATO / PARCIAL NO BANCO

A regra temporal está protegida na camada comportamental e representada no harness PostgreSQL sintético. Ainda não houve execução PostgreSQL comprovada neste ambiente.

### ADP-TEST-05 — idempotência
**Status:** FECHADO SINTETICAMENTE / NÃO HOMOLOGADO EM PRODUÇÃO

Há cobertura comportamental e estrutura PostgreSQL sintética para hash/origem. A homologação operacional depende de artefato real, chaves oficiais e execução controlada.

### ADP-TEST-06 — versionamento
**Status:** FECHADO SINTETICAMENTE / NÃO HOMOLOGADO EM PRODUÇÃO

Alterações de professor ou horário exigem nova versão; mesma origem/hash é idempotente. A persistência oficial permanece bloqueada pela fonte e identidade SED.

### ADP-TEST-07 — proveniência
**Status:** PARCIAL

O modelo de staging já define a cadeia `source → batch → row → matching → version → occurrence → snapshot/engine run`, mas sua homologação física e operacional depende de fonte real e execução controlada.

### ADP-TEST-08 — execução automatizada
**Status:** NÃO COMPROVADA

Existem harnesses SQL e scripts de preflight/regressão, porém não há evidência registrada de execução PostgreSQL bem-sucedida no ambiente atual. Não declarar PASS sem execução real.

### ADP-TEST-09 — dados reais
**Status:** BLOQUEADO

Não existe ainda artefato operacional atual da SED homologado para Grade/Associação. O `GATE-FONTE-SED` permanece `RED/BLOCKED`.

### ADP-TEST-10/11/12/13 — integridade, versionamento e validade
**Status:** COBERTOS SINTETICAMENTE

Os guards correspondentes estão representados na suíte TypeScript e no harness PostgreSQL sintético, sem promover os dados a entidades canônicas.

### ADP-TEST-16 — publicação
**Status:** GUARDA SINTÉTICA ISOLADA

Existe harness PostgreSQL específico para comprovar que apenas `published` entra no conjunto consumível e que `draft`, `validated`, `superseded` e `revoked` permanecem fora dele. Isso não constitui homologação da semântica de publicação da SED.

## 6. Auditoria de segurança

- Nenhum dado real da SED foi incluído nos fixtures.
- Nenhuma tabela de produção foi criada ou alterada pela Escala nesta etapa.
- Nenhum DDL de produção foi executado.
- Nenhuma regra de RLS foi relaxada.
- Nenhum identificador SED foi inferido por nome, CPF, posição, e-mail ou dado histórico.
- Nenhuma versão `validated` foi tratada como publicação oficial.
- O harness de publicação é isolado do runner geral.

## 7. Limites conhecidos

Continuam fora da homologação operacional:

1. importação de CSV/XLSX real atual da SED;
2. dicionário/layout oficial do artefato;
3. chaves oficiais de professor, turma e componente;
4. relacionamento oficial Associação ↔ Grade;
5. validade e versionamento oficiais;
6. proveniência e autoridade da extração;
7. publicação oficial da Grade;
8. RLS e constraints sobre entidades canônicas ainda inexistentes no Core;
9. reconciliação temporal com ocorrência real;
10. execução PostgreSQL comprovada do conjunto de harnesses;
11. integração do artefato homologado ao motor de substituição.

## 8. Gate atual

**NÃO LIBERAR DDL DE PRODUÇÃO.**

O contrato e os harnesses sintéticos avançaram, mas o banco real não deve receber entidades acadêmicas ou parser específico da SED enquanto o artefato técnico atual não estiver homologado.

O schema físico atual do Core fornece identidade institucional, escolas, perfis, calendário, governança e Agenda, mas não comprova as entidades canônicas de Grade necessárias à Escala. `agenda_classes`, `agenda_lessons` e `agenda_schedule_templates` não devem ser reinterpretadas como Grade SED por inferência.

## 9. Próximo avanço autorizado

Obter um pequeno artefato técnico operacional atual da SED, preferencialmente XLSX/CSV de:

- Associação do Professor à Classe;
- Grade Horária;
- Relatório Grade Horária;

acompanhado do contexto de aquisição e, quando disponível, dicionário/layout.

Ao receber o artefato:

`preservar original → registrar proveniência/hash → mapear campos → homologar IDs/chaves → validar vigência → gerar fixture sanitizado → reconciliar temporalmente → executar R01–R14 → especificar DDL físico`

## 10. Regra permanente

`Definir → Implementar → Auditar → Corrigir → Validar → Registrar → Avançar`

A evolução desta suíte **não** significa que a Grade esteja pronta para alimentar o motor de substituição. O `GATE-FONTE-SED` permanece `RED/BLOCKED` até evidência técnica atual e homologada.
