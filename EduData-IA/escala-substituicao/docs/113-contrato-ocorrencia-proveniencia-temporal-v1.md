# 113 — Contrato de Ocorrência e Proveniência Temporal v1

**Status:** CONCEITUAL / PRONTO PARA HOMOLOGAÇÃO E3  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 16/09/2026

## 1. Objetivo

Definir o contrato conceitual mínimo para transformar dados acadêmicos oficiais em uma ocorrência operacional de aula sem confundir Associação, Grade, Calendário, registro de aula ou substituição.

Este documento não define DDL, parser, endpoint ou chave física da SED.

## 2. Evidência funcional atual

A documentação oficial da SED informa que os horários exibidos no Diário dependem do horário cadastrado na Aba 1 da Associação do Professor à Classe e da Grade Horária; sem Grade cadastrada, o sistema pode disponibilizar horários incorretos para lançamento. A SED também informa que alterações de Grade passam a ser refletidas no Diário a partir das 05h00, considerando a última Grade cadastrada até 04h59 do dia vigente. O relatório de frequência, naquele comunicado, ainda não refletia a vigência histórica da Grade. [E1]

A documentação operacional também estabelece que, para as turmas aparecerem corretamente ao professor, devem estar ajustados Matriz Curricular, atribuição dos professores às turmas, Calendário Escolar e Grade Horária. [E1]

Fontes: SED-05190; SED-08189; FAQ Professor Presente/Sala do Futuro; orientações operacionais 2026.

## 3. Entidades que permanecem distintas

```text
Matriz Curricular
      ≠
Associação do Professor à Classe
      ≠
Horário da Associação
      ≠
Grade Horária
      ≠
Calendário Escolar
      ≠
Ocorrência de aula
      ≠
Ausência
      ≠
Necessidade/vaga de cobertura
      ≠
Substituição efetivamente indicada
```

Nenhuma dessas equivalências pode ser criada apenas por nome, descrição ou coincidência temporal.

## 4. Contrato conceitual da ocorrência

Uma ocorrência operacional deve possuir, conceitualmente:

```text
occurrence
├── academic_context
├── teacher_assignment_context
├── calendar_reference
├── grade_reference
├── schedule_reference
├── effective_interval
├── source_provenance
├── source_version
├── completeness_state
└── reconciliation_state
```

Os nomes acima são nomes conceituais. Não representam nomes de colunas ou IDs físicos da SED.

## 5. Regra de materialização

A ocorrência somente pode ser materializada quando houver evidência suficiente de que:

```text
contexto acadêmico
        +
associação docente válida
        +
grade válida para a referência temporal
        +
calendário aplicável
        +
horário compatível
        ↓
OCORRÊNCIA
```

Se a relação não puder ser determinada, o resultado deve ser `SOURCE_UNCERTAIN`, `REVIEW_REQUIRED` ou `BLOCKED`, conforme o contrato de staging. Não deve haver inferência silenciosa.

## 6. Regra temporal

A Escala deve preservar a referência temporal da Grade utilizada para formar a ocorrência.

Uma alteração posterior da Grade não deve sobrescrever retroativamente uma ocorrência já materializada sem criar nova versão/rodada e sem preservar a proveniência anterior.

A regra funcional atualmente documentada pela SED sobre atualização às 05h00 deve ser tratada como evidência temporal da fonte, e não como autorização para inventar um campo físico de versão.

## 7. Relatório de frequência não é fonte primária da Grade temporal

O relatório de frequência/registro de aulas não deve ser usado para reconstruir a Grade histórica quando sua própria documentação declarar que considera somente a Grade mais recente.

Portanto:

```text
GRADE + ASSOCIAÇÃO + CALENDÁRIO + TEMPO
                  ↓
          OCORRÊNCIA
```

não:

```text
RELATÓRIO DE FREQUÊNCIA
          ↓
   reconstrução da Grade
```

## 8. Multiplicidade

A existência de múltiplos horários, múltiplas aulas do mesmo componente ou múltiplos professores associados não autoriza colapsar registros.

Cada ocorrência temporalmente distinta permanece distinta.

Múltiplos professores associados também não significam automaticamente que todos sejam responsáveis efetivos pela ocorrência. A responsabilidade efetiva depende da relação oficial homologada.

Este contrato dá suporte direto às regressões R15 e R16.

## 9. Proveniência obrigatória

Para cada ocorrência materializada deverão ser preserváveis, quando fornecidos pela fonte:

- fonte/sistema de origem;
- artefato ou lote de origem;
- data/hora de aquisição;
- referência temporal;
- versão da fonte;
- escola/ano letivo;
- estado de publicação;
- evidência usada na reconciliação;
- estado de completude.

Nenhum desses campos deve ser preenchido por suposição.

## 10. Estados de reconciliação

```text
RESOLVED
AMBIGUOUS
UNRESOLVED
BLOCKED
SOURCE_UNCERTAIN
```

Somente uma relação resolvida e validada pode avançar para consumo operacional, respeitando os demais gates.

## 11. Relação com o motor de substituição

O motor não deve receber diretamente uma linha bruta de Associação ou Grade.

Fluxo obrigatório:

```text
ARTEFATO SED
   ↓
RAW
   ↓
NORMALIZAÇÃO
   ↓
MATCHING
   ↓
VALIDAÇÃO TEMPORAL
   ↓
OCORRÊNCIA HOMOLOGADA
   ↓
AUSÊNCIA
   ↓
NECESSIDADE DE COBERTURA
   ↓
CANDIDATOS
   ↓
RESTRIÇÕES DURAS
   ↓
ALOCAÇÃO GLOBAL
```

## 12. Relação com R01–R16

A ocorrência deve chegar ao motor somente depois da reconciliação necessária para executar R01–R16.

R15 exige preservação da multiplicidade de ocorrências do mesmo componente. R16 exige que múltiplas associações permaneçam contexto e não sejam convertidas automaticamente em responsabilidade efetiva.

Executar R01–R16 em um artefato real não transforma, por si só, a fonte em oficial; a autoridade da fonte, os IDs, as chaves, a vigência e a proveniência continuam sendo gates independentes.

## 13. O que permanece bloqueado

Sem artefato E3 atual, continuam bloqueados:

- definição de IDs físicos da SED;
- definição de chaves físicas;
- parser produtivo;
- sincronização produtiva;
- FKs físicas para entidades acadêmicas SED;
- DDL produtivo;
- publicação de ocorrências oficiais;
- atribuição automática oficial.

## 14. Critério para próxima etapa

Quando chegar um artefato E3 real, a primeira análise deverá responder:

1. quais campos identificam professor;
2. quais campos identificam classe/subturma;
3. quais campos identificam componente;
4. qual registro representa Associação;
5. qual registro representa Grade/horário;
6. como os registros se relacionam;
7. como a vigência é expressa;
8. como alterações são versionadas;
9. qual é o estado de publicação;
10. qual é a proveniência do arquivo;
11. quais cardinalidades existem;
12. quais situações correspondem a R15/R16.

Somente depois dessas respostas o contrato físico poderá ser especificado.

## 15. Estado final

A semântica funcional e temporal está suficientemente documentada para orientar a homologação. O contrato físico continua deliberadamente aberto até a chegada do artefato técnico atual da SED.

**GATE-FONTE-SED = RED/BLOCKED.**
