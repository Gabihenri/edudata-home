# 116 — Auditoria E3/SED — Evidência Pública Atualizada

**Data:** 29/09/2026  
**Status:** EVIDÊNCIA SEMÂNTICA ATUALIZADA / GATE TÉCNICO AINDA RED

## Evidência oficial atual

A documentação pública atual da SED confirma que os horários usados no Diário de Classe são derivados da Aba 1 da Associação do Professor à Classe e da Grade Horária. A própria SED alerta que, sem Grade Horária cadastrada, podem aparecer todos os horários disponíveis para o professor, com risco de lançamentos incorretos.

Fonte oficial: SED-11257.

A documentação atual também registra que, para docentes com mais de um DI, o DI ativo em Funcionário deve corresponder ao DI usado na Atribuição; divergência exige refazer a associação para que turmas/componentes apareçam corretamente.

Fonte oficial: SED-07774, atualizado em 23/02/2026.

O catálogo público atual continua apresentando operações distintas para Associação do Professor à Classe, associação em mais de uma escola, substituição e edição do Cadastro de Horário do Professor à Classe.

## O que esta nova verificação confirma

1. Associação e Grade permanecem entidades operacionais distintas.
2. O horário efetivamente utilizado pelo Diário depende da coerência entre Associação e Grade.
3. DI possui relevância operacional na identidade do docente.
4. Multi-escola exige contexto institucional.
5. Substituição possui operações próprias na SED.
6. Alterações de associação/horário têm efeitos operacionais e temporais.

## O que continua sem evidência técnica pública suficiente

A pesquisa pública não forneceu:

- ID técnico atual da Associação;
- ID técnico atual da Grade;
- chave técnica Associação ↔ Grade;
- chave técnica da turma/subturma;
- chave técnica do componente;
- layout oficial XLSX/CSV operacional;
- cardinalidades;
- contrato de versionamento;
- endpoint/API operacional autorizado;
- regra técnica completa de atualização/exportação.

Portanto, a nova evidência melhora a confiança semântica, mas **não promove o gate para E3 técnico**.

## Decisão

Não alterar:

- parser;
- DDL;
- schema acadêmico;
- vínculo de identidade;
- chaves técnicas;
- sincronização.

A documentação pública continua sendo E1/E2. O nível E3 exigido pelo protocolo permanece dependente de um artefato operacional autorizado.

## Próximo passo

Obter um pequeno recorte atual e autorizado de Associação Professor–Classe + Grade Horária, preferencialmente XLSX/CSV ou relatório institucional equivalente, preservando sua proveniência antes de qualquer sanitização.

**GATE-FONTE-SED: 🔴 RED/BLOCKED.**
