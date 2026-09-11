# Escala de Substituição — Contrato de Rodada de Alocação v1

**Status:** CONCEITUAL / HARNESS-SAFE  
**GATE-FONTE-SED:** RED/BLOCKED  
**Data:** 11/09/2026

## 1. Objetivo

Uma **rodada de alocação** representa uma execução completa do motor sobre um snapshot específico. Ela é a unidade de rastreabilidade entre o estado observado, o cálculo, a recomendação e a decisão humana.

## 2. Ciclo da rodada

```text
CRIADA
  ↓
SNAPSHOT VALIDADO
  ↓
CÁLCULO EM EXECUÇÃO
  ↓
RESULTADO GERADO
  ↓
RECOMENDAÇÕES DISPONÍVEIS
  ↓
VALIDAÇÃO HUMANA
  ↓
ENCERRADA
```

Uma rodada também pode terminar em estado de falha ou bloqueio antes de produzir recomendações.

## 3. Identidade conceitual

Cada rodada deve possuir, no mínimo:

- `allocation_run_reference`;
- `snapshot_reference`;
- `algorithm_version`;
- `rule_set_version`;
- instante de início;
- instante de término;
- estado da rodada;
- assinatura do conjunto de entradas;
- assinatura do resultado;
- contexto temporal operacional;
- referência de proveniência.

São identificadores conceituais. Não representam IDs ou colunas da SED.

## 4. Estados

Estados conceituais:

- `CREATED` — rodada registrada;
- `SNAPSHOT_VALIDATED` — snapshot apto para cálculo;
- `RUNNING` — cálculo em andamento;
- `COMPLETED` — resultado produzido;
- `HUMAN_VALIDATION` — aguardando decisão;
- `CLOSED` — ciclo encerrado;
- `BLOCKED` — execução impedida por condição conhecida;
- `FAILED` — erro técnico ou de consistência.

## 5. Atomicidade lógica

Uma rodada deve produzir um resultado coerente para o conjunto de ocorrências submetido. Não deve haver mistura silenciosa entre resultados de snapshots diferentes.

Se uma execução for interrompida, o estado deve deixar claro que o resultado é incompleto.

## 6. Resultado

O resultado deve conter, conceitualmente:

- ocorrências cobertas;
- ocorrências `uncovered`;
- candidato selecionado por ocorrência;
- score e critérios aplicados;
- alternativas;
- candidatos eliminados e restrições;
- conflitos evitados;
- assinatura determinística do plano;
- estado de validação humana.

## 7. Validação humana

A rodada não é encerrada somente porque o algoritmo terminou.

A conclusão operacional ocorre depois de cada recomendação ter recebido decisão autorizada ou ter sido explicitamente encerrada como sem cobertura.

## 8. Reexecução

Uma nova rodada deve ser criada quando houver mudança material no snapshot, nas regras ou no conjunto de ocorrências.

Não sobrescrever uma rodada anterior para simular uma nova execução.

## 9. Falhas e bloqueios

Exemplos conceituais:

- snapshot `STALE`;
- snapshot `INVALID`;
- informação obrigatória ausente;
- inconsistência temporal;
- falha do algoritmo;
- indisponibilidade de fonte necessária.

Cada bloqueio deve produzir motivo rastreável e não uma recomendação fictícia.

## 10. Métricas

A rodada é a unidade base para medir:

- tempo de cálculo;
- tempo até recomendação;
- cobertura;
- uncovered;
- overrides;
- conflitos evitados;
- falhas críticas;
- determinismo.

## 11. Auditoria

Ao encerrar, a rodada deve permitir reconstruir:

```text
snapshot
→ regras
→ algoritmo
→ entradas
→ plano
→ explicações
→ decisões humanas
→ estado final
```

## 12. Limites

Este contrato não define persistência física, API, parser ou integração com identificadores técnicos da SED. A implementação produtiva permanece condicionada ao fechamento do GATE-FONTE-SED.