# 103 — Auditoria da Cadeia Matriz → Associação → Grade → Substituição 2026 v1

**Projeto:** Escala de Substituição  
**Status:** EVIDÊNCIA FUNCIONAL FORTE / HOMOLOGAÇÃO TÉCNICA PENDENTE  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 2026-09-10

## 1. Objetivo

Consolidar evidência oficial atual sobre a dependência entre Matriz Curricular, atribuição/associação de professores, Grade Horária e operação de substituição, sem promover essa evidência funcional a contrato de API ou banco de dados.

## 2. Evidência oficial atual

O Portal de Atendimento da SED informa que, para que as respectivas turmas sejam corretamente refletidas na Sala do Futuro Professor, devem estar ajustadas as etapas de:

1. homologação da Matriz Curricular;
2. atribuição dos professores às turmas;
3. homologação do Calendário Escolar;
4. cadastro da Grade Horária.

O mesmo material informa que o cadastro de horário utilizado no Diário de Classe corresponde aos horários cadastrados na Associação do Professor à Classe e Grade Horária. Sem esse cadastro, o sistema pode apresentar horários disponíveis de forma ampla, com risco de lançamentos incorretos.

## 3. Consequência arquitetural

A evidência reforça a separação conceitual já adotada no projeto:

`Matriz → Turma/atribuição → Associação → Grade Horária → ocorrência temporal → ausência → necessidade de cobertura → candidatos → alocação → validação humana → substituição operacional`

Essa cadeia não significa que todos os objetos sejam uma única entidade ou que suas chaves técnicas sejam conhecidas.

## 4. Implicação para o motor

O motor não deve tratar uma associação professor-classe isolada como prova suficiente de que uma aula específica está ocorrendo naquele período.

Para uma recomendação de substituição, é necessário haver evidência temporal suficiente para determinar a ocorrência afetada e sua relação com a associação/grade vigente.

Isso preserva as conclusões anteriores do projeto sobre:

- vigência;
- conflito temporal;
- múltiplas faltas simultâneas;
- disponibilidade;
- elegibilidade;
- escopo da unidade;
- necessidade de validação humana.

## 5. O que a evidência NÃO prova

A documentação funcional atual não fornece, por si só:

- nomes de tabelas;
- nomes de colunas de banco;
- chaves primárias;
- IDs internos oficiais;
- contrato REST/GraphQL;
- formato atual de exportação operacional;
- endpoint autorizado de integração;
- regra técnica de reconciliação entre CPF, DI, professor, turma ou componente.

Portanto, nenhum desses elementos deve ser inferido a partir da interface ou da documentação funcional.

## 6. Relação com substituição

A documentação atual do Professor Presente confirma que a gestão pode indicar substitutos e, em caso de múltiplas faltas, priorizar professores disponíveis da própria unidade e remanejar estrategicamente os recursos quando necessário.

Essa evidência sustenta o comportamento conceitual do motor de alocação global já especificado, mas não substitui a homologação do artefato técnico da fonte.

## 7. Decisão

**Evidência funcional:** FORTE.  
**Contrato técnico operacional:** PENDENTE.  
**Parser de produção:** BLOQUEADO.  
**DDL produtivo:** BLOQUEADO.  
**Integração por endpoint não documentado:** BLOQUEADO.  
**GATE-FONTE-SED:** RED/BLOCKED.

## 8. Próximo passo prioritário

Obter um artefato técnico operacional atual e verificável que permita confirmar, de forma não inferida:

- identidade docente;
- identidade da turma/subturma;
- identidade do componente;
- associação;
- grade/ocorrência;
- vigência;
- versão;
- proveniência;
- contrato de atualização.

Até lá, os harnesses sintéticos e contratos comportamentais permanecem como camada segura de desenvolvimento.