# Auditoria 80 — Campos observáveis da Associação do Professor à Classe

**Data:** 2026-09-11  
**Status:** AMARELO/RED — evidência histórica útil; contrato atual ainda não homologado.

## Objetivo

Identificar quais conceitos e campos são explicitamente documentados em artefatos oficiais da SED para a Associação do Professor à Classe, sem promover documentação histórica a contrato técnico vigente.

## Evidência oficial

O tutorial oficial da SED de 2018 descreve o fluxo em três etapas diretamente relevantes para a Escala:

1. cadastro do horário da aula;
2. associação do professor à turma;
3. associação do professor aos horários da turma.

Na etapa de horário são documentados: turno, dia da semana, turma, duração, intervalo e horários de início/término.

Na etapa de associação são documentados: DI, tipo de ensino, turma, disciplina, indicação de atribuição em substituição, tipo de atribuição, fase de atribuição, início da vigência e fim da vigência.

O tutorial também descreve que a associação em substituição pode substituir o professor anterior em uma ou mais associações e que a terceira etapa atualiza automaticamente o professor associado aos horários quando ocorre a substituição.

## Consequência para a Escala

O conjunto mínimo de conceitos necessários para a reconciliação é confirmado documentalmente em nível semântico:

- identidade do docente;
- escola/DE;
- turma;
- componente/disciplina;
- horário;
- vigência;
- tipo/fase de atribuição;
- indicação de substituição.

## Limitação crítica

Os documentos históricos não autorizam assumir que os nomes, códigos, tipos SQL, chaves ou IDs internos permanecem iguais em 2026. O tutorial é evidência de domínio e fluxo, não especificação do contrato atual.

O TCE-SP também documenta que, para cruzamentos de dados, registros de associação sem horário na Grade Horária foram desconsiderados, reforçando que associação e grade devem ser tratados conjuntamente e temporalmente.

## Decisão

Não criar parser ou DDL de produção com base nestes nomes históricos.

Usar esta auditoria como checklist de homologação do export vigente. Quando o artefato autorizado chegar, cada campo deverá ser classificado como:

- confirmado;
- equivalente documentado;
- não encontrado;
- ambíguo;
- dependente de regra de negócio.

## Gate

**GATE-FONTE-SED permanece RED/BLOCKED.**

O próximo artefato de fechamento continua sendo um export vigente da Associação/Grade e seu dicionário ou especificação oficial.
