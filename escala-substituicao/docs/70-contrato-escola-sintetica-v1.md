# 70 — Contrato da Escola Sintética v1

**Produto:** Escala de Substituição  
**Data:** 2026-09-18  
**Status:** CONTRATO IMPLEMENTÁVEL — fixture sintético sem valor oficial  
**Escopo:** preparação da rodada operacional multi-ausência

## 1. Objetivo

Estabelecer uma fixture sintética determinística que permita testar o ciclo completo da Escala sem depender da fonte SED:

`Snapshot → necessidades → elegibilidade → matriz de candidatos → alocação global → recomendação → decisão humana → novo Snapshot`

A fixture não representa uma escola real e não pode ser promovida a dado oficial.

## 2. Dimensão mínima

A Escola Sintética v1 deve conter:

- 12 professores;
- 6 turmas;
- 5 dias letivos;
- 7 períodos por dia;
- componentes curriculares de Ciências da Natureza, Matemática, Linguagens e Humanidades;
- disponibilidade explícita por professor e período;
- restrições duras;
- aulas já atribuídas;
- compromissos não-aula;
- ausências simultâneas;
- pelo menos um cenário sem candidato elegível;
- pelo menos um cenário em que a decisão localmente melhor não seja a melhor alocação global.

## 3. Identidade sintética

Todos os identificadores devem ser internos e claramente não-oficiais:

- `teacher-s01` … `teacher-s12`;
- `class-s01` … `class-s06`;
- `occ-sYYYYMMDD-pN`;
- `absence-sNNN`;
- `vacancy-sNNN`;
- `snapshot-sNNN`;
- `round-sNNN`.

Não utilizar CPF, DI, nome de pessoa real, matrícula SED ou qualquer identificador que possa ser confundido com identidade oficial.

## 4. Entidades

### Professor

Campos mínimos:

- `id`
- `display_name`
- `subjects`
- `eligible_for_substitution`
- `availability`
- `restrictions`
- `assignments`
- `commitments`

### Turma

Campos mínimos:

- `id`
- `display_name`
- `grade_level`
- `shift`

### Ocorrência

Campos mínimos:

- `id`
- `date`
- `period`
- `start_time`
- `end_time`
- `class_id`
- `subject`
- `teacher_id`

A ocorrência é a unidade temporal executável da substituição.

### Ausência

Campos mínimos:

- `id`
- `occurrence_id`
- `reason_code`
- `reported_at`
- `status`

A ausência não altera retroativamente a ocorrência original.

### Vaga

Campos mínimos:

- `id`
- `absence_id`
- `occurrence_id`
- `status`

A vaga representa a necessidade operacional produzida pela ausência.

## 5. Regras duras

Um candidato deve ser removido antes do score quando:

1. estiver inelegível;
2. estiver indisponível no intervalo da ocorrência;
3. possuir outra aula no mesmo intervalo;
4. possuir compromisso incompatível no mesmo intervalo;
5. estiver impedido especificamente para a ocorrência;
6. não possuir aderência curricular mínima homologada para o cenário sintético;
7. já estiver alocado em outra vaga da mesma rodada quando a reutilização simultânea for incompatível.

Nenhum score pode superar uma restrição dura.

## 6. Alocação global

Para um conjunto de vagas simultâneas:

1. gerar candidatos válidos para cada vaga;
2. construir a matriz vaga × candidato;
3. considerar combinações globalmente;
4. maximizar primeiro a cobertura;
5. maximizar depois a qualidade total entre soluções de mesma cobertura;
6. aplicar somente critérios secundários explicitamente definidos;
7. desempatar de forma determinística.

Resultado:

- `RECOMMENDED`
- `UNCOVERED`

Quando houver decisão humana:

- `HUMAN_OVERRIDE`

A decisão humana é preservada e o restante da alocação é recalculado.

## 7. Estado operacional

O snapshot deve representar a fotografia usada no cálculo:

- disponibilidade;
- compromissos;
- aulas já atribuídas;
- restrições;
- ocorrências;
- ausências;
- vagas.

Mudança material em qualquer elemento relevante deve:

1. invalidar a rodada calculada;
2. impedir validação da recomendação antiga;
3. preservar a rodada anterior;
4. gerar novo snapshot;
5. permitir novo cálculo global.

## 8. Cenários obrigatórios

A fixture deve permitir reproduzir deterministicamente:

### C01 — Cobertura simples

Uma ausência e pelo menos dois candidatos válidos.

### C02 — Conflito duro

O candidato de maior score possui conflito temporal e deve ser eliminado.

### C03 — Múltiplas faltas simultâneas

Três ou mais vagas no mesmo período, com candidatos compartilhados.

### C04 — Otimização global

O candidato de maior score para uma vaga deve ser reservado para outra vaga quando isso aumentar a cobertura global ou a qualidade sob a mesma cobertura.

### C05 — Sem cobertura

Uma vaga sem candidato válido deve permanecer explicitamente `UNCOVERED`.

### C06 — Override humano

Uma escolha humana deve permanecer fixa enquanto as demais vagas são recalculadas.

### C07 — Mudança material

Alterar a disponibilidade de um professor usado na rodada deve invalidar o snapshot e impedir a validação da escala anterior.

### C08 — Histórico

Cada rodada deve permanecer comparável à anterior, incluindo cobertura, qualidade, alocações e motivo de alteração.

## 9. Critério de determinismo

Dado o mesmo snapshot e as mesmas decisões humanas:

`resultado(snapshot, decisões) = resultado(snapshot, decisões)`

A ordem dos registros de entrada não pode alterar o resultado final.

O desempate deve utilizar uma ordenação estável baseada nos identificadores sintéticos.

## 10. Relação com SED

Esta fixture é exclusivamente sintética.

Ela não valida:

- layout atual de exportação SED;
- nomes físicos de tabelas SED;
- chaves técnicas SED;
- CPF ou DI como chave canônica;
- API SED;
- DDL de produção;
- atribuição oficial.

O **GATE-FONTE-SED permanece RED/BLOCKED**.

## 11. Próxima implementação

A partir deste contrato, o próximo artefato de código autorizado é:

`escala-substituicao/mvp/data/escola-sintetica-v1.json`

Esse fixture deverá implementar os cenários C01–C08 sem introduzir dependência da fonte SED.

## 12. Regra de avanço

`Definir → Implementar → Auditar → Corrigir → Validar → Registrar → Avançar`

Nenhum dado sintético deste contrato deve ser interpretado como dado acadêmico oficial.
