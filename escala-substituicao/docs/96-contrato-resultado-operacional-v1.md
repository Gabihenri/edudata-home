# Escala de Substituição — Contrato de Resultado Operacional v1

**Status:** CONCEITUAL / HARNESS-SAFE  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 11/09/2026

## 1. Objetivo

Separar claramente o que o algoritmo calculou daquilo que a gestão efetivamente decidiu e do que posteriormente foi registrado no sistema oficial.

## 2. Três camadas

```text
RESULTADO DO MOTOR
      ↓
DECISÃO HUMANA
      ↓
RESULTADO OPERACIONAL
      ↓
REGISTRO OFICIAL (quando aplicável)
```

Essas camadas não devem ser tratadas como sinônimas.

## 3. Resultado do motor

Representa exclusivamente a solução calculada sobre uma rodada:

- ocorrências cobertas;
- ocorrências sem cobertura;
- candidatos selecionados;
- score;
- critérios;
- alternativas;
- restrições;
- conflitos evitados;
- assinatura do plano.

Estado: recomendação, não atribuição.

## 4. Decisão humana

Registra a ação de pessoa autorizada:

- confirmou;
- alterou;
- rejeitou;
- deixou pendente.

Quando houver alteração, conservar o resultado original e registrar o novo caminho decisório.

## 5. Resultado operacional

Representa o estado resultante da decisão humana dentro da Escala. Deve indicar, por ocorrência:

- cobertura decidida;
- pessoa responsável pela decisão, conforme identidade homologada;
- momento da decisão;
- motivo/observação quando necessário;
- estado final;
- referência da rodada.

## 6. Registro oficial

A eventual correspondência com a SED deve ser tratada como etapa distinta. A Escala não deve declarar que uma decisão interna foi registrada oficialmente sem evidência da confirmação correspondente.

A estrutura técnica dessa integração depende do fechamento do GATE-FONTE-SED.

## 7. Estados conceituais

- `RECOMMENDED` — motor produziu recomendação;
- `CONFIRMED` — decisão humana confirmou;
- `OVERRIDDEN` — decisão humana substituiu a recomendação;
- `REJECTED` — recomendação rejeitada;
- `UNCOVERED` — ocorrência permanece sem cobertura;
- `OFFICIAL_PENDING` — aguardando confirmação externa, quando aplicável;
- `OFFICIAL_CONFIRMED` — confirmação externa comprovada.

## 8. Regra de integridade

Não promover automaticamente:

`RECOMMENDED → OFFICIAL_CONFIRMED`.

A confirmação externa deve possuir evidência própria.

## 9. Benefício operacional

Essa separação permite que a equipe use a Escala imediatamente, mesmo antes de uma integração técnica completa, sem confundir recomendação inteligente com autoridade administrativa.

## 10. Limites

Contrato conceitual e independente de schema. Não define API, parser, identificadores, tabelas ou procedimento técnico da SED.