# 29 — Auditoria da Identidade Canônica de Turma e Componente v1

**Data:** 2026-09-09  
**Status:** 🟡 AUDITORIA CONCLUÍDA — MODELO DEFINIDO; DDL DE PRODUÇÃO BLOQUEADO

## 1. Objetivo

Fechar, por evidência do Core atual e dos contratos EIOS/Agenda, se já existe identidade física reutilizável para turma oficial e componente curricular antes de criar entidades acadêmicas para a Escala.

## 2. Evidências

A auditoria anterior confirmou `schools`, `school_years`, `academic_periods` e `teacher_profiles` no Core físico. Também confirmou que `agenda_classes` existe, mas possui natureza operacional da Agenda.

O contrato da grade oficial estabelece que `academic_classes` deve representar a turma institucional e que `academic_components` deve representar o componente curricular canônico. `agenda_classes` não possui versionamento institucional da grade e não deve ser promovida silenciosamente a essa função.

Os contratos EIOS possuem conceitos semânticos de `LEARNING_GROUP` e `ACADEMIC_COMPONENT`, e o contrato curricular permite `CurriculumNodeType = component`. Esses contratos comprovam semântica de domínio no software, mas não comprovam tabelas físicas equivalentes no PostgreSQL.

## 3. Decisão — turma

**Não há evidência suficiente para reutilizar `agenda_classes` como identidade oficial.**

A futura `academic_classes` deve possuir, no mínimo:

- `id`;
- `organization_id`;
- `school_id`;
- `school_year_id`;
- identificador oficial externo;
- código/nome oficial;
- etapa/ano/série;
- turno;
- status;
- origem/proveniência;
- validade/histórico;
- timestamps.

A identidade deve permitir associação determinística por escola + ano letivo + identificador oficial quando a fonte o fornecer.

## 4. Decisão — componente

**Não há entidade física canônica `subjects` ou `knowledge_areas` disponível para a Escala.**

`teacher_profiles.subjects[]`, `teacher_profiles.knowledge_area` e campos textuais da Agenda são atributos úteis para contexto, mas não devem funcionar como chave canônica de componente.

A futura `academic_components` deve possuir, no mínimo:

- `id`;
- organização quando o componente for local;
- código oficial quando existir;
- nome oficial;
- área de conhecimento;
- etapa de ensino;
- origem;
- referência curricular EIOS opcional e validada;
- status;
- metadados/proveniência;
- timestamps.

## 5. Canonização de importação

### Turma

Preferência:

1. identificador oficial da fonte;
2. identificador previamente homologado;
3. chave composta homologada por contexto acadêmico;
4. exceção manual.

### Componente

Preferência:

1. código oficial;
2. identificador curricular homologado;
3. chave composta homologada por contexto;
4. exceção manual.

São proibidos como mecanismo único de publicação:

- nome textual isolado;
- similaridade/fuzzy matching;
- posição na planilha;
- professor associado;
- escola isoladamente.

Estados: `resolved`, `ambiguous`, `unresolved`, `rejected`.

## 6. Integridade cruzada obrigatória

A turma deve pertencer à mesma escola, organização e ano letivo do registro de grade.

O componente deve ser compatível com a organização/contexto acadêmico da versão da grade.

A entrada oficial deve referenciar entidades canônicas por UUID, nunca depender apenas dos valores textuais importados.

## 7. EIOS × Core × Agenda

| Conceito | Fonte canônica | Papel |
|---|---|---|
| Organização | Core `organizations` | identidade institucional |
| Escola | Core `schools` | unidade |
| Ano letivo | Core `school_years` | contexto temporal |
| Período acadêmico | Core `academic_periods` | período |
| Docente | Core `teacher_profiles` + vínculo de identidade | domínio docente |
| Turma oficial | futura `academic_classes` | identidade acadêmica |
| Componente | futura `academic_components` | identidade curricular |
| Grupo da Agenda | `agenda_classes` | operacional/contextual |
| Currículo | EIOS curricular | referência pedagógica |
| Grade | futuras `official_schedule_*` | obrigação temporal |

## 8. Auditoria

### CLASS-AUD-01 — reutilização de `agenda_classes`
**Critical — FECHADO POR DECISÃO:** não reutilizar como identidade oficial.

### CLASS-AUD-02 — identidade oficial de turma
**Critical — ABERTO:** entidade física ainda inexistente.

### COMP-AUD-01 — entidade física de componente
**Critical — ABERTO:** entidade canônica ainda inexistente.

### COMP-AUD-02 — uso de texto como chave
**Critical — FECHADO POR REGRA:** não publicar somente por texto.

### CLASS-AUD-03 — integridade escola/ano
**High — DEFINIDO:** será FK + validação contextual.

### COMP-AUD-03 — referência curricular EIOS
**Medium — PENDENTE:** integração deve ser opcional e validada, sem tornar currículo dependência da grade.

## 9. Gate

A identidade acadêmica de turma e componente ainda bloqueia DDL de produção.

Antes de criar as tabelas físicas, deve ser homologado:

1. identificador real da fonte de grade;
2. estratégia de chave externa;
3. comportamento para alteração de turma;
4. catálogo oficial de componentes disponível para importação;
5. relacionamento opcional com EIOS curricular;
6. RLS e escopo institucional;
7. testes de matching e ambiguidades;
8. reprodução histórica.

## 10. Resultado

A auditoria fecha a decisão sem criar uma arquitetura paralela prematura:

**Turma oficial ≠ `agenda_classes`.**  
**Componente canônico ≠ texto de `subjects[]`/`agenda_lessons.subject`.**

O próximo avanço é especificar o contrato físico de `academic_classes` e `academic_components` com chaves, unicidade, versionamento e testes de integridade, ainda sem executar DDL remoto.
