# 169 — Auditoria da Regressão dos Consumidores do Role Canônico v1

**Data:** 2026-10-08
**Status:** 🟢 contrato de regressão fechado; 🔴 consumidores físicos ainda não alterados

## Resultado
A matriz C01–C24 foi reproduzida em PostgreSQL real como controle contratual.

- 24 casos totais;
- 21 casos de acesso/comportamento permitido;
- 3 casos de bloqueio: role desconhecido/ambíguo/suspenso;
- membership vence profile quando há conflito;
- alias de plataforma não homologado não eleva;
- contexto de outra organização não pode contaminar a resolução.

## Consumidores abrangidos
Identity Product, Agenda, Calendário Acadêmico, Support e Escala.

## Interpretação
A alteração futura das funções Core deve preservar esses comportamentos. O resolvedor central deve ser introduzido como camada de compatibilidade, sem criar uma segunda autorização.

## Gate
Antes da alteração física: comparar as funções atuais com esta matriz, preparar implementação central em ambiente controlado e executar regressão real dos consumidores. Nenhuma função de produção foi modificada nesta etapa.