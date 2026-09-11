# Escala de Substituição — Métricas Operacionais do Motor de Alocação v1

**Status:** CONCEITUAL / HARNESS-SAFE  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 11/09/2026

## 1. Objetivo

Além de escolher uma recomendação, a Escala precisa medir se o motor realmente reduz o tempo de resposta da gestão sem degradar cobertura, segurança ou auditabilidade.

As métricas abaixo são contratos de produto e não dependem de identificadores ou schema da SED.

## 2. Métricas de cobertura

### Taxa de cobertura

`covered_occurrences / total_uncovered_occurrences`

Mede quantas ocorrências descobertas receberam uma recomendação admissível.

### Cobertura máxima possível

Comparar a cobertura produzida com a cobertura máxima encontrada pelo algoritmo sob as restrições vigentes.

O motor não deve ser penalizado por ocorrências que são matematicamente/operacionalmente impossíveis de cobrir.

## 3. Métricas de decisão

### Tempo até recomendação

Tempo entre a entrada válida da ocorrência e a apresentação da primeira recomendação explicada.

A métrica deve separar cálculo algorítmico de eventuais tempos externos, como carregamento de fonte ou ação humana.

### Tempo até decisão humana

Tempo entre a recomendação e a confirmação, alteração ou rejeição por pessoa autorizada.

Não deve ser interpretado como desempenho individual sem contexto.

## 4. Métricas de qualidade

### Qualidade média da solução

Média do score dos pares efetivamente recomendados, sempre subordinada à cobertura máxima.

### Conflitos evitados

Quantidade de candidatos que poderiam atender individualmente uma ocorrência, mas foram deslocados ou descartados para evitar conflito global.

### Taxa de override

`human_overridden / human_decisions`

É indicador de adequação da recomendação, não de erro por si só. Deve ser analisado junto aos motivos do override.

## 5. Métricas de segurança

### Violações de restrição dura

Meta operacional: **zero**.

Qualquer seleção de candidato inelegível, indisponível ou incompatível com uma restrição dura deve ser tratada como falha crítica do motor.

### Recomendações sem explicação

Meta: **zero**.

Toda recomendação apresentada deve possuir explicação mínima e rastreável.

### Perda de rastreabilidade

Meta: **zero**.

Cada decisão deve permitir reconstruir snapshot, rule-set, plano, resultado e ação humana.

## 6. Métricas de resultado parcial

### Taxa de uncovered explicável

Percentual de ocorrências não cobertas que possuem reason code e evidências das restrições responsáveis.

Meta: **100%** dos `uncovered` explicáveis.

## 7. Métricas de determinismo

Para entradas idênticas e mesmo rule-set:

- mesma cobertura;
- mesma solução;
- mesma assinatura;
- mesma ordenação de alternativas.

Qualquer divergência inesperada é falha de reprodutibilidade.

## 8. Painel futuro

A gestão deverá conseguir visualizar, por período e unidade autorizada:

- ocorrências recebidas;
- recomendações geradas;
- cobertura;
- uncovered;
- tempo até recomendação;
- tempo até decisão;
- overrides;
- conflitos evitados;
- falhas críticas;
- determinismo/regressões.

Dados pessoais devem ser minimizados e exibidos conforme o perfil de acesso.

## 9. Regra de interpretação

As métricas servem para melhorar o motor e a operação. Não devem ser usadas isoladamente para avaliar professores ou produzir rankings individuais de desempenho.

## 10. Limites

Este documento não cria tabelas, endpoints ou identificadores de produção. Não define regras oficiais da SED. A implementação física depende da homologação do GATE-FONTE-SED.