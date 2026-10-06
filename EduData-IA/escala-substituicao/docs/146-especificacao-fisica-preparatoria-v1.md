# 146 — Especificação Física Preparatória da Escala de Substituição v1

**Status:** PREPARATÓRIA / SEM DDL DE PRODUÇÃO  
**GATE-FONTE-SED:** RED / BLOCKED  
**Data:** 06/10/2026  
**Base:** contratos 113–115, auditoria Core, matriz de reconciliação e regressão R01–R16

## 1. Objetivo

Definir a forma física-alvo da Escala de Substituição sem inventar IDs, FKs ou campos da SED antes da homologação do artefato E3.

Esta especificação é deliberadamente **pré-DDL**. Ela separa:

- identidade institucional já existente no Core;
- ingestão e preservação da fonte SED;
- identidade acadêmica ainda não homologada;
- ocorrência operacional;
- ausência e necessidade de cobertura;
- candidatos e alocação;
- decisão humana;
- snapshots, rodadas e auditoria.

Nenhuma tabela, coluna ou chave descrita como `SED_*` neste documento deve ser criada em produção antes do E3.

## 2. Princípio físico

O modelo deverá preservar a cadeia:

```
SOURCE ARTIFACT
    ↓
RAW / IMMUTABLE
    ↓
NORMALIZED
    ↓
MATCHED / RECONCILED
    ↓
PUBLISHED ACADEMIC CONTEXT
    ↓
OCCURRENCE
    ↓
ABSENCE
    ↓
VACANCY
    ↓
CANDIDATES
    ↓
GLOBAL ALLOCATION
    ↓
HUMAN DECISION
    ↓
EFFECTIVE SUBSTITUTION
```

A camada seguinte não pode apagar a evidência da camada anterior.

## 3. Domínios físicos

### 3.1 Core compartilhado

Reutilizar, quando aplicável e já homologado no Core:

- organização;
- escola;
- usuário;
- perfil docente;
- ano letivo;
- períodos acadêmicos;
- calendário institucional;
- governança;
- auditoria;
- proveniência.

Não duplicar essas entidades no produto sem justificativa arquitetural.

### 3.2 Fonte e staging

Domínio destinado a preservar o artefato recebido e permitir análise/reconciliação sem promovê-lo automaticamente a dado operacional.

Entidades-alvo conceituais:

| Entidade | Finalidade | Estado |
|---|---|---|
| source_artifact | registrar cada arquivo/lote recebido | pode ser especificada |
| source_artifact_hash | integridade do bruto | pode ser especificada |
| source_record_raw | preservar registros originais | depende do formato |
| source_field_observation | registrar campos observados | preparatória |
| source_mapping | mapear campo observado para conceito | bloqueado por E3 |
| source_identity_match | registrar matching com Core | bloqueado por E3 |
| source_publication_state | estado de publicação da fonte | bloqueado por E3 |

O armazenamento do bruto deve preservar o formato original e permitir reconstrução.

### 3.3 Contexto acadêmico homologado

Somente após E3:

| Conceito | Papel |
|---|---|
| professor acadêmico SED | identidade oficial da fonte |
| classe/turma/subturma | identidade acadêmica oficial |
| componente curricular | identidade oficial |
| associação professor–classe | vínculo oficial |
| horário | horário associado |
| grade | estrutura/versionamento da grade |
| vigência | intervalo de validade |
| publicação | estado efetivamente publicado |

As chaves físicas serão definidas somente após a ficha 114.

### 3.4 Operação de substituição

Entidades-alvo conceituais:

- occurrence;
- absence;
- vacancy;
- candidate_evaluation;
- allocation_round;
- allocation_plan;
- allocation_item;
- human_decision;
- effective_substitution.

## 4. Contratos de identidade

### 4.1 Identidade institucional

A identidade interna do EduData IA permanece no Core.

Exemplo conceitual:

```
Core school
Core user
Core teacher_profile
```

### 4.2 Identidade acadêmica SED

A identidade acadêmica deverá ser armazenada separadamente até homologação.

Regra:

```
Core teacher_profile.id
        ≠
SED teacher identifier
```

A igualdade somente poderá existir se a fonte e a relação forem explicitamente homologadas.

### 4.3 Matching

O matching deverá registrar:

- fonte;
- registro de origem;
- conceito comparado;
- identificador da fonte;
- identificador interno, quando houver;
- método de matching;
- evidência;
- confiança;
- estado;
- operador/processo responsável;
- timestamp;
- versão.

Não são métodos autorizados de identificação oficial:

