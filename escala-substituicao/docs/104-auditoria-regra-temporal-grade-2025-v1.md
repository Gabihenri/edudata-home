# 104 — Auditoria da Regra Temporal da Grade SED 2025 v1

**Projeto:** Escala de Substituição  
**Status:** EVIDÊNCIA FUNCIONAL / CONTRATO TÉCNICO PENDENTE  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 2026-09-10

## 1. Evidência oficial

A documentação oficial da SED informa que alterações da Grade Horária passam a ser refletidas no Diário de Classe a partir das 05h00, considerando a última grade cadastrada até 04h59 do dia vigente.

A mesma comunicação explica que a alteração preserva o acesso a registros previstos na grade anterior, evitando perda de histórico de lançamento quando a grade é modificada durante o ano.

## 2. Implicação para a Escala

A escala de substituição não pode tratar a grade como uma fotografia estática. Uma ocorrência precisa ser relacionada a uma referência temporal da grade que estava válida para o período operacional considerado.

Modelo conceitual:

`grade_version → vigência temporal → ocorrência → ausência → necessidade de cobertura`

Isso reforça os contratos de snapshot, reexecução e detecção de mudança já definidos no projeto.

## 3. Regra de segurança

Uma mudança posterior da grade não deve apagar ou reinterpretar automaticamente uma ocorrência histórica que já fazia parte de uma rodada validada.

Se a grade relevante para uma ocorrência mudar materialmente antes da confirmação humana, a rodada antiga deve ser considerada potencialmente obsoleta e submetida à regra de comparação de snapshot.

## 4. Limites

A evidência comprova o comportamento temporal da plataforma, mas não fornece:

- identificador técnico da versão da grade;
- chave técnica da ocorrência;
- esquema de persistência;
- endpoint de consulta;
- contrato de exportação;
- algoritmo interno de versionamento.

Portanto, não autoriza implementação desses elementos por inferência.

## 5. Relação com os contratos existentes

A evidência fortalece especialmente:

- `docs/91-contrato-snapshot-operacional-v1.md`;
- `docs/92-estado-e-invalidez-do-snapshot-v1.md`;
- `docs/95-contrato-reexecucao-e-deteccao-mudanca-v1.md`;
- `docs/100-contrato-estados-mudanca-snapshot-v1.md`;
- R11/R12 da regressão sintética.

## 6. Conclusão

A regra temporal da grade é suficientemente forte para orientar o comportamento conceitual do motor, mas ainda não é suficiente para abrir o GATE-FONTE-SED.

O próximo artefato necessário continua sendo uma fonte técnica operacional atual, com estrutura e identificadores homologados.