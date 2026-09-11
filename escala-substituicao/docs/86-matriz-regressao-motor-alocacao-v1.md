# 86 — Matriz de regressão do motor de alocação v1

**Data:** 2026-09-11  
**Status:** CONCEITUAL / HARNESS-SAFE  
**GATE-FONTE-SED:** RED/BLOCKED

## Objetivo

Transformar os cenários adversariais em uma matriz mínima de regressão. Qualquer implementação futura do motor deve preservar estes comportamentos, independentemente da tecnologia usada.

| ID | Cenário | Invariante | Resultado esperado |
|---|---|---|---|
| R01 | 3 ocorrências / 2 professores | cobertura máxima | 2 cobertas + 1 uncovered |
| R02 | empate de score | determinismo | mesma assinatura |
| R03 | conflito temporal | restrição dura | professor não reutilizado |
| R04 | inelegível com score maior | elegibilidade | candidato excluído |
| R05 | indisponível com score maior | disponibilidade | candidato excluído |
| R06 | nenhum candidato válido | segurança | uncovered explícito |
| R07 | pesos alterados | prioridade das restrições | restrição dura permanece inviolável |
| R08 | solução parcial | explicabilidade | reason code + alternativas |
| R09 | mesmo snapshot repetido | reprodutibilidade | mesma solução |
| R10 | override humano | governança | plano original preservado |

## Ordem de avaliação

1. validar restrições duras;
2. construir soluções admissíveis;
3. maximizar cobertura;
4. maximizar qualidade;
5. aplicar critérios secundários homologados;
6. desempatar deterministicamente;
7. gerar explicação;
8. exigir validação humana.

## Critério de falha

É regressão quando uma alteração:

- aumenta score sacrificando cobertura;
- permite conflito temporal;
- seleciona inelegível/indisponível;
- produz resultado diferente para o mesmo snapshot/rule-set;
- transforma `uncovered` em atribuição fictícia;
- perde a explicação ou o plano original após override.

## Escopo

Esta matriz é deliberadamente independente da fonte técnica da SED. Os dados usados nos testes são fictícios. Não define schema de produção, identificadores SED, parser ou API.

A homologação da fonte permanece pré-condição para qualquer adaptação ao contrato físico real.