- nome isolado;
- CPF;
- e-mail;
- posição de coluna;
- descrição textual;
- coincidência de horário;
- nome da disciplina;
- nome da turma.

## 5. Ocorrência

A entidade `occurrence` representa uma aula temporalmente determinada e reconciliada.

Campos conceituais mínimos:

| Campo | Finalidade |
|---|---|
| occurrence_id | identidade interna da ocorrência |
| school_id | escola do Core |
| school_year_id | ano letivo |
| academic_context_ref | referência acadêmica homologada |
| teacher_assignment_ref | associação docente homologada |
| calendar_ref | calendário aplicável |
| grade_ref | versão da Grade usada |
| schedule_ref | horário usado |
| effective_start | início da validade/ocorrência |
| effective_end | fim, quando aplicável |
| source_artifact_ref | proveniência |
| source_version_ref | versão da fonte |
| reconciliation_state | estado da reconciliação |
| completeness_state | completude |
| immutable_snapshot_ref | snapshot utilizado |

A ocorrência não deve ser criada diretamente a partir de uma linha bruta.

## 6. Temporalidade

Toda ocorrência deverá ser vinculada ao contexto temporal que a produziu.

Regras:

1. alteração material da Grade não sobrescreve silenciosamente uma ocorrência histórica;
2. nova versão gera nova referência/snapshot conforme o contrato;
3. uma ocorrência utilizada em uma rodada deve permitir reconstrução posterior;
4. o timestamp de aquisição da fonte não substitui a vigência acadêmica;
5. uma regra temporal da SED só pode virar regra física quando homologada.

## 7. Ausência e vaga

Separar semanticamente:

```
absence
    ≠
vacancy
```

Uma ausência confirmada pode gerar uma necessidade de cobertura, mas uma ausência pendente/cancelada não deve gerar vaga operacional ativa.

A vaga deve referenciar:

- occurrence;
- ausência confirmada;
- intervalo temporal;
- estado;
- motivo;
- snapshot da ocorrência;
- proveniência.

A invariância de unicidade de ocorrência/ausência deve ser preservada.

## 8. Elegibilidade e alocação

A avaliação de candidato deve ser reproduzível e separada da decisão humana.

Fluxo físico-alvo:

```
vacancy
  ↓
candidate_evaluation
  ↓
hard_constraints
  ↓
score
  ↓
allocation_plan
```

Restrições duras têm precedência absoluta sobre score.

O plano global deve obedecer:

1. maximizar cobertura;
2. maximizar qualidade entre planos com mesma cobertura;
3. aplicar critérios secundários homologados;
4. desempate determinístico.

O mesmo professor não pode ser alocado em ocorrências temporalmente incompatíveis.

## 9. Rodadas e snapshots

A rodada deve identificar:

- versão da execução;
- snapshot de entrada;
- conjunto de vagas;
- conjunto de candidatos;
- regras/pesos utilizados;
- plano calculado;
- resultado;
- estado;
- timestamp;
- executor;
- assinatura determinística.

Uma alteração material deve impedir confirmação baseada em snapshot obsoleto e exigir nova execução conforme o contrato.

O plano algorítmico original deve permanecer imutável.

## 10. Decisão humana

A decisão humana não substitui nem apaga o plano algorítmico.

Modelo:

```
allocation_plan
      ↓
human_decision
      ↓
effective_substitution
```

Um override deve preservar:

- plano original;
- item alterado;
- decisão humana;
- motivo;
- autor;
- timestamp;
- estado anterior;
- estado posterior;
- justificativa.

Isso permite reconstrução histórica e auditoria.

## 11. Estados mínimos

Estados conceituais, sujeitos a refinamento após E3:

### Fonte

```
RECEIVED
PRESERVED
ANALYZING
MAPPED
RECONCILED
PUBLISHED
REJECTED
```

### Reconciliação

```
RESOLVED
AMBIGUOUS
UNRESOLVED
SOURCE_UNCERTAIN
BLOCKED
```

### Ocorrência

```
DRAFT
RECONCILED
PUBLISHED
INVALIDATED
SUPERSEDED
```

### Vaga

```
OPEN
ALLOCATED
PARTIALLY_COVERED
UNCOVERED
CANCELLED
```

### Rodada

```
CALCULATED
AWAITING_HUMAN_VALIDATION
CONFIRMED
INVALIDATED
SUPERSEDED
```

Esses valores não constituem DDL autorizado; são vocabulário preparatório.

## 12. Integridade e invariantes

O desenho físico deverá garantir, após homologação:

