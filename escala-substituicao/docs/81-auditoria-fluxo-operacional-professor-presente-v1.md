# Auditoria 81 — Fluxo operacional Professor Presente e substituição

**Data:** 2026-09-11  
**Status:** AMARELO — fluxo operacional confirmado; contrato técnico de integração ainda não homologado.

## Objetivo

Consolidar a evidência oficial de 2025 sobre o ponto em que a necessidade de substituição é operacionalizada na SED, sem transformar campos de interface em schema de produção.

## Evidência

O FAQ oficial SED-08024 confirma o caminho:

`SED > Recursos Humanos > Professor Presente > Gestão Presença Professor`

Nesse módulo, o Trio Gestor/GOE pode visualizar e gerenciar a presença dos professores e indicar substitutos quando necessário.

A documentação operacional localizada em 2025 descreve a indicação com dados de **data, diretoria, escola e tipo**, seguida da seleção de **turno, disciplina e turma**, e indicação do substituto por **CPF/DI**.

A mesma evidência registra que a indicação de substituição pode ser excluída quando incorreta.

## Consequências para o domínio Escala

A Escala deve distinguir pelo menos:

1. ocorrência/aula afetada;
2. ausência do professor regente;
3. indicação operacional de substituição;
4. docente efetivamente designado;
5. registro posterior da aula/frequência pelo substituto.

Não é correto modelar a substituição apenas como uma alteração permanente da Associação Professor–Classe.

## PEI

O FAQ oficial SED-08024 informa que, nas escolas PEI, diante de falta-dia ou falta-aula, o Trio Gestor deve designar professor da própria unidade e cadastrá-lo como responsável temporário pela turma para permitir os registros correspondentes.

Portanto, o motor deverá tratar **regra de população de candidatos** como regra contextual da unidade/regime, e não como simples ranking universal.

## Múltiplas ausências

A mesma documentação oficial orienta que, quando faltarem vários professores no mesmo turno, a gestão deve priorizar professores disponíveis da própria unidade e, se insuficiente, assumir/remanejar salas estrategicamente.

Isso valida a necessidade de uma etapa de **alocação global**, além do ranking individual de candidatos.

## Decisão arquitetural

O fluxo operacional da Escala fica consolidado como:

`grade oficial → ocorrência → ausência → necessidade → candidatos elegíveis → alocação/ranking → validação humana → indicação de substituição → registro da aula`

A indicação feita na SED deve ser tratada como evidência operacional de substituição, não como fonte primária para reconstruir a grade oficial.

## Limitação

CPF/DI e demais nomes observados em documentação operacional são evidência de interface/processo. Não devem ser convertidos automaticamente em chaves internas, tipos SQL ou contratos de API.

## Gate

**GATE-FONTE-SED permanece RED/BLOCKED.**

O contrato físico de produção continua condicionado à obtenção de export/especificação técnica vigente e autorizada da Associação/Grade e dos identificadores oficiais necessários para reconciliação.
