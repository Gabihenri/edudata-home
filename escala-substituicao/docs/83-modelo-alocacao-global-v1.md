# 83 — Modelo de alocação global para múltiplas faltas

**Data:** 2026-09-11  
**Status:** CONCEITUAL / HARNESS-SAFE  
**GATE-FONTE-SED:** RED/BLOCKED

## Objetivo

Modelar a decisão quando várias ocorrências ficam descobertas no mesmo período e os mesmos docentes podem aparecer como candidatos para mais de uma ocorrência.

O motor não deve resolver cada vaga isoladamente. Deve otimizar um plano conjunto de cobertura, preservando as regras de elegibilidade e mantendo a decisão final sob validação humana.

## Entradas conceituais

- conjunto de ocorrências descobertas;
- intervalo temporal de cada ocorrência;
- unidade escolar e escopo operacional;
- componente/disciplina e turma;
- conjunto de docentes candidatos;
- disponibilidade observada;
- elegibilidade/habilitação;
- vínculo/regime aplicável;
- associação vigente;
- evidências de continuidade;
- pontuação e reason codes.

Os identificadores reais continuam abstratos até homologação do artefato SED.

## Restrições duras

Uma alocação candidata é inválida quando:

1. o docente não é elegível;
2. o docente não está disponível no intervalo;
3. o docente já foi alocado a uma ocorrência temporalmente incompatível;
4. o candidato viola o escopo operacional autorizado;
5. a associação/vigência necessária não puder ser comprovada pelo contrato de entrada;
6. a regra oficial aplicável impedir a cobertura.

## Objetivo de otimização

Entre planos válidos, maximizar a cobertura e depois a qualidade do conjunto de decisões.

Ordem conceitual de prioridade:

1. maximizar número de ocorrências cobertas;
2. preservar elegibilidade e restrições duras;
3. maximizar pontuação total dos candidatos;
4. favorecer continuidade quando homologada;
5. reduzir conflitos/remanejamentos;
6. aplicar desempate determinístico.

Não se deve usar uma soma de pesos para compensar uma violação de restrição dura.

## Resultado

Cada decisão deve retornar, no mínimo:

- ocorrência;
- candidato selecionado ou `uncovered`;
- candidatos alternativos elegíveis;
- pontuação;
- reason codes;
- restrições que eliminaram candidatos relevantes;
- conflitos evitados;
- versão do conjunto de regras;
- referência temporal da decisão;
- indicação de que a decisão requer validação humana.

## Caso parcial

Se não houver docentes suficientes, o motor deve retornar cobertura parcial, explicitando as ocorrências ainda descobertas. Não deve fabricar uma cobertura para atingir 100%.

## Reprodutibilidade

O plano deve ser reproduzível para o mesmo snapshot de entradas e mesmo rule-set. Mudanças posteriores de disponibilidade, associação ou regras devem produzir novo snapshot, sem sobrescrever a decisão histórica.

## Harness

O próximo teste sintético deverá conter pelo menos:

- 3 ocorrências simultâneas;
- 4 candidatos;
- pelo menos 2 candidatos disputados por ocorrências diferentes;
- uma restrição de elegibilidade;
- uma restrição de disponibilidade;
- um cenário com cobertura total;
- um cenário com cobertura parcial;
- empate determinístico;
- reason codes verificáveis.

## Limites

Este documento não autoriza:

- parser da SED;
- criação de DDL de produção;
- uso de CPF/DI como chave interna sem regra homologada;
- integração com endpoint não documentado;
- inferência de IDs técnicos;
- atribuição automática na SED.

**Conclusão:** o núcleo decisório pode avançar independentemente do GATE-FONTE-SED, desde que opere exclusivamente sobre contratos abstratos/fixtures sintéticos até a homologação da fonte.