- ocorrência vinculada a escola/ano compatíveis;
- ausência válida temporalmente;
- uma vaga ativa por ocorrência/ausência quando aplicável;
- nenhuma alocação violando restrição dura;
- nenhum professor reutilizado em intervalos incompatíveis;
- plano global reproduzível;
- desempate determinístico;
- plano algorítmico imutável;
- override separado;
- rodada histórica reconstruível;
- mudança material invalida confirmação baseada em snapshot antigo;
- proveniência preservada até a decisão efetiva.

Esses invariantes são sustentados pela cobertura sintética R01–R16 e pelos harnesses PostgreSQL já auditados; a homologação E3 continua independente.

## 13. RLS e governança

A implementação física deverá reutilizar o modelo de autorização do Core e aplicar least privilege.

Princípios:

- professor não vê automaticamente dados operacionais de outros professores;
- coordenador acessa apenas o escopo institucional/de subordinados autorizado;
- direção acessa indicadores institucionais conforme escopo;
- decisão humana exige identidade do decisor;
- auditoria não deve depender da confiança do cliente;
- dados brutos SED devem ter acesso restrito;
- artefatos contendo dados pessoais não devem ser públicos.

Nenhuma política RLS nova será criada neste documento.

## 14. Índices físicos — preparação

Após homologação, avaliar índices para:

- escola + ano letivo;
- ocorrência + intervalo temporal;
- professor + intervalo temporal;
- vaga + estado;
- rodada + versão;
- snapshot + hash;
- proveniência + artefato;
- matching + estado;
- decisão + ocorrência.

Os índices finais devem ser definidos com base na cardinalidade real do E3 e nos planos de consulta observados.

## 15. Constraints — preparação

Após E3, validar constraints para:

- unicidade de identidade da fonte;
- integridade de relacionamento;
- intervalos temporais válidos;
- unicidade de ocorrência/vaga;
- não duplicação de plano;
- imutabilidade lógica de rodada;
- separação entre plano e override;
- referência obrigatória à proveniência.

Não definir FKs acadêmicas SED antes da homologação das chaves.

## 16. R01–R16 e modelo físico

A implementação física deverá manter rastreabilidade explícita entre cada regra e sua entidade/constraint/teste.

| Grupo | Dependência física principal |
|---|---|
| R01–R02 | ocorrência, candidato, alocação |
| R03 | intervalos temporais |
| R04–R05 | elegibilidade/cobertura |
| R06–R08 | score, pesos, explicabilidade |
| R09–R12 | snapshot, rodada, decisão |
| R13–R14 | invalidação/reexecução |
| R15 | multiplicidade de ocorrência |
| R16 | associação × responsabilidade |

A matriz final R01–R16 permanece a fonte de comportamento; esta especificação apenas prepara a tradução física.

## 17. O que pode ser implementado agora

Sem desbloquear o E3, podem continuar:

- contratos;
- fixtures sintéticos;
- testes PostgreSQL;
- regras de alocação;
- snapshots;
- rodadas;
- explicabilidade;
- auditoria;
- guards TypeScript;
- harnesses isolados;
- documentação;
- protótipo operacional sintético.

## 18. O que continua bloqueado

Não autorizado nesta etapa:

- DDL produtivo das entidades acadêmicas SED;
- FK para ID SED não homologado;
- parser produtivo;
- sincronização produtiva;
- endpoint de integração oficial;
- publicação de ocorrência oficial;
- atribuição automática oficial;
- substituição de identificador oficial por campo aproximado.

## 19. Critério de passagem para DDL

A passagem para DDL somente poderá ocorrer quando:

- E3 real estiver preservado;
- ficha 114 estiver preenchida;
- identidades críticas estiverem homologadas;
- chaves estiverem comprovadas;
- cardinalidades estiverem documentadas;
- vigência/versionamento estiverem comprovados;
- publicação estiver compreendida;
- fixture sanitizada estiver disponível;
- reconciliação temporal estiver validada;
- R01–R16 forem executados sobre a fixture reconciliada;
- auditoria não apresentar bloqueio crítico;
- houver autorização explícita para DDL.

## 20. Próximo passo

O próximo avanço técnico não é criar tabelas de produção.

É produzir, assim que o E3 chegar:

```
artefato bruto
→ hash/proveniência
→ mapa campo a campo
→ identidade/chaves
→ cardinalidades
→ temporalidade
→ fixture sanitizada
→ reconciliação
→ validação R01–R16
→ DDL autorizado
```

**Estado final: especificação física preparatória consolidada.**

**GATE-FONTE-SED = RED / BLOCKED.**

**Produção física/DDL = BLOQUEADA até homologação E3.**
