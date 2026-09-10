# 65 — Auditoria de regra de vigência da Grade Horária SED 2025 v1

**Produto:** Escala de Substituição  
**Data:** 2026-09-10  
**Status:** AMARELO / evidência oficial forte para regra temporal; gate técnico permanece RED

## 1. Objetivo

Registrar a regra oficial de vigência da Grade Horária da SED identificada no Comunicado CITEM/DGREM/CVESC nº 6, de 10/03/2025, e avaliar seu impacto no modelo temporal da Escala.

## 2. Evidência oficial

O comunicado oficial da SEDUC informa que, a partir de 10/03/2025, alterações na Grade Horária passam a ser refletidas no Diário de Classe a partir das **05h00 do dia seguinte**. A grade vigente no dia da aula permanece válida para os registros daquele dia.

A comunicação explica que, mesmo após uma alteração de grade, registros referentes a uma aula anterior devem preservar a grade vigente no momento daquela aula. O relatório de frequência/registro de aulas ainda possuía, na data do comunicado, comportamento distinto quanto à vigência, sendo explicitamente apontado como melhoria futura.

Fonte oficial: Portal de Atendimento SEDUC-SP, **COMUNICADO CITEM/DGREM/CVESC N° 6 DE 10 DE MARÇO DE 2025 — Melhoria da grade horária (Alteração de regra)**. cite não inserir em documento interno

## 3. Controles confirmados

A evidência permite formalizar os seguintes requisitos para a Escala:

1. Grade horária não deve ser tratada como estado único sem histórico.
2. Alterações precisam possuir contexto temporal de vigência.
3. Uma ocorrência de aula deve ser resolvida contra a versão de grade válida para a data/hora da ocorrência.
4. Uma alteração posterior não pode retroagir automaticamente para modificar a obrigação acadêmica já ocorrida.
5. O motor não deve recalcular uma ocorrência histórica apenas porque uma versão mais nova da grade foi publicada.
6. A publicação de uma nova versão precisa preservar a versão anterior para auditoria e reprodução.

## 4. Impacto no modelo físico proposto

A regra reforça diretamente a necessidade de:

- `official_schedule_versions` com versionamento;
- `valid_from` / `valid_until` ou mecanismo temporal equivalente;
- `official_schedule_entries` associados à versão;
- `official_schedule_occurrences` materializando a obrigação para data/hora;
- hash/source reference para reconstrução da origem;
- distinção entre alteração da grade e ocorrência já consolidada.

A ocorrência continua sendo a unidade primária do motor de substituição porque é ela que permite determinar qual professor, turma, componente e intervalo temporal estavam vigentes no momento concreto da aula.

## 5. Consequência para substituição imediata

Este achado é especialmente importante para o objetivo operacional da Escala: resolver faltas que acontecem de forma imediata sem produzir uma decisão baseada em uma grade futura ou retroativa.

Exemplo conceitual:

- Dia D, 08h00: ocorrência de Física pertence à versão V1.
- Dia D, posteriormente: escola altera a grade para V2.
- V2 somente passa a vigorar no contexto indicado pela regra oficial.
- A ocorrência de D/08h00 continua vinculada ao contexto temporal de V1.

Logo, o motor deve consultar a ocorrência já resolvida ou reconstruí-la a partir da versão válida, e não simplesmente consultar a última grade cadastrada.

## 6. O que esta evidência NÃO resolve

O comunicado não revela:

- identificador técnico do professor;
- identificador técnico da turma;
- identificador técnico do componente;
- estrutura do banco;
- layout do Excel de exportação;
- endpoint/API;
- dicionário físico da Associação Professor–Classe;
- contrato atual de exportação.

Portanto, não altera o bloqueio existente sobre a implementação do adaptador SED.

## 7. Gate

### Regra temporal da Grade Horária
**GREEN:** evidência oficial direta e suficientemente específica para incorporar o requisito temporal ao modelo conceitual.

### Artefato físico da Grade/Associação
**RED:** ainda não homologado.

### Identidade técnica
**RED:** ainda não homologada.

### Parser/API/exportação
**RED:** ainda não homologados.

### Produção
**RED/BLOCKED:** a regra temporal pode orientar o contrato, mas não autoriza DDL produtivo nem ingestão automática.

## 8. Próximo passo

Prosseguir pela cadeia de evidência técnica:

`Exportação SED → layout/cabeçalhos → identificadores → tipos → vigência → hash/versionamento → parser → staging → homologação → publicação`

O objetivo imediato continua sendo obter o artefato atual gerado pela SED ou uma documentação oficial equivalente que permita validar o layout real.
