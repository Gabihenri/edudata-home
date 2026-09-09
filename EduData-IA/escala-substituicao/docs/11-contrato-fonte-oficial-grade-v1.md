# Contrato da Fonte Oficial de Grade — Escala de Substituição v1

**Status:** definição arquitetural v1 — sem DDL executável  
**Data:** 2026-09-09

## 1. Decisão

A Escala de Substituição precisa de uma fonte oficial e versionável para responder, de forma determinística:

> Qual docente, turma, componente curricular, dia e intervalo de horário constituem a aula que ficou vaga?

O banco atual não possui `public.schedules`. As estruturas da Agenda não serão promovidas implicitamente a esse papel.

A fonte oficial deverá ser tratada como **registro de grade institucional**, distinta de eventos pessoais da Agenda.

## 2. Requisitos mínimos

Cada ocorrência de aula elegível para substituição deverá permitir determinar:

- `organization_id`;
- `school_id`;
- docente titular (`teacher_id`/referência de identidade equivalente);
- turma;
- componente curricular/disciplina;
- data ou regra de recorrência que permita materializar a data;
- horário inicial;
- horário final;
- período/turno, quando aplicável;
- situação ativa/inativa;
- vigência da grade;
- versão da grade;
- origem do dado;
- data de importação/publicação;
- responsável pela publicação ou validação.

## 3. Separação semântica obrigatória

### Grade institucional

Define a obrigação/aula prevista oficialmente para a escola.

### Agenda Inteligente EDI

Registra planejamento, eventos, aulas operacionais, evidências, reflexões e exceções do trabalho docente.

### Escala de Substituição

Usa a grade institucional como fonte primária para identificar a vaga e consulta Agenda/identidade/impedimentos como fontes complementares.

Portanto:

```text
GRADE OFICIAL
    ↓
AULA PREVISTA
    ↓
AUSÊNCIA CONFIRMADA
    ↓
VAGA
    ↓
REGRAS + IMPEDIMENTOS
    ↓
CANDIDATOS
    ↓
RANKING
    ↓
DECISÃO HUMANA
```

## 4. O que não pode ser usado como substituto automático

### `agenda_schedule_templates`

A implementação atual trata esses registros como modelos pertencentes ao usuário e os utiliza para gerar `agenda_events`. O próprio serviço verifica a propriedade do template e aplica recorrência/validade antes de criar eventos.

Isso caracteriza um mecanismo de **automação da agenda do usuário**, não uma publicação institucional da grade escolar.

### `agenda_lessons`

Possui data, horário, turma, componente e usuário, mas integra o ciclo operacional da Agenda. Não há evidência suficiente para afirmar que todo registro representa a grade oficial institucional nem que a ausência de um registro represente uma vaga administrativa.

### `agenda_events`

É ainda mais inadequado como fonte primária de grade: representa eventos, recorrências, exceções e outros compromissos. Um evento de Agenda pode ser impedimento ou contexto, mas não deve ser interpretado automaticamente como aula oficial.

## 5. Opções arquiteturais avaliadas

### Opção A — nova entidade oficial de grade no Core

Criar uma estrutura institucional própria para grade, versionada e com escopo organização/escola.

**Vantagens:** semântica correta, histórico, publicação explícita, importação controlada e base sólida para o motor.

**Risco:** exige modelagem e integração adicionais antes do MVP completo.

### Opção B — adaptar uma entidade existente

Reaproveitar `agenda_lessons` ou outra estrutura atual.

**Decisão:** não recomendada neste momento, pois mistura ciclo operacional da Agenda com fonte oficial administrativa e pode gerar falsos conflitos ou falsas vagas.

### Opção C — fonte externa/importada

Receber uma grade oficial produzida pela escola/rede e materializá-la em uma estrutura própria da Escala/Core.

**Decisão:** viável e compatível com o ecossistema, desde que o importador preserve origem, versão, vigência, hash/identificador do lote e responsável pela validação.

## 6. Decisão para implementação

Adotar a combinação **A + C**:

1. existir uma representação institucional própria da grade;
2. permitir carga inicial por importação;
3. versionar cada publicação;
4. manter a origem do arquivo/sistema;
5. não sobrescrever silenciosamente uma versão já publicada;
6. permitir correção por nova versão;
7. somente uma versão explicitamente publicada poderá alimentar o motor em produção.

A forma física exata (`school_schedule`, `institutional_schedules` ou outro nome) ainda não deve ser fixada até a reconciliação final do Core e das fontes de dados existentes.

## 7. Contrato de publicação

Uma grade somente poderá ser considerada `publicada` quando:

- pertencer a uma organização/escola válida;
- possuir vigência;
- possuir versão única dentro do escopo;
- passar pelas validações estruturais;
- não possuir intervalos impossíveis;
- não possuir duplicidades incompatíveis;
- possuir docentes/turmas/componentes resolvidos ou exceções explicitamente registradas;
- registrar autor/responsável pela publicação;
- gerar evidência de auditoria.

## 8. Versionamento

Uma correção de grade não altera retroativamente a interpretação histórica de uma substituição confirmada.

Modelo:

```text
Grade v1 — publicada
       ↓
substituição confirmada
       ↓
Grade v2 — publicada posteriormente
       ↓
novas execuções usam v2
       ↓
histórico continua apontando para v1
```

Cada `engine_run` da Escala deverá registrar a versão da grade usada na execução.

## 9. Integração com Agenda

A Agenda poderá fornecer sinais complementares:

- eventos que bloqueiem disponibilidade;
- aulas já registradas;
- exceções/reschedule;
- compromissos institucionais;
- contexto pedagógico.

Mas o motor deverá distinguir explicitamente:

`grade oficial` ≠ `evento de agenda` ≠ `impedimento`.

Um evento só poderá bloquear um candidato quando uma regra de impedimento configurada determinar isso.

## 10. Auditoria

### AUD-GRADE-01 — fonte oficial

**Resultado:** BLOQUEADO até existir entidade/fonte institucional formal.

### AUD-GRADE-02 — separação Agenda × Grade

**Resultado:** APROVADO.

As estruturas da Agenda não serão tratadas como grade oficial por inferência.

### AUD-GRADE-03 — versionamento

**Resultado:** REQUISITO OBRIGATÓRIO.

A execução do motor deverá identificar a versão da grade utilizada.

### AUD-GRADE-04 — origem/proveniência

**Resultado:** REQUISITO OBRIGATÓRIO.

Importações devem manter origem, lote/identificador, validação e responsável.

### AUD-GRADE-05 — histórico

**Resultado:** REQUISITO OBRIGATÓRIO.

Alterações posteriores não podem reescrever silenciosamente decisões já confirmadas.

## 11. Critério de liberação

A migration da Escala só poderá sair de `DRAFT` quando houver:

1. entidade física oficial de grade definida;
2. contrato de importação/publicação definido;
3. relações com identidade, escola, turma e componente curricular validadas;
4. estratégia de versionamento validada;
5. RLS da grade definido;
6. auditoria de publicação definida;
7. integração do motor com a versão publicada definida;
8. testes de conflito temporal reproduzíveis.

**Conclusão:** a fonte oficial da grade é agora um requisito arquitetural explícito, e não uma dependência implícita do legado `schedules`.
