# 116 — Matriz de Evidências SED: Grade × Associação v1

**Status:** CONCEITUAL / PRONTO PARA PREENCHIMENTO E3  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 16/09/2026

## 1. Objetivo

Registrar, de forma controlada, o que a documentação oficial atual da SED comprova sobre a cadeia Grade × Associação e separar claramente:

- fato funcional comprovado;
- elemento técnico ainda não comprovado;
- evidência necessária no primeiro artefato E3;
- consequência para a Escala de Substituição.

Este documento não cria IDs, chaves, endpoints ou estrutura física.

## 2. Evidências funcionais atuais

A documentação oficial informa que os horários exibidos no Diário são os cadastrados na Aba 1 da Associação do Professor à Classe e na Grade Horária. Também informa que, sem Grade cadastrada, podem aparecer todos os horários disponíveis ao professor, com risco de lançamentos incorretos. [SED-05190]

A SED também documenta que a Grade Horária é uma etapa própria e que a Associação possui cadastro de horário próprio. O catálogo oficial mantém artigos separados para esses procedimentos e para aulas em substituição na Associação.

A SED-08189 documenta que alterações de Grade passaram a ser refletidas no Diário a partir das 05h00, considerando a última Grade cadastrada até 04h59 do dia vigente, e descreve preservação de registros associados à Grade anterior. O mesmo comunicado alerta que o relatório de frequência ainda não refletia, naquele momento, a vigência histórica da Grade.

A FAQ Professor Presente informa que a Sala do Futuro depende, entre outras etapas, de atribuição dos professores às turmas, homologação do calendário e cadastro da Grade Horária.

## 3. O que essas evidências NÃO comprovam

As fontes públicas consultadas não comprovam, por si só:

- ID técnico canônico do professor;
- ID técnico canônico da turma/subturma;
- ID técnico do componente;
- ID técnico da Associação;
- ID técnico da Grade/horário;
- chave física Associação ↔ Grade;
- formato de exportação atual;
- contrato de API;
- versionamento físico;
- mecanismo de sincronização;
- periodicidade de atualização do artefato;
- regra de publicação técnica consumível pelo motor.

Nenhum desses elementos deve ser inferido da interface, nome, CPF, e-mail, posição de coluna ou dado histórico.

## 4. Matriz de homologação E3

| Elemento | Evidência funcional | Evidência técnica necessária | Estado |
|---|---|---|---|
| Professor | Associação/atribuição documentada | identificador oficial no artefato | RED |
| Turma/subturma | Associação/Sala do Futuro documentadas | identificador oficial no artefato | RED |
| Componente | Matriz/Associação documentadas | identificador oficial e regra de representação | RED |
| Associação | processo oficial documentado | chave/ID e cardinalidade | RED |
| Horário da Associação | Aba 1 documentada | campos e chave de referência | RED |
| Grade | cadastro e relatório documentados | identidade, versão e vigência | RED |
| Associação ↔ Grade | relação funcional observada | chave/relacionamento técnico | RED |
| Calendário | homologação necessária | identidade/vigência aplicável | RED |
| Ocorrência | derivação conceitual | evidência das relações e vigência | RED |
| Publicação | processos operacionais documentados | status técnico consumível | RED |

## 5. Consequência arquitetural

Até a homologação E3, a Escala não deve consumir uma linha bruta de Associação como ocorrência.

O fluxo permanece:

```text
ASSOCIAÇÃO
   ↓
HORÁRIO DA ASSOCIAÇÃO
   ↓
GRADE + VIGÊNCIA
   ↓
CALENDÁRIO
   ↓
RECONCILIAÇÃO
   ↓
OCORRÊNCIA HOMOLOGADA
   ↓
AUSÊNCIA / NECESSIDADE
   ↓
MOTOR DE SUBSTITUIÇÃO
```

Se uma relação crítica estiver ausente ou ambígua, o resultado deve ser `SOURCE_UNCERTAIN`, `REVIEW_REQUIRED` ou `BLOCKED`, nunca uma inferência silenciosa.

## 6. Testes a executar quando E3 chegar

O primeiro artefato real deve permitir confrontar, quando disponível:

1. identidade do professor;
2. identidade da turma/subturma;
3. componente;
4. Associação;
5. horário;
6. Grade;
7. relação Associação ↔ Grade;
8. vigência;
9. alteração temporal;
10. multiplicidade de horários;
11. múltiplos professores associados;
12. aulas em substituição;
13. R15 e R16;
14. reconciliação de uma ocorrência completa.

## 7. Regra de atualização

Uma alteração posterior da Grade não deve apagar silenciosamente uma ocorrência histórica já reconciliada. A temporalidade observada na documentação deve ser preservada no modelo de ocorrência, mas o campo físico de versão somente será definido após evidência E3.

## 8. Gate

**Arquitetura:** GREEN  
**Contrato de ocorrência:** GREEN  
**Evidência funcional SED:** GREEN  
**Evidência técnica E3:** RED  
**IDs/chaves:** RED  
**Parser produtivo:** RED  
**DDL produtivo:** RED  
**GATE-FONTE-SED:** RED/BLOCKED

O desbloqueio depende do artefato técnico atual autorizado e de sua homologação, não apenas da documentação funcional.